import { feedbackAPI } from "@/services/reservationService";
import { roomAPI } from "@/services/roomService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function RoomDetailsScreen() {
  const { roomId, resortId, resortName } = useLocalSearchParams();
  const router = useRouter();

  // ============================
  //   STATES (same as WEB)
  // ============================
  const [room, setRoom] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [ratingStats, setRatingStats] = useState<any>(null);

  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================
  //   FETCH FUNCTION (MAIN)
  // ============================
  const fetchRoomData = useCallback(
    async (page = 1, limit = 10, loadMore = false) => {
      if (!roomId) return;

      try {
        if (!loadMore) {
          setIsLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const [roomData, feedbackData] = await Promise.all([
          page === 1 ? roomAPI.getRoomById(roomId as string) : Promise.resolve(room),
          feedbackAPI.getRoomFeedbacks(roomId as string, page, limit),
        ]);

        // Set room on page 1
        if (page === 1) {
          setRoom(roomData);
          setFeedbacks(feedbackData.feedbacks || []);
        } else {
          setFeedbacks((prev) => [...prev, ...feedbackData.feedbacks]);
        }

        // Rating stats + pagination
        setRatingStats(feedbackData.ratingStats);
        setPagination(feedbackData.pagination);
        setCurrentPage(page);

      } catch (err: any) {
        console.log("Error fetching room details:", err);
        if (!loadMore) setError(err.message || "Failed to fetch room details.");
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    },
    [roomId]
  );
  const handleBack = () => router.back();

  useEffect(() => {
    fetchRoomData(1);
  }, [fetchRoomData]);

  // ============================
  //   LOAD MORE (Pagination)
  // ============================
  const handleLoadMore = () => {
    if (pagination?.hasNextPage && !loadingMore) {
      fetchRoomData(currentPage + 1, 10, true);
    }
  };

  // ============================
  //   STAR RENDERER
  // ============================
  const renderStars = (rating: number) => {
    return (
      <View style={{ flexDirection: "row" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Text key={i} style={{ fontSize: 16, color: i <= rating ? "#facc15" : "#d1d5db" }}>
            ★
          </Text>
        ))}
      </View>
    );
  };

  // ============================
  //   LOADING / ERROR UI
  // ============================
  if (isLoading || !room) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 text-lg">{error}</Text>
        <TouchableOpacity
          onPress={() => fetchRoomData(1)}
          className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================
  //   MAIN UI
  // ============================
  return (
    <View className="flex-1">
      <ScrollView className="flex-1 bg-white">
        {/* Resort Info */}
        <View className="relative">
          <Image
            source={{ uri: room.image }}
            className="w-full h-60"
            resizeMode="cover"
          />

          {/* Floating Back Button */}
          <TouchableOpacity
            onPress={handleBack}
            className="absolute top-8 left-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-md"
          >
            <ChevronLeft size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <View className="p-4">
          {/* ROOM NAME */}
          <Text className="text-2xl font-bold mb-2">
            {room.room_type} {room.room_number}
          </Text>

          {/* PRICE */}
          <Text className="text-xl font-semibold text-gray-800">
            ₱{room.price_per_night.toLocaleString()} / night
          </Text>

          {/* CAPACITY */}
          <Text className="text-gray-600 mt-2">
            Capacity: {room.capacity} person(s)
          </Text>

          {/* STATUS */}
          <Text className="mt-1 font-semibold">
            Status: {room.status}
          </Text>

          {/* DESCRIPTION */}
          <Text className="mt-4 text-gray-700">
            {room.description || "No description"}
          </Text>

          {/* ============================
                  RATING + FEEDBACKS
          ============================ */}
          <View className="mt-6 p-4 bg-gray-100 rounded-xl">
            <Text className="text-large font-bold">Ratings</Text>

            <Text className="text-xl font-bold mt-2">
              ⭐ {ratingStats?.averageRating?.toFixed(1) ?? "0.0"}
            </Text>

            <Text className="text-gray-600 mt-1">
              {ratingStats?.totalReviews ?? 0} reviews
            </Text>
          </View>

          {/* FEEDBACK LIST */}
          <Text className="text-xl font-bold mt-6 mb-2">Guest Feedback</Text>

          {feedbacks.length === 0 ? (
            <Text className="text-gray-500">No reviews yet.</Text>
          ) : (
            <View className="flex flex-col gap-4">
              {feedbacks.map((fb) => (
                <View key={fb._id} className="p-4 bg-gray-100 rounded-xl">
                  <Text className="font-bold">{fb.from_user_id.username}</Text>
                  <Text className="text-gray-500 text-sm">
                  </Text>

                  {renderStars(fb.rating)}

                  <Text className="mt-2">{fb.comment}</Text>
                </View>
              ))}

              {pagination?.hasNextPage && (
                <TouchableOpacity
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-blue-600 py-3 rounded-xl"
                >
                  <Text className="text-center text-white font-semibold">
                    {loadingMore ? "Loading..." : "Load More"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        </View>
      </ScrollView>
      {/* Floating Book Now Button */}
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/customer/BookingDateScreen",
            params: {
              resortId,
              resortName: resortName || "Resort",
            },
          })
        }
        className="absolute bottom-5 right-5 bg-black/70 px-5 py-3 rounded-full shadow-lg"
      >
        <Text style={{ fontSize: 13, fontFamily: 'Roboto-Medium', color: '#FFFFFF' }}>
          Book Now
        </Text>
      </TouchableOpacity>

    </View>
  );
}
