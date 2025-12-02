import { useAuth } from '@/contexts/AuthContext';
import { Chat } from '@/data/chat-data';
import { ChatMessage, customerChatSocket } from '@/lib/chat-socket';
import { chatService } from '@/services/chatService';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface UnreadContextType {
  unreadCount: number;
  setUnreadCount: (count: number | ((prev: number) => number)) => void; // ✅ expose setUnreadCount
  refreshUnread: () => Promise<void>;
}

const UnreadContext = createContext<UnreadContextType | undefined>(undefined);

export const UnreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Fetch unread count from API
  const loadUnread = async () => {
    if (!user?.id) return;
    try {
      const apiChats = await chatService.getUserChats(user.id);
      const transformedChats: Chat[] = apiChats.map(chat => transformApiChatForCustomer(chat));
      const totalUnread = transformedChats.reduce(
        (sum, chat) => sum + (chat.unread_count || 0),
        0
      );
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error('Unread fetch error:', err);
    }
  };

  useEffect(() => {
    loadUnread();

    if (user?.id) {
      customerChatSocket.connect(user.id, 'customer').then((connected) => {
        if (!connected) return;

        // Listen for new messages
        const unsubscribeMsg = customerChatSocket.onMessage((message: ChatMessage) => {
          if (message.sender === 'owner') {
            setUnreadCount(prev => prev + 1); // live increment
          }
        });

        // Listen for read messages
        const unsubscribeRead = customerChatSocket.onMessageRead(() => {
          loadUnread(); // reload unread counts from API
        });

        return () => {
          unsubscribeMsg();
          unsubscribeRead();
        };
      });
    }
  }, [user?.id]);

  return (
    <UnreadContext.Provider value={{ unreadCount, setUnreadCount, refreshUnread: loadUnread }}>
      {children}
    </UnreadContext.Provider>
  );
};

// Hook
export const useUnread = () => {
  const context = useContext(UnreadContext);
  if (!context) {
    throw new Error('useUnread must be used within UnreadProvider');
  }
  return context;
};

// --- Helper to transform API chat to your Chat type ---
const transformApiChatForCustomer = (apiChat: any): Chat => {
  return {
    _id: apiChat._id,
    customer_id: apiChat.customer_id._id,
    resort_id: apiChat.resort_id._id,
    resort_name: apiChat.resort_id.resort_name,
    resort_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    owner_name: apiChat.resort_id.resort_name,
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
  const ownerMessages = messages.filter(msg => msg.sender === 'owner');
  if (messages.length === 0) return 0;
  const lastMessage = messages[messages.length - 1];
  return lastMessage.sender === 'owner' ? ownerMessages.length : 0;
};
