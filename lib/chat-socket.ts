import io, { Socket } from 'socket.io-client';
import { API_BASE_URL } from '../utils/api';
import { getCurrentUser, getToken } from '../utils/auth';

// Unified interfaces
export interface ChatMessage {
  _id: string;
  sender: 'owner' | 'customer';
  text: string;
  timestamp: Date;
  chatId?: string;
  senderId?: string;
}

export interface ChatStatus {
  chatId: string;
  isOtherUserOnline: boolean;
}

export interface MessageReadData {
  chatId: string;
  readBy: string;
  readAt: Date;
}

export interface MessageSentConfirmation {
  messageId: string;
  chatId: string;
  timestamp: Date;
  message?: ChatMessage;
  totalMessages?: number;
}

export interface ChatUpdateData {
  chatId: string;
  lastMessage: string;
  lastMessageTime: Date;
  sender: 'owner' | 'customer';
  isNewChat: boolean;
}

export type UserRole = 'owner' | 'customer';

class ChatSocket {
  private socket: Socket | null = null;
  private isConnected = false;
  private currentUserId: string | null = null;
  private userRole: UserRole | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;

  // Event handlers - using Map for better performance
  private messageHandlers = new Set<(message: ChatMessage) => void>();
  private messageSentHandlers = new Set<(confirmation: MessageSentConfirmation) => void>();
  private connectionHandlers = new Set<(connected: boolean) => void>();
  private errorHandlers = new Set<(error: string) => void>();
  private chatStatusHandlers = new Set<(status: ChatStatus) => void>();
  private messageReadHandlers = new Set<(data: MessageReadData) => void>();
  private chatUpdateHandlers = new Set<(update: ChatUpdateData) => void>();

  // Public methods
  async connect(userId?: string, role?: UserRole): Promise<boolean> {
    try {
      if (this.isConnected && this.socket) {
        return true;
      }

      // Get user info
      let user, token;
      if (userId && role) {
        // Manual connection (for customer)
        this.currentUserId = userId;
        this.userRole = role;
        token = await getToken();
      } else {
        // Auto connection (for owner)
        user = await getCurrentUser();
        token = await getToken();
        
        if (!user || !token) {
          this.emitError('Invalid user or token');
          return false;
        }
        
        this.currentUserId = user.id;
        this.userRole = user.role as UserRole;
      }

      if (!token) {
        this.emitError('No authentication token');
        return false;
      }

      const socketUrl = API_BASE_URL.replace('/api', '');
      
      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      this.setupEventListeners();

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.emitError('Connection timeout');
          resolve(false);
        }, 10000);

