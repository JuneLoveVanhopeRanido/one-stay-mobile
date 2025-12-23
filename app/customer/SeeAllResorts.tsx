import customerResortAPI, {
  EnhancedResort,
} from "@/services/customerResortService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ChevronLeft, MapPin, Star } from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const itemWidth = (width - 48) / 2; // 2 columns with padding

export default function SeeAllResorts() {
  const [resorts, setResorts] = React.useState<EnhancedResort[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    loadResorts();
  }, []);

  const loadResorts = async () => {
    try {
      setLoading(true);
      const data = await customerResortAPI.getFeaturedResorts();
      setResorts(data);
    } catch (error) {
      console.error("Error loading resorts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadResorts();
    setRefreshing(false);
  };

  const handleResortPress = (resortId: string) => {
    router.push({
      pathname: "/customer/ResortDetailsScreen",
      params: { resortId },
    });
  };

  const handleBackPress = () => {
    router.back();
  };

  const renderResortCard = (resort: EnhancedResort, index: number) => (
    <TouchableOpacity
      key={resort._id}
      className="mb-4"
      style={{
        width: itemWidth,
        marginRight: index % 2 === 0 ? 16 : 0,
      }}
      onPress={() => handleResortPress(resort._id)}
      activeOpacity={0.9}
    >
      <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <View className="relative">
          <Image
            source={
              resort.image
                ? { uri: resort.image }
                : require("@/assets/images/react-logo.png")
            }
            style={{ width: "100%", height: 160 }}
            className="bg-gray-200"
            resizeMode="cover"
          />
          <TouchableOpacity className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5">
            <Ionicons name="heart-outline" size={16} color="#1F2937" />
          </TouchableOpacity>
          {resort.rating >= 4.5 && resort.reviews >= 10 && (
            <View className="absolute top-2 left-2 bg-white/95 px-2 py-1 rounded-lg shadow-sm">
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Roboto-Bold",
                  color: "#1F2937",
                }}
              >
                ⭐ Guest favorite
              </Text>
            </View>
          )}
        </View>

        <View className="p-3">
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Roboto-Bold",
              color: "#111827",
            }}
            numberOfLines={2}
          >
            {resort.resort_name}
          </Text>

          <View className="flex-row items-center mt-1 mb-2">
            <MapPin size={12} color="#6B7280" />
            <Text
              style={{
                fontSize: 11,
                fontFamily: "Roboto",
                color: "#6B7280",
                marginLeft: 4,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {resort.location?.address?.split(",")[0] || "Location"}
            </Text>
          </View>

          {resort.rating > 0 && (
            <View className="flex-row items-center mb-2">
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "Roboto-Medium",
                  color: "#111827",
                  marginLeft: 4,
                }}
              >
                
                {Number(resort?.rating || 0).toFixed(1)} ({resort.reviews} reviews)
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-between">
            {resort.price_per_night > 0 ? (
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Roboto-Bold",
                    color: "#111827",
                  }}
                >
                  ₱{resort.price_per_night.toLocaleString()}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: "Roboto",
                    color: "#6B7280",
                  }}
                >
                  per night
                </Text>
              </View>
            ) : (
              <Text
                style={{ fontSize: 11, fontFamily: "Roboto", color: "#9CA3AF" }}
              >
                Price TBA
              </Text>
            )}

            {resort.available_rooms > 0 && (
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Roboto-Medium",
                  color: "#10B981",
                }}
              >
                {resort.available_rooms} available
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleBackPress}
            className="p-2 -ml-2"
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color="#1F2937" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Roboto-Bold",
                color: "#111827",
              }}
            >
              All Resorts
            </Text>
          </View>

          <View className="w-10" />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#1F2937" />
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Roboto",
                color: "#6B7280",
                marginTop: 12,
              }}
            >
              Loading resorts...
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-4 pt-4"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#1F2937"]}
                tintColor="#1F2937"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {resorts.length > 0 ? (
              <>
                {/* Results header */}
                <View className="mb-4">
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Roboto-Bold",
                      color: "#111827",
                    }}
                  >
                    Featured Resorts
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Roboto",
                      color: "#6B7280",
                      marginTop: 2,
                    }}
                  >
                    {resorts.length}{" "}
                    {resorts.length === 1 ? "resort" : "resorts"} available
                  </Text>
                </View>

                {/* Grid layout */}
                <View className="flex-row flex-wrap">
                  {resorts.map((resort, index) =>
                    renderResortCard(resort, index)
                  )}
                </View>

                {/* Bottom padding */}
                <View className="h-8" />
              </>
            ) : (
              <View className="flex-1 justify-center items-center py-20">
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Roboto-Medium",
                    color: "#6B7280",
                  }}
                >
                  No resorts available
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Roboto",
                    color: "#9CA3AF",
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  We couldn't find any resorts at the moment.{"\n"}Please check
                  back later.
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
