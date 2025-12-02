import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chat, ChatMessage } from '../../data/chat-data';
import { customerChatSocket, ChatMessage as SocketChatMessage } from '../../lib/chat-socket';
import { ChatApiResponse, chatService } from '../../services/chatService';

export default function ChatConversation() {
  const insets = useSafeAreaInsets();
  const { chatId, resortId, resortName, newChat } = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Either we have a chatId (existing chat) or resortId (new chat)
    if (!chatId && !resortId) return;

    initializeChat();

    return () => {
      customerChatSocket.disconnect();
    };
  }, [chatId, resortId, user]);

  const initializeChat = async () => {
    try {
      await loadChatDetails();
      await connectToSocket();
      setupSocketListeners();
    } catch (error) {
      console.error('Error initializing chat:', error);
      setIsLoading(false); // Ensure loading state is set to false on error
      Alert.alert('Error', 'Failed to initialize chat');
    }
  };

  const connectToSocket = async () => {
    if (!user?.id) return;

    try {
      const connected = await customerChatSocket.connect(user.id, 'customer');
      setIsConnected(connected);
      
      if (connected) {
        if (chatId) {
          customerChatSocket.joinChat(chatId as string);
        } else if (newChat === 'true') {
          // For new chats, we'll join the room after the first message creates the real chat ID
          // Don't join any room yet, just establish connection
          console.log('Connected to socket for new chat, waiting for first message...');
        }
      }
    } catch (error) {
      console.error('Error connecting to socket:', error);
      setIsConnected(false);
    }
  };

  const setupSocketListeners = () => {
    customerChatSocket.onMessage((message: SocketChatMessage) => {
      // Check if this message belongs to our current chat
      const currentChatId = chat?._id;
      const isForThisChat = message.chatId === chatId || 
                           (currentChatId && currentChatId !== 'new-chat' && message.chatId === currentChatId);
      
      if (isForThisChat) {
        // Only add messages from other users (not our own messages)
        if (message.senderId !== user?.id) {
          const newMsg: ChatMessage = {
            _id: message._id,
            sender: message.sender,
            text: message.text,
            timestamp: new Date(message.timestamp),
          };
          
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();
        }
      }
    });
  };

  const transformApiChatForCustomer = (apiChat: ChatApiResponse): Chat => {
    return {
      _id: apiChat._id,
      customer_id: apiChat.customer_id._id,
      resort_id: apiChat.resort_id._id,
      resort_name: apiChat.resort_id.resort_name || 'Resort',
      resort_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      owner_name: 'Resort Owner',
      last_message: apiChat.messages.length > 0 ? apiChat.messages[apiChat.messages.length - 1].text : 'No messages yet',
      last_message_time: apiChat.messages.length > 0 ? new Date(apiChat.messages[apiChat.messages.length - 1].timestamp) : new Date(),
      unread_count: 0,
      messages: apiChat.messages.map(msg => ({
        _id: msg._id,
        sender: msg.sender,
        text: msg.text,
        timestamp: new Date(msg.timestamp)
      }))
    };
  };

  const loadChatDetails = async () => {
    try {
      setIsLoading(true);
      
      if (chatId) {
        // Existing chat - load messages
        const chatResponse = await chatService.getChat(chatId as string, { limit: 5 });
        console.log('Chat response:', chatResponse);
        
        if (chatResponse) {
          const transformedChat = transformApiChatForCustomer(chatResponse);
          setChat(transformedChat);
          
          // Load initial messages from the paginated response
          if (chatResponse.messages) {
            const initialMessages = chatResponse.messages.map((msg: any) => ({
              _id: msg._id,
              sender: msg.sender,
              text: msg.text,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(initialMessages);
          }
        } else {
          Alert.alert('Error', 'Chat not found');
          router.back();
        }
      } else if (resortId && newChat === 'true') {
        // New chat - create a placeholder chat object
        const placeholderChat: Chat = {
          _id: 'new-chat', // Temporary ID
          customer_id: user!.id,
          resort_id: resortId as string,
          resort_name: (resortName as string) || 'Resort',
          resort_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
          owner_name: 'Resort Owner',
          last_message: 'Start a conversation',
          last_message_time: new Date(),
          unread_count: 0,
          messages: []
        };
        
        setChat(placeholderChat);
        setMessages([]);
      } else {
        Alert.alert('Error', 'Chat information not provided');
        router.back();
      }
    } catch (error) {
      console.error('Error loading chat details:', error);
      if (__DEV__) {
        Alert.alert('Development Error', `Failed to load chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } else {
        Alert.alert('Error', 'Failed to load chat details');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !chat || isSendingMessage) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSendingMessage(true);

    try {
      // Send via API first - this will create the chat if it doesn't exist
      const sentMessage = await chatService.sendMessage({
        customer_id: user.id,
        resort_id: chat.resort_id,
        sender: 'customer',
        text: messageText,
      });

      // Replace the temporary message with the real message from API
      if (sentMessage && sentMessage.messages && sentMessage.messages.length > 0) {
        const realMessage = sentMessage.messages[sentMessage.messages.length - 1];
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? {
            _id: realMessage._id,
            sender: realMessage.sender,
            text: realMessage.text,
            timestamp: new Date(realMessage.timestamp),
          } : msg
        ));
      }

      // If this was a new chat, update our local state with the real chat ID
      if (chat._id === 'new-chat' && sentMessage._id) {
        const realChatId = sentMessage._id;
        
        setChat(prevChat => prevChat ? {
          ...prevChat,
          _id: realChatId
        } : null);
        
        // Join the real chat room via WebSocket
        if (isConnected) {
          try {
            customerChatSocket.joinChat(realChatId); // Join real chat room
            console.log('Joined real chat room:', realChatId);
          } catch (error) {
            console.error('Error joining chat room:', error);
          }
        }
        
        // Note: We don't update the URL to avoid screen reload
        // The chat functionality will work with the updated local state
      }

      // Send via socket for real-time delivery (for other users)
      if (isConnected) {
        const realChatId = chat._id !== 'new-chat' ? chat._id : sentMessage._id;
        if (realChatId && realChatId !== 'new-chat') {
          customerChatSocket.sendMessage({
            chatId: realChatId,
            text: messageText,
            customer_id: user.id,
            resort_id: chat.resort_id,
          });
        }
      }

      // Add message to local state immediately for better UX (optimistic update)
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      const newMsg: ChatMessage = {
        _id: tempId,
        sender: 'customer',
        text: messageText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, newMsg]);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setIsSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      scrollToBottom();
    });

    return () => {
      keyboardDidShowListener?.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  if (!chat) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Chat not found</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderMessage = (msg: ChatMessage, index: number) => {
    const isCustomer = msg.sender === 'customer';
    
    return (
      <View
        key={msg._id}
        style={[
          styles.messageContainer,
          isCustomer ? styles.customerMessage : styles.resortMessage
        ]}
      >
        <View style={[
          styles.messageBubble,
          isCustomer ? styles.customerBubble : styles.resortBubble
        ]}>
          <Text style={[
            styles.messageText,
            isCustomer ? styles.customerText : styles.resortText
          ]}>
            {msg.text}
          </Text>
          <Text style={[
            styles.timeText,
            isCustomer ? styles.customerTime : styles.resortTime
          ]}>
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Image 
            source={{ uri: chat.resort_image }} 
            style={styles.resortImage} 
          />
          <View style={styles.headerText}>
            <Text style={styles.resortName}>{chat.resort_name}</Text>
            <Text style={styles.ownerName}>
              {isConnected ? 'Online' : 'Offline'} • {chat.owner_name}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollToBottom()}
      >
        {messages.map((msg, index) => renderMessage(msg, index))}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
            editable={!isSendingMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || isSendingMessage) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || isSendingMessage}
          >
            {isSendingMessage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        {!isConnected && (
          <Text style={styles.connectionStatus}>Connecting...</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontFamily: 'Roboto',
    fontSize: 13,
  },
  errorText: {
    color: '#f44336',
    fontSize: 15,
    marginBottom: 20,
    fontFamily: 'Roboto-Medium',
  },
  backButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  resortImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  resortName: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    color: '#1F2937',
  },
  ownerName: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: '#6b7280',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  messageContainer: {
    marginVertical: 3,
  },
  customerMessage: {
    alignItems: 'flex-end',
  },
  resortMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  customerBubble: {
    backgroundColor: '#1F2937',
    borderBottomRightRadius: 4,
  },
  resortBubble: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Roboto',
  },
  customerText: {
    color: '#fff',
  },
  resortText: {
    color: '#1F2937',
  },
  timeText: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Roboto',
  },
  customerTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  resortTime: {
    color: '#9ca3af',
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
    fontFamily: 'Roboto',
    color: '#1F2937',
  },
  sendButton: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 9,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  connectionStatus: {
    textAlign: 'center',
    color: '#ef4444',
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Roboto',
  },
});