        this.socket!.once('connect', () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Join with role
          this.socket!.emit('join', {
            userId: this.currentUserId,
            role: this.userRole
          });

          console.log(`[FRONTEND-SOCKET] ${this.userRole} chat socket connected with userId: ${this.currentUserId}`);
          this.emitConnection(true);
          resolve(true);
        });

        this.socket!.once('connect_error', (error) => {
          clearTimeout(timeout);
          this.emitError(`Connection failed: ${error.message}`);
          resolve(false);
        });
      });

    } catch (error) {
      this.emitError(`Connect error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentUserId = null;
      this.userRole = null;
      console.log('Chat socket disconnected');
    }
  }

  joinChat(chatId: string): void {
    if (this.isSocketReady()) {
      this.socket!.emit('join_chat', chatId);
      console.log(`Joined chat: ${chatId}`);
    }
  }

  leaveChat(chatId: string): void {
    if (this.isSocketReady()) {
      this.socket!.emit('leave_chat', chatId);
      console.log(`Left chat: ${chatId}`);
    }
  }

  sendMessage(data: {
    chatId?: string;
    customer_id?: string;
    resort_id?: string;
    text: string;
  }): void {
    if (!this.isSocketReady() || !this.userRole) {
      this.emitError('Socket not ready or role not set');
      return;
    }

    if (!data.text.trim()) {
      this.emitError('Message text cannot be empty');
      return;
    }

    const messageData = {
      ...data,
      sender: this.userRole,
      senderId: this.currentUserId,
    };

    this.socket!.emit('send_message', messageData);
    console.log(`${this.userRole} sent message:`, messageData);
  }

  markAsRead(chatId: string): void {
    if (this.isSocketReady()) {
      this.socket!.emit('mark_read', {
        chatId,
        userId: this.currentUserId
      });
    }
  }

  getChatStatus(chatId: string): void {
    if (this.isSocketReady()) {
      this.socket!.emit('get_chat_status', chatId);
    }
  }

  // Event subscription methods with cleanup
  onMessage(handler: (message: ChatMessage) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onMessageSent(handler: (confirmation: MessageSentConfirmation) => void): () => void {
    this.messageSentHandlers.add(handler);
    return () => this.messageSentHandlers.delete(handler);
  }

  onConnection(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  onError(handler: (error: string) => void): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  onChatStatus(handler: (status: ChatStatus) => void): () => void {
    this.chatStatusHandlers.add(handler);
    return () => this.chatStatusHandlers.delete(handler);
  }

  onMessageRead(handler: (data: MessageReadData) => void): () => void {
    this.messageReadHandlers.add(handler);
    return () => this.messageReadHandlers.delete(handler);
  }

  onChatUpdate(handler: (update: ChatUpdateData) => void): () => void {
    this.chatUpdateHandlers.add(handler);
    return () => this.chatUpdateHandlers.delete(handler);
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get userId(): string | null {
    return this.currentUserId;
  }

  get role(): UserRole | null {
    return this.userRole;
  }

  // Private methods
  private isSocketReady(): boolean {
    return !!(this.socket && this.isConnected && this.currentUserId);
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emitConnection(true);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.emitConnection(false);
      
      // Auto-reconnect if not manually disconnected
      if (reason !== 'io client disconnect') {
        this.handleReconnection();
      }
    });

    this.socket.on('joined', (data) => {
      console.log(`[FRONTEND-SOCKET] ${this.userRole} joined successfully to user_${data.userId}:`, data);
    });

    // Message events
    this.socket.on('receive_message', (message: ChatMessage) => {
      this.emitMessage({
        ...message,
        timestamp: new Date(message.timestamp)
      });
    });

    this.socket.on('message_sent', (data) => {
      this.emitMessageSent({
        ...data,
        timestamp: new Date(data.timestamp)
      });
    });

    // Status events
    this.socket.on('chat_status', (status: ChatStatus) => {
      this.emitChatStatus(status);
    });

    this.socket.on('messages_read', (data: MessageReadData) => {
      this.emitMessageRead({
        ...data,
        readAt: new Date(data.readAt)
      });
    });

    // Chat update events
    this.socket.on('chat_updated', (update: ChatUpdateData) => {
      console.log(`[FRONTEND-SOCKET] Received chat_updated event:`, update);
      console.log(`[FRONTEND-SOCKET] User role: ${this.userRole}, User ID: ${this.currentUserId}`);
      this.emitChatUpdate({
        ...update,
        lastMessageTime: new Date(update.lastMessageTime)
      });
    });

    this.socket.on('new_chat', (chatData) => {
      console.log(`[FRONTEND-SOCKET] Received new_chat event:`, chatData);
      console.log(`[FRONTEND-SOCKET] User role: ${this.userRole}, User ID: ${this.currentUserId}`);
      // Convert new_chat to chat_updated format for consistency
      this.emitChatUpdate({
        chatId: chatData.chatId,
        lastMessage: 'New conversation started',
        lastMessageTime: new Date(),
        sender: 'customer',
        isNewChat: true
      });
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('Chat socket error:', error);
      this.emitError(error.message || 'Socket error');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Chat socket connection error:', error);
      this.emitError(`Connection error: ${error.message}`);
      this.handleReconnection();
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.emitError('Failed to reconnect after maximum attempts');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Attempting reconnection ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.currentUserId || undefined, this.userRole || undefined);
    }, delay);
  }

  // Event emission methods
  private emitMessage(message: ChatMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  private emitMessageSent(confirmation: MessageSentConfirmation): void {
    this.messageSentHandlers.forEach(handler => {
      try {
        handler(confirmation);
      } catch (error) {
        console.error('Error in message sent handler:', error);
      }
    });
  }

  private emitConnection(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  private emitError(error: string): void {
    console.error(`${this.userRole || 'Chat'} socket error:`, error);
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (error) {
        console.error('Error in error handler:', error);
      }
    });
  }

  private emitChatStatus(status: ChatStatus): void {
    this.chatStatusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Error in chat status handler:', error);
      }
    });
  }

  private emitMessageRead(data: MessageReadData): void {
    this.messageReadHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in message read handler:', error);
      }
    });
  }

  private emitChatUpdate(update: ChatUpdateData): void {
    console.log(`[FRONTEND-SOCKET] Emitting chat update to ${this.chatUpdateHandlers.size} handlers:`, update);
    this.chatUpdateHandlers.forEach(handler => {
      try {
        handler(update);
      } catch (error) {
        console.error('Error in chat update handler:', error);
      }
    });
  }
}

// Export singleton instances for both roles
export const ownerChatSocket = new ChatSocket();
export const customerChatSocket = new ChatSocket();

// Export unified class for custom instances
export { ChatSocket };
