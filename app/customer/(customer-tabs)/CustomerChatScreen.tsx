import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chat } from '../../../data/chat-data';
import { ChatMessage, ChatUpdateData, customerChatSocket } from '../../../lib/chat-socket';
import { chatService } from '../../../services/chatService';

import { useUnread } from '../../../contexts/UnreadContext';

export default function ChatScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const { user } = useAuth();

const { unreadCount, setUnreadCount } = useUnread();

  useEffect(() => {
    initializeChat();
    return () => {
      // Cleanup socket listeners
      customerChatSocket.disconnect();
    };
  }, []);

  const initializeChat = async () => {
    try {
      // Connect to socket as customer
      const connected = await customerChatSocket.connect(user?.id, 'customer');
      setSocketConnected(connected);
      
      if (!connected) {
        Alert.alert('Connection Error', 'Failed to connect to chat service. You can still view messages but real-time updates won\'t work.');
      }

      // Set up socket listeners
      setupSocketListeners();
      
      // Load chats from API
      await loadChats();
      
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  };

  const refreshChats = async () => {
    setRefreshing(true);
    try {
      await loadChats();
    } catch (error) {
      console.error('Error refreshing chats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const setupSocketListeners = () => {
    // Listen for new messages
    customerChatSocket.onMessage((message: ChatMessage) => {
      updateChatWithNewMessage(message);
    });

    // Listen for chat updates (real-time chat list updates)
    customerChatSocket.onChatUpdate((update: ChatUpdateData) => {
      console.log('[CustomerChatScreen] Received chat_updated event:', update);
      handleChatUpdate(update);
    });

    // Listen for connection changes
    customerChatSocket.onConnection((connected) => {
      setSocketConnected(connected);
    });

    // Listen for errors
    customerChatSocket.onError((error) => {
      console.error('Socket error:', error);
    });
  };

  const loadChats = async () => {
    try {
      if (!user?.id) {
        console.log('No user found for loading chats');
        return;
      }
      
      console.log('Loading chats for customer:', user.id);
      const apiChats = await chatService.getUserChats(user.id);
      console.log('API chats response:', apiChats);
      
      const transformedChats = apiChats.map(chat => transformApiChatForCustomer(chat));
      
      const totalUnreadCount = transformedChats.reduce(
        (sum, chat) => sum + (chat.unread_count || 0),
        0
      );

      // Sort chats by latest message time (most recent first)
      const sortedChats = transformedChats.sort((a, b) => {
        return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
      });
      
      console.log('Transformed and sorted chats:', sortedChats);
      
      setChats(sortedChats);
      
    } catch (error) {
      console.error('Error loading chats:', error);
      
      // For development, show the actual error but don't crash the app
      if (__DEV__) {
        Alert.alert('Development Error', `Failed to load chats: ${error instanceof Error ? error.message : 'Unknown error'}\n\nThis might be because:\n1. Backend is not running\n2. No chats exist yet\n3. API endpoint doesn't exist yet.`);
      } else {
        Alert.alert('Error', 'Failed to load chats. Please try again.');
      }
      
      // Set empty chats array so the UI shows the empty state
      setChats([]);
    }
  };

  const transformApiChatForCustomer = (apiChat: any): Chat => {
    return {
      _id: apiChat._id,
      customer_id: apiChat.customer_id._id,
      resort_id: apiChat.resort_id._id,
      resort_name: apiChat.resort_id.resort_name,
      resort_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      owner_name: apiChat.resort_id.resort_name, // Use resort name as owner name for now
      last_message: apiChat.messages.length > 0 ? apiChat.messages[apiChat.messages.length - 1].text : 'No messages yet',
      last_message_time: apiChat.messages.length > 0 ? new Date(apiChat.messages[apiChat.messages.length - 1].timestamp) : new Date(apiChat.createdAt),
      unread_count: calculateUnreadCount(apiChat.messages),
      messages: apiChat.messages.map((msg: any) => ({
        _id: msg._id,
        sender: msg.sender,
        text: msg.text,
        timestamp: new Date(msg.timestamp)
      }))
    };
  };

  const calculateUnreadCount = (messages: any[]): number => {
    // For customer, count unread messages from owner
    // In a real implementation, you'd track read status per message
    // For now, we'll consider all owner messages as potentially unread
    const ownerMessages = messages.filter(msg => msg.sender === 'owner');
    
    // If there are no messages, return 0
    if (messages.length === 0) return 0;
    
    // If the last message is from the owner, consider it unread
    const lastMessage = messages[messages.length - 1];
    return lastMessage.sender === 'owner' ? ownerMessages.length : 0;
  };

const updateChatWithNewMessage = (message: ChatMessage) => {
  setChats(prevChats => {
    const updatedChats = prevChats.map(chat => {
      if (chat._id === message.chatId) {
        const newUnread = message.sender === 'owner' ? 1 : 0;
        setUnreadCount(prev => prev + newUnread); // Increment global unread count

        return {
          ...chat,
          messages: [...chat.messages, message],
          last_message: message.text,
          last_message_time: message.timestamp,
          unread_count: chat.unread_count + newUnread,
        };
      }
      return chat;
    });
    return updatedChats.sort((a, b) => b.last_message_time.getTime() - a.last_message_time.getTime());
  });
};

  const handleChatUpdate = (update: ChatUpdateData) => {
    console.log('Received chat update:', update);
    
    setChats(prevChats => {
      let updatedChats = [...prevChats];
      
      if (update.isNewChat) {
        // This is a new chat, we need to reload the full chat list
        console.log('New chat detected, reloading chat list...');
        loadChats();
        return prevChats; // Return current state, loadChats will update it
      } else {
        // Update existing chat
        const existingChatIndex = updatedChats.findIndex(chat => chat._id === update.chatId);
        
        if (existingChatIndex >= 0) {
          // Update existing chat
          updatedChats[existingChatIndex] = {
            ...updatedChats[existingChatIndex],
            last_message: update.lastMessage,
            last_message_time: update.lastMessageTime,
            unread_count: update.sender === 'owner' ? 
              updatedChats[existingChatIndex].unread_count + 1 : 
              updatedChats[existingChatIndex].unread_count
          };
        } else {
          // Chat not found locally, reload the full list
          console.log('Chat not found locally, reloading chat list...');
          loadChats();
          return prevChats;
        }
        
        // Re-sort chats after update to keep most recent at top
        return updatedChats.sort((a, b) => {
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        });
      }
    });
  };

  const handleChatPress = (chat: Chat) => {
    // Mark chat as read when opening
    if (chat.unread_count > 0) {
      customerChatSocket.markAsRead(chat._id);
      setChats(prevChats => {
        const updatedChats = prevChats.map(c => 
          c._id === chat._id ? { ...c, unread_count: 0 } : c
        );
        
        // Re-sort chats after marking as read (unread chats will move down)
        return updatedChats.sort((a, b) => {
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        });
      });
    }

    router.push({
      pathname: '/customer/CustomerChatConvo',
      params: { chatId: chat._id }
    });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const renderChatItem = (chat: Chat) => (
    <TouchableOpacity
      key={chat._id}
      onPress={() => handleChatPress(chat)}
      activeOpacity={0.7}
      className="bg-white"
      style={{ 
        borderLeftWidth: chat.unread_count > 0 ? 3 : 0,
        borderLeftColor: chat.unread_count > 0 ? '#1F2937' : 'transparent',
      }}
    >
      <View className="flex-row items-center px-4 py-3">
        <View className="relative">

          {chat.unread_count > 0 && (
            <View className="absolute -top-1  bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
              <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold', color: '#FFFFFF' }}>
                {chat.unread_count > 99 ? '99+' : chat.unread_count}
              </Text>
            </View>
          )}
        </View>
        
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text 
              style={{ 
                fontSize: 15, 
                fontFamily: chat.unread_count > 0 ? 'Roboto-Bold' : 'Roboto-Medium', 
                color: '#111827',
                flex: 1,
                marginRight: 8
              }} 
              numberOfLines={1}
            >
              {chat.resort_name}
            </Text>
            <Text 
              style={{ 
                fontSize: 11, 
                fontFamily: chat.unread_count > 0 ? 'Roboto-Bold' : 'Roboto', 
                color: chat.unread_count > 0 ? '#111827' : '#9CA3AF'
              }}
            >
              {formatTime(chat.last_message_time)}
            </Text>
          </View>
          
          <Text 
            style={{ 
              fontSize: 12, 
              fontFamily: 'Roboto', 
              color: '#6B7280',
              marginBottom: 2
            }} 
            numberOfLines={1}
          >
            {chat.owner_name}
          </Text>
          
          <Text 
            style={{ 
              fontSize: 13, 
              fontFamily: chat.unread_count > 0 ? 'Roboto-Medium' : 'Roboto', 
              color: chat.unread_count > 0 ? '#374151' : '#9CA3AF',
              lineHeight: 18
            }}
            numberOfLines={2}
          >
            {chat.last_message}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text style={{ fontSize: 22, fontFamily: 'Roboto-Bold', color: '#111827' }}>Messages</Text>
        </View>
      </View>

      {/* Loading State */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1F2937" />
          <Text style={{ fontSize: 13, fontFamily: 'Roboto', color: '#6B7280', marginTop: 16 }}>Loading messages...</Text>
        </View>
      ) : (
        /* Chat List */
        chats.length > 0 ? (
          <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshChats}
                tintColor="#1F2937"
                colors={["#1F2937"]}
              />
            }
          >
            {chats.map((chat, index) => (
              <View key={chat._id}>
                {renderChatItem(chat)}
                {index < chats.length - 1 && (
                  <View className="h-px bg-gray-200 ml-[70px]" />
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          /* Empty State */
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
              <MessageCircle size={28} color="#9CA3AF" />
            </View>
            <Text style={{ fontSize: 18, fontFamily: 'Roboto-Bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
              No messages yet
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'Roboto', color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>
              Start exploring and reach out to hosts to begin your conversation
            </Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
}
