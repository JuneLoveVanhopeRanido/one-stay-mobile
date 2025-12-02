import { UnreadProvider, useUnread } from '@/contexts/UnreadContext';
import { Tabs } from "expo-router";
import { Heart, House, MessageCircle, User } from "lucide-react-native";
import React from 'react';
import { Text, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabsContent() {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useUnread(); // ✅ inside provider

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#1F2937",
          borderTopWidth: 0,
          borderRadius: 25,
          marginHorizontal: 20,
          marginBottom: Math.max(insets.bottom + 10, 20),
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 15,
          height: 60,
          position: 'absolute',
          elevation: 10,
        },
        tabBarLabelStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="HomeScreen"
        options={{
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="FavoritesScreen"
        options={{
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="CustomerChatScreen"
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <MessageCircle color={color} size={size} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    right: -6,
                    top: -4,
                    backgroundColor: 'red',
                    borderRadius: 10,
                    width: 18,
                    height: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

export default function Layout() {
  return (
    <UnreadProvider>
      <TabsContent />
    </UnreadProvider>
  );
}
