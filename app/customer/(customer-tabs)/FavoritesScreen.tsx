import { useAuth } from "@/contexts/AuthContext";
import { customerFavoriteAPI } from "@/services/customerFavoriteService";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function FavoritesScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = async () => {
    if (!user?.id) return;

    try {
      const data = await customerFavoriteAPI.getMyFavorites(user.id);
      console.log("favorites", data[0]);
      setFavorites(data);
    } catch (error) {
      console.log("Failed to load favorites", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadFavorites();
      setLoading(false);
    })();
  }, []);

  // Loading screen
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#FF5A8B" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold text-pink-600 mb-4">Your Favorites</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {favorites.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-gray-400 text-lg">You have no favorites yet.</Text>
          </View>
        ) : (
          favorites.map((resort) => (
            <TouchableOpacity
              key={resort._id}
              className="mb-4 bg-white rounded-2xl shadow border border-gray-200 overflow-hidden"
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/customer/ResortDetailsScreen",
                  params: { resortId: resort._id },
                })
              }
            >
              <Image
                source={
                  resort.image
                    ? { uri: resort.image }
                    : require("@/assets/images/react-logo.png")
                }
                className="w-full h-48 bg-gray-200"
                resizeMode="cover"
              />

              <View className="p-3">
                <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={1}>
                  {resort.resort_name}
                </Text>

                <Text className="text-gray-600 mb-2" numberOfLines={1}>
                  {resort.location?.address || "Unknown location"}
                </Text>

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-900 font-bold">
                    ₱{resort.price_per_night?.toLocaleString() || "0"}
                    <Text className="text-gray-500 text-sm"> /night</Text>
                  </Text>

                  {resort.rating > 0 && (
                    <View className="bg-gray-100 px-2 py-1 rounded-lg flex-row items-center">
                      <Text className="text-yellow-500 mr-1">⭐</Text>
                      <Text className="text-gray-800 font-medium">
                        {resort.rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
