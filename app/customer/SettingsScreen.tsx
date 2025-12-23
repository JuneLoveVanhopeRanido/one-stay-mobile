import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  LogOut,
  User
} from "lucide-react-native";
import * as React from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const settingsSections = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Edit Profile",
          onPress: () => router.push("/customer/UpdateProfileScreen"),
        },
        {
          icon: Lock,
          label: "Change Password",
          onPress: () => router.push("/customer/ChangePassword"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        // {
        //   icon: HelpCircle,
        //   label: "Help Center",
        //   onPress: () => Alert.alert("Help Center", "Help center coming soon!"),
        // },
        {
          icon: FileText,
          label: "Terms & Privacy",
          onPress: () => router.push("/TermsAndPolicy"),
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={handleBack}
          className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center"
        >
          <ChevronLeft color="#1F2937" size={20} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Roboto-Bold",
            color: "#111827",
            flex: 1,
            textAlign: "center",
            marginRight: 36,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4">
          {/* User Info */}
          <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Roboto-Bold",
                color: "#111827",
                marginBottom: 2,
              }}
            >
              {user?.name}
            </Text>
            <Text
              style={{ fontSize: 13, fontFamily: "Roboto", color: "#6B7280" }}
            >
              {user?.email}
            </Text>
          </View>

          {/* Settings Sections */}
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} className="mb-4">
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Roboto-Bold",
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                {section.title}
              </Text>
              <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    onPress={item.onPress}
                    className={`flex-row items-center px-4 py-3 ${
                      itemIndex !== section.items.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                    activeOpacity={0.7}
                  >
                    <View className="w-9 h-9 bg-gray-50 rounded-lg items-center justify-center mr-3">
                      <item.icon color="#6B7280" size={18} />
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Roboto",
                        color: "#374151",
                        flex: 1,
                      }}
                    >
                      {item.label}
                    </Text>
                    <ChevronRight color="#9CA3AF" size={18} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-white rounded-xl border border-red-200 overflow-hidden mb-6"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center px-4 py-3">
              <View className="w-9 h-9 bg-red-50 rounded-lg items-center justify-center mr-3">
                <LogOut color="#EF4444" size={18} />
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Roboto-Medium",
                  color: "#EF4444",
                  flex: 1,
                }}
              >
                Logout
              </Text>
              <ChevronRight color="#EF4444" size={18} />
            </View>
          </TouchableOpacity>

          {/* App Version */}
          <View className="items-center py-4">
            <Text
              style={{ fontSize: 11, fontFamily: "Roboto", color: "#9CA3AF" }}
            >
              One Stay v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
