import { Resort } from '@/services/resortService';
import { Room, roomAPI } from '@/services/roomService';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
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
  const { resortId, resortName,checkInDate,checkOutDate } = useLocalSearchParams<{
    resortId: string;
    resortName: string;
    checkInDate:  string;
    checkOutDate: string;
  }>();
  
  const [resort, setResort] = React.useState<Resort | null>(null);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (resortId) {
      fetchRooms();
      // getAvailableRooms();
    }
  }, [resortId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomAPI.getAvailableRooms(resortId as string,checkInDate,checkOutDate);
      setRooms(response.rooms); // Only show available rooms
      setResort(response.resort);
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

    const diffTime = end.getTime() - start.getTime(); // ✅ convert Date → number
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const calculateTotalPrice = (pricePerNight:any, startDate:string, endDate:string) => {
    const nights = calculateNights(startDate, endDate);
    return pricePerNight * nights;
  };





  const handleBack = () => {
    router.back();
  };


  const handleBookRoom = (room: Room) => {
    // Navigate to booking date selection screen
    // router.push({
    //   pathname: '/customer/BookingDateScreen',
    //   params: {
    //     resortId: resortId as string,
    //     roomId: room._id,
    //     resortName: resort?.resort_name || 'Resort',
    //     roomType: room.room_type,
    //     pricePerNight: room.price_per_night.toString(),
    //     capacity: room.capacity.toString()
    //   }
    // });

    console.log('rooms',room);

    router.push({
      pathname: '/customer/BookingConfirmation',
      params: {
        resortId,
        roomId: room._id,
        resortName,
        roomType: room.room_type,
        pricePerNight: room.price_per_night.toString(),
        capacity: room.capacity.toString(),
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        totalPrice: calculateTotalPrice(room.price_per_night,checkInDate,checkOutDate),
        nights: calculateNights(checkInDate,checkOutDate)
      }
    });

    
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={handleBack} className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center">
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

      {loading ? (
        /* Loading Skeleton */
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-4 py-4">
            <View className="h-4 w-3/4 bg-gray-200 rounded-lg mb-6" />
            {[1, 2, 3].map((i) => (
              <View key={i} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                <View className="flex-row justify-between mb-3">
                  <View className="flex-1">
                    <View className="h-5 w-32 bg-gray-200 rounded-lg mb-2" />
                    <View className="h-4 w-24 bg-gray-200 rounded-lg mb-2" />
                    <View className="h-4 w-28 bg-gray-200 rounded-lg" />
                  </View>
                  <View className="items-end">
                    <View className="h-7 w-24 bg-gray-200 rounded-lg mb-1" />
                    <View className="h-3 w-16 bg-gray-200 rounded-lg" />
                  </View>
                </View>
                <View className="h-10 bg-gray-200 rounded-lg" />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : rooms.length === 0 ? (
        /* No Available Rooms */
        <View className="flex-1 justify-center items-center px-5">
          <View className="bg-gray-100 rounded-full p-6 mb-4">
            <Calendar color="#6B7280" size={40} />
          </View>
          <Text style={{ fontSize: 18, fontFamily: 'Roboto-Bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
            No Available Rooms
          </Text>
          <Text style={{ fontSize: 13, fontFamily: 'Roboto', color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
            All rooms are currently booked. Please check back later or contact the resort for availability.
          </Text>
          <TouchableOpacity
            onPress={handleBack}
            className="bg-[#1F2937] px-6 py-2.5 rounded-lg"
          >
            <Text style={{ fontSize: 13, fontFamily: 'Roboto-Medium', color: '#FFFFFF' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Available Rooms List */
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-4 py-4">
            <Text style={{ fontSize: 13, fontFamily: 'Roboto', color: '#6B7280', marginBottom: 16 }}>
              Choose from our available rooms for your stay
            </Text>
            
            {rooms.map((room) => (
              <TouchableOpacity
                key={room._id}
                onPress={() => handleBookRoom(room)}
                activeOpacity={0.7}
                className="bg-white border border-gray-200 rounded-xl p-4 mb-3"
              >
                {/* Room Header */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text style={{ fontSize: 17, fontFamily: 'Roboto-Bold', color: '#111827', marginBottom: 6 }}>
                      {room.room_type}
                    </Text>
                    
                    <View className="flex-row items-center mb-2">
                      <Users color="#6B7280" size={14} />
                      <Text style={{ fontSize: 12, fontFamily: 'Roboto', color: '#6B7280', marginLeft: 6 }}>
                        Up to {room.capacity} guests
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <CheckCircle color="#10B981" size={14} />
                      <Text style={{ fontSize: 12, fontFamily: 'Roboto-Medium', color: '#059669', marginLeft: 6 }}>
                        Available now
                      </Text>
                    </View>
                  </View>
                  
                  <View className="items-end">
                    <Text style={{ fontSize: 20, fontFamily: 'Roboto-Bold', color: '#111827' }}>
                      ₱{room.price_per_night.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: 'Roboto', color: '#6B7280' }}>/night</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
