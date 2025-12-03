import { Resort } from '@/services/resortService';
import { Room, roomAPI } from '@/services/roomService';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Users
} from 'lucide-react-native';
import * as React from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomerViewRooms() {
  const { resortId, resortName, checkInDate, checkOutDate } = useLocalSearchParams<{
    resortId: string;
    resortName: string;
    checkInDate: string;
    checkOutDate: string;
  }>();

  const [resort, setResort] = React.useState<Resort | null>(null);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Collapsible state per room type
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (resortId) {
      fetchRooms();
    }
  }, [resortId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomAPI.getAvailableRooms(resortId as string, checkInDate, checkOutDate);
      setRooms(response.rooms);
      setResort(response.resort);

      // Initialize collapsible groups
      const initial: Record<string, boolean> = {};
      response.rooms.forEach((r: Room) => {
        if (!initial[r.room_type]) initial[r.room_type] = false;
      });
      setExpandedGroups(initial);

    } catch (error) {
      console.error('Error fetching rooms:', error);
      Alert.alert('Error', 'Failed to load rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotalPrice = (pricePerNight: any, startDate: string, endDate: string) => {
    const nights = calculateNights(startDate, endDate);
    return pricePerNight * nights;
  };

  const handleBack = () => router.back();

  const handleBookRoom = (room: Room) => {
    router.push({
      pathname: '/customer/BookingConfirmation',
      params: {
        resortId,
        roomId: room._id,
        resortName,
        roomType: room.room_type,
        pricePerNight: room.price_per_night.toString(),
        capacity: room.capacity.toString(),
        checkInDate,
        checkOutDate,
        totalPrice: calculateTotalPrice(room.price_per_night, checkInDate, checkOutDate),
        nights: calculateNights(checkInDate, checkOutDate)
      }
    });
  };

  // Group rooms by room_type
  const groupedRooms: Record<string, Room[]> = rooms.reduce((acc, room) => {
    if (!acc[room.room_type]) acc[room.room_type] = [];
    acc[room.room_type].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

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
        <View className="flex-1 ml-3">
          <Text style={{ fontSize: 18, fontFamily: 'Roboto-Bold', color: '#111827' }}>
            {loading ? 'Loading...' : resort?.resort_name || resortName || 'Resort'}
          </Text>
          {!loading && (
            <Text style={{ fontSize: 12, fontFamily: 'Roboto', color: '#6B7280' }}>
              {rooms.length} available room{rooms.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>

      {/* LOADING */}
      {loading ? (
        <ScrollView className="flex-1 px-4 py-4">
          {[1, 2, 3].map((i) => (
            <View key={i} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
              <View className="h-4 w-32 bg-gray-200 rounded-lg mb-2" />
              <View className="h-4 w-24 bg-gray-200 rounded-lg mb-2" />
              <View className="h-4 w-28 bg-gray-200 rounded-lg" />
            </View>
          ))}
        </ScrollView>
      ) : rooms.length === 0 ? (
        // NO ROOMS SCREEN
        <View className="flex-1 justify-center items-center px-5">
          <Calendar size={40} color="#6B7280" />
          <Text style={{ fontSize: 18, fontFamily: 'Roboto-Bold', marginTop: 10 }}>
            No Available Rooms
          </Text>
          <TouchableOpacity
            onPress={handleBack}
            className="mt-4 bg-gray-800 px-6 py-2 rounded-lg"
          >
            <Text style={{ color: 'white' }}>Go Back</Text>
          </TouchableOpacity>
        </View>

      ) : (
        // GROUPED LIST
        <ScrollView className="flex-1 px-4 py-4">

          {Object.keys(groupedRooms).map((roomType) => {
            const isOpen = expandedGroups[roomType];

            return (
              <View key={roomType} className="mb-4">

                {/* Group Header */}
                <TouchableOpacity
                  className="flex-row justify-between items-center bg-white border border-gray-300 px-4 py-3 rounded-xl"
                  onPress={() =>
                    setExpandedGroups((prev) => ({ ...prev, [roomType]: !prev[roomType] }))
                  }
                >
                  <Text style={{ fontSize: 17, fontFamily: 'Roboto-Bold', color: '#111827' }}>
                    {roomType}
                  </Text>
                  {isOpen ? (
                    <ChevronUp size={20} color="#374151" />
                  ) : (
                    <ChevronDown size={20} color="#374151" />
                  )}
                </TouchableOpacity>

                {/* Room List inside group */}
                {isOpen && (
                  <View className="mt-2">
                    {groupedRooms[roomType].map((room) => (
                      <TouchableOpacity
                        key={room._id}
                        onPress={() => handleBookRoom(room)}
                        className="bg-white border border-gray-200 rounded-xl p-4 mb-2"
                      >
                        <View className="flex-row justify-between">
                          <View>
                            <View className="flex-row items-center mb-1">
                              <Users size={14} color="#6B7280" />
                              <Text className="ml-2 text-xs text-gray-600">
                                Up to {room.capacity} guests
                              </Text>
                            </View>

                            <View className="flex-row items-center">
                              <CheckCircle size={14} color="#10B981" />
                              <Text className="ml-2 text-xs text-green-600">
                                Available now
                              </Text>
                            </View>
                          </View>

                          <View className="items-end">
                            <Text className="text-lg font-bold text-gray-900">
                              ₱{room.price_per_night.toLocaleString()}
                            </Text>
                            <Text className="text-xs text-gray-500">/night</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

              </View>
            );
          })}

          <View className="h-20" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
