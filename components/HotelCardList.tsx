import { useAuth } from "@/contexts/AuthContext";
import { customerFavoriteAPI } from "@/services/customerFavoriteService";
import customerResortAPI, { EnhancedResort } from "@/services/customerResortService";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


const HotelCardList = () => {
  const router = useRouter();
  const [resorts, setResorts] = useState<EnhancedResort[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const { user } = useAuth();

  const userId = user?.id;


  // Filter state
const [filter, setFilter] = useState({
  minRating: 0,
  minPrice: 0,
  maxPrice: Infinity,
  startDate: null as Date | null,
  endDate: null as Date | null,
});

  // Dropdown state for rating
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const ratingOptions = [0,1,2, 3, 4, 5];
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [availableResortIds, setAvailableResortIds] = useState<string[]>([]);



  useEffect(() => {
    loadResorts();
    loadFavorites();
  }, []);

  useEffect(() => {
    
    if (!filter.startDate || !filter.endDate) {
      setAvailableResortIds([]);
      return;
    }

    const fetchAvailableResorts = async () => {
      try {
        
      setLoading(true);
      if (!filter.startDate || !filter.endDate) return;
       const { resortIds } = await customerResortAPI.getAvailableResorts({
          startDate: formatDate(filter.startDate),
          endDate: formatDate(filter.endDate),
        });

        setAvailableResortIds(resortIds);
        console.log("resrot IDsssssssssssss",resortIds);
      
      setLoading(false);
      } catch (err) {
        console.error("Availability fetch failed:", err);
      }
    };

  fetchAvailableResorts();
}, [filter.startDate, filter.endDate]);


  const loadFavorites = async () => {
    try {
      if (!userId) return;
      const favResorts = await customerFavoriteAPI.getMyFavorites(userId);
      setFavoriteIds(favResorts.map((r: any) => r._id));
    } catch (e) {
      console.log("Error loading favorites:", e);
    }
  };

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

  const handleResortPress = (resortId: string) => {
    router.push({
      pathname: "/customer/ResortDetailsScreen",
      params: { resortId,
      startDate: filter.startDate ? filter.startDate.toISOString() : undefined,
      endDate: filter.endDate ? filter.endDate.toISOString() : undefined,
       },
    });
  };

  const toggleFavorite = async (resortId: string) => {
    try {
      if (favoriteIds.includes(resortId)) {
        // remove
        await customerFavoriteAPI.remove(resortId);
        setFavoriteIds((prev) => prev.filter((id) => id !== resortId));
      } else {
        // add
        await customerFavoriteAPI.add(resortId);
        setFavoriteIds((prev) => [...prev, resortId]);
      }
    } catch (e) {
      console.error("Favorite toggle error:", e);
    }
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };


  // Filtered resorts
const filteredResorts = resorts.filter((resort) => {
  const price = resort.price_per_night || 0;

  if (!(resort.rating >= filter.minRating && price >= filter.minPrice && price <= filter.maxPrice)) {
    return false;
  }

  if (filter.startDate && filter.endDate) {
    return availableResortIds.includes(resort._id);
  }

  return true;
});


  // if (loading) {
  //   return (
  //     <View className="mt-2 px-5 py-10">
  //       <ActivityIndicator size="large" color="#1F2937" />
  //     </View>
  //   );
  // }

  return (
    <View className="mt-1 px-5">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text
          style={{ fontSize: 18, fontFamily: "Roboto-Bold", color: "#111827" }}
        >
          Featured Stays
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/customer/SeeAllResorts")}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Roboto-Medium",
              color: "#1F2937",
            }}
          >
            See all
          </Text>
        </TouchableOpacity>
      </View>

            <View className="flex-row mb-3 items-center gap-3">
        {/* Start Date */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Roboto-Medium", marginBottom: 4 }}>CHECK IN</Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderRadius: 6,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 8,
            }}
          >
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 8 }}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text>{filter.startDate ? filter.startDate.toLocaleDateString() : "Select"}</Text>
            </TouchableOpacity>

            {filter.startDate && (
              <TouchableOpacity
                onPress={() => setFilter(prev => ({ ...prev, startDate: null }))}
                style={{
                  marginLeft: 8,
                  padding: 4,
                }}
              >
                <Text style={{ fontSize: 16, color: "#9ca3af" }}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={filter.startDate || new Date()}
              mode="date"
              display="default"
              onChange={(event: DateTimePickerEvent, date?: Date) => {
                setShowStartDatePicker(false);

                // Check if the user pressed 'set' (iOS) or didn't cancel
                if (event.type === "set" && date) {
                  setFilter(prev => ({ ...prev, startDate: date }));
                }

                // If canceled, do nothing
              }}
            />

          )}
        </View>

        {/* End Date */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Roboto-Medium", marginBottom: 4 }}>CHECK OUT</Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderRadius: 6,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 8,
            }}
          >
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 8 }}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text>{filter.endDate ? filter.endDate.toLocaleDateString() : "Select"}</Text>
            </TouchableOpacity>

            {filter.endDate && (
              <TouchableOpacity
                onPress={() => setFilter(prev => ({ ...prev, endDate: null }))}
                style={{
                  marginLeft: 8,
                  padding: 4,
                }}
              >
                <Text style={{ fontSize: 16, color: "#9ca3af" }}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          {showEndDatePicker && (
            <DateTimePicker
              value={filter.endDate || new Date()}
              mode="date"
              display="default"
              onChange={(event: DateTimePickerEvent, date?: Date) => {
                setShowEndDatePicker(false);

                if (event.type === "set" && date) {
                  setFilter(prev => ({ ...prev, endDate: date }));
                }
              }}
            />
          )}
        </View>
      </View>

      {/* Filters: rating + min/max price */}
      <View className="flex-row mb-3 items-center gap-3">


        {/* Rating dropdown */}
        <View className="mr-3">
          <TouchableOpacity
            onPress={() => setShowRatingDropdown(!showRatingDropdown)}
            style={{
              padding: 8,
              backgroundColor: "#E5E7EB",
              borderRadius: 6,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: "Roboto-Medium", marginRight: 6 }}>
              Rating: {filter.minRating}+
            </Text>
            <Ionicons
              name={showRatingDropdown ? "chevron-up" : "chevron-down"}
              size={16}
              color="#111827"
            />
          </TouchableOpacity>
          {showRatingDropdown && (
            <View
              style={{
                position: "absolute",
                top: 40,
                backgroundColor: "#fff",
                borderRadius: 6,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
                elevation: 3,
                zIndex: 10,
              }}
            >
              {ratingOptions.map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => {
                    setFilter({ ...filter, minRating: r });
                    setShowRatingDropdown(false);
                  }}
                  style={{ padding: 10 }}
                >
                  <Text style={{ fontFamily: "Roboto-Medium" }}>{r}+</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Min Price */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Roboto-Medium", marginBottom: 4 }}>
            Min Price
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderRadius: 6,
              padding: 8,
              fontFamily: "Roboto-Regular",
            }}
            keyboardType="numeric"
            placeholder="₱0"
            value={filter.minPrice === 0 ? "" : String(filter.minPrice)}
            onChangeText={(text) => {
              const num = parseInt(text.replace(/[^0-9]/g, "")) || 0;
              setFilter((prev) => ({ ...prev, minPrice: num }));
            }}
          />
        </View>

        {/* Max Price */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Roboto-Medium", marginBottom: 4 }}>
            Max Price
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderRadius: 6,
              padding: 8,
              fontFamily: "Roboto-Regular",
            }}
            keyboardType="numeric"
            placeholder="Any"
            value={filter.maxPrice === Infinity ? "" : String(filter.maxPrice)}
            onChangeText={(text) => {
              const num = parseInt(text.replace(/[^0-9]/g, "")) || Infinity;
              setFilter((prev) => ({ ...prev, maxPrice: num }));
            }}
          />
        </View>
      </View>

      {/* Resort list */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">

        {loading? (
          <View style={{ width: 300, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#1F2937" />
    </View> 
          ): 
        filteredResorts.length > 0 ? (
          filteredResorts.map((resort) => (
            <TouchableOpacity
              key={resort._id}
              className="mx-1.5 w-64"
              onPress={() => handleResortPress(resort._id)}
              activeOpacity={0.9}
            >
              <View className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <Image
                  source={
                    resort.image
                      ? { uri: resort.image }
                      : require("@/assets/images/react-logo.png")
                  }
                  className="w-full h-48 bg-gray-200"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="absolute top-2.5 right-2.5 bg-white/90 rounded-full p-1.5"
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleFavorite(resort._id);
                  }}
                >
                  <Ionicons
                    name={favoriteIds.includes(resort._id) ? "heart" : "heart-outline"}
                    color={favoriteIds.includes(resort?._id as string) ? "#DC2626" : "#1F2937"} 
                    size={18} 
                    fill={favoriteIds.includes(resort?._id as string) ? "#DC2626" : "transparent"}
                  />
                </TouchableOpacity>

                {resort.rating >= 4.5 && resort.reviews >= 10 && (
                  <View className="absolute top-2.5 left-2.5 bg-white/95 px-2.5 py-1 rounded-lg shadow-sm">
                    <Text
                      style={{
                        fontSize: 11,
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
                <View className="flex-row items-center justify-between mb-1">
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: "Roboto-Bold",
                      color: "#111827",
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {resort.resort_name}
                  </Text>
                  {resort.rating > 0 && (
                    <View className="flex-row items-center ml-2 bg-gray-100 px-2 py-0.5 rounded-lg">
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Roboto-Medium",
                          color: "#111827",
                          marginLeft: 2,
                        }}
                      >
                        {Number(resort?.rating || 0).toFixed(1)}

                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Roboto",
                    color: "#6B7280",
                    marginBottom: 6,
                  }}
                  numberOfLines={1}
                >
                  {resort.location?.address?.split(",")[0] || "Location"}
                </Text>

                <View className="flex-row items-center justify-between">
                  {resort.price_per_night > 0 ? (
                    <View className="flex-row items-baseline">
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: "Roboto-Bold",
                          color: "#111827",
                        }}
                      >
                        ₱{resort.price_per_night.toLocaleString()}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Roboto",
                          color: "#6B7280",
                          marginLeft: 3,
                        }}
                      >
                        /night
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Roboto",
                        color: "#9CA3AF",
                      }}
                    >
                      Price TBA
                    </Text>
                  )}

                  {resort.available_rooms > 0 && (
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: "Roboto-Medium",
                        color: "#10B981",
                      }}
                    >
                      {resort.available_rooms} available
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="w-full py-10 items-center">
            <Text className="text-gray-500 text-center">
              No resorts match your filters
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default HotelCardList;
