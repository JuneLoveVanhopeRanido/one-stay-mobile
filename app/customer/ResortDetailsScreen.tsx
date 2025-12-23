import ResortScreenMaps from '@/components/resort-screen/resort-screen-maps';
import { useAuth } from '@/contexts/AuthContext';
import { Amenity, amenityAPI } from '@/services/amenityService';
import { customerFavoriteAPI } from '@/services/customerFavoriteService';
import { Resort, resortAPI } from '@/services/resortService';
import { Room, roomAPI } from '@/services/roomService';
import { ResortStats, statsAPI } from '@/services/statsService';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Heart,
  MapPin,
  Share2,
  Star,
  Users
} from 'lucide-react-native';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ResortDetailsScreen() {
  const { resortId, startDate,endDate } = useLocalSearchParams();
  const { user } = useAuth();
  const [resort, setResort] = React.useState<Resort | null>(null);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [stats, setStats] = React.useState<ResortStats | null>(null);
  const [amenities, setAmenities] = React.useState<Amenity[]>([]);
  
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);
  const userId = user?.id;

    React.useEffect(() => {
      loadFavorites();
    }, []);
  
    const loadFavorites = async () => {
      try {
        if (!userId) return;
        const favResorts = await customerFavoriteAPI.getMyFavorites(userId);
        setFavoriteIds(favResorts.map((r: any) => r._id));
      } catch (e) {
        console.log("Error loading favorites:", e);
      }
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

  React.useEffect(() => {
    if (resortId) {
      fetchResortDetails();
    }
  }, [resortId]);

  const fetchResortDetails = async () => {
    try {
      setLoading(true);
      const [resortData, roomsData, statsData, amenitiesData] = await Promise.all([
        resortAPI.getResortById(resortId as string),
        roomAPI.getRoomsByResort(resortId as string),
        statsAPI.getResortStats(resortId as string),
        amenityAPI.getAmenitiesByResort(resortId as string)
      ]);
      setResort(resortData);
      setRooms(roomsData.rooms);
      setStats(statsData);
      setAmenities(amenitiesData);
    } catch (error) {
      console.error('Error fetching resort details:', error);
      Alert.alert('Error', 'Failed to load resort details. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Implement favorite functionality with backend
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    Alert.alert('Share', 'Share functionality will be implemented soon!');
  };

  const handleViewAllRooms = () => {
    // Navigate to customer room view
    router.push({
      pathname: '/customer/ViewRooms',
      params: {
        resortId: resortId as string,
        fromScreen:"SeeAll"
      }
    });

    
  };

  const handleBooking = () => {
    // Navigate to customer room view
    // router.push({
    //   pathname: '/customer/ViewRooms',
    //   params: {
    //     resortId: resortId as string,
    //     resortName: resort?.resort_name
    //   }
    // });
      // Navigate to booking date selection screen
        router.push({
          pathname: '/customer/BookingDateScreen',
          params: {
            resortId: resortId as string,
            resortName: resort?.resort_name || 'Resort',
            startDate,
            endDate
          }
        });

    
  };



  const handleBookRoom = (room: Room) => {
    // Navigate directly to booking for this specific room
    Alert.alert(
      'Book Room',
      `Would you like to book ${room.room_type} for $${room.price_per_night}/night?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Book Now',
          onPress: () => {
            Alert.alert('Booking', 'Booking functionality will be implemented soon!');
          }
        }
      ]
    );
  };

  const handleBookNow = () => {
    if (rooms.length > 0) {
      // Navigate to the room selection screen
      handleBooking();
    } else {
      Alert.alert('No Rooms', 'This resort has no rooms available for booking.');
    }
  };

  const handleContact = () => {
    // Navigate directly to search for existing chat or create new one in the conversation screen
    router.push({
      pathname: '/customer/CustomerChatConvo', 
      params: {
        resortId: resort?._id,
        resortName: resort?.resort_name,
        newChat: 'true' // Flag to indicate this is a new conversation
      }
    });
  };

  const handleSendMessage = () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to send messages.');
      return;
    }
    
    if (!resort) {
      Alert.alert('Error', 'Resort information not available.');
      return;
    }

    handleContact();
  };

  if (!resort && !loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text style={{ fontSize: 18, fontFamily: 'Roboto-Medium', color: '#6B7280' }}>Resort not found</Text>
          <TouchableOpacity onPress={handleBack} className="mt-4">
            <Text style={{ fontSize: 14, fontFamily: 'Roboto-Medium', color: '#3B82F6' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View className="relative">
          {loading ? (
            <View 
              style={{ width, height: 280 }} 
              className="bg-gray-200 items-center justify-center"
            >
              <ActivityIndicator size="large" color="#1F2937" />
            </View>
          ) : resort?.image ? (
            <Image 
              source={{ uri: resort.image }} 
              style={{ width, height: 280 }}
              resizeMode="cover"
            />
          ) : (
            <View 
              style={{ width, height: 280 }} 
              className="bg-gray-200 items-center justify-center"
            >
              <Text style={{ fontSize: 14, fontFamily: 'Roboto', color: '#9CA3AF' }}>No Image Available</Text>
            </View>
          )}
          
          {/* Header Overlay */}
          <View className="absolute top-3 left-0 right-0 flex-row justify-between items-center px-4">
            <TouchableOpacity 
              onPress={handleBack}
              className="w-9 h-9 bg-white/95 rounded-full items-center justify-center shadow-sm"
            >
              <ChevronLeft color="#1F2937" size={20} />
            </TouchableOpacity>
            
            {!loading && (
              <View className="flex-row gap-2">
                <TouchableOpacity 
                  onPress={handleShare}
                  className="w-9 h-9 bg-white/95 rounded-full items-center justify-center shadow-sm"
                >
                  <Share2 color="#1F2937" size={18} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleFavorite(resort?._id as string);
                  }}
                  className="w-9 h-9 bg-white/95 rounded-full items-center justify-center shadow-sm"
                >
                  <Heart 
                    color={favoriteIds.includes(resort?._id as string) ? "#DC2626" : "#1F2937"} 
                    size={18} 
                    fill={favoriteIds.includes(resort?._id as string) ? "#DC2626" : "transparent"}
                  />
                </TouchableOpacity>

  
              </View>
            )}
          </View>
        </View>

        {/* Resort Info */}
        <View className="bg-white rounded-t-3xl -mt-4 px-4 pt-4">
          {loading ? (
            /* Skeleton Loading */
            <>
              {/* Title Skeleton */}
              <View className="mb-3">
                <View className="h-7 bg-gray-200 rounded-lg mb-3" style={{ width: '70%' }} />
                <View className="flex-row items-center mb-2 gap-3">
                  <View className="h-7 w-32 bg-gray-200 rounded-lg" />
                  <View className="h-7 w-20 bg-gray-200 rounded-lg" />
                </View>
                <View className="h-4 bg-gray-200 rounded-lg" style={{ width: '90%' }} />
              </View>

              {/* Description Skeleton */}
              <View className="mb-4">
                <View className="h-5 w-32 bg-gray-200 rounded-lg mb-2" />
                <View className="h-4 bg-gray-200 rounded-lg mb-2" style={{ width: '100%' }} />
                <View className="h-4 bg-gray-200 rounded-lg mb-2" style={{ width: '95%' }} />
                <View className="h-4 bg-gray-200 rounded-lg" style={{ width: '85%' }} />
              </View>

              {/* Amenities Skeleton */}
              <View className="mb-4">
                <View className="h-5 w-24 bg-gray-200 rounded-lg mb-2" />
                <View className="flex-row flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} className="h-8 w-24 bg-gray-200 rounded-lg" />
                  ))}
                </View>
              </View>

              {/* Rooms Skeleton */}
              <View className="mb-4">
                <View className="h-5 w-40 bg-gray-200 rounded-lg mb-3" />
                {[1, 2].map((i) => (
                  <View key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
                    <View className="h-5 w-32 bg-gray-200 rounded-lg mb-2" />
                    <View className="h-4 w-24 bg-gray-200 rounded-lg mb-2" />
                    <View className="h-5 w-28 bg-gray-200 rounded-lg" />
                  </View>
                ))}
              </View>
            </>
          ) : resort ? (
            <>
              {/* Title and Rating */}
              <View className="mb-3">
                <Text style={{ fontSize: 22, fontFamily: 'Roboto-Bold', color: '#111827', marginBottom: 4 }}>
                  {resort.resort_name}
                </Text>
                
                <View className="flex-row items-center mb-2">
                  <View className="flex-row items-center bg-amber-50 px-2 py-1 rounded-lg mr-3">
                    <Star color="#F59E0B" size={14} fill="#F59E0B" />
                    <Text style={{ fontSize: 13, fontFamily: 'Roboto-Bold', color: '#92400E', marginLeft: 4 }}>
                      {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: 'Roboto', color: '#92400E', marginLeft: 4 }}>
                      ({stats?.totalFeedbacks || 0} reviews)
                    </Text>
                  </View>
                  {rooms.filter(room => room.status === 'available').length > 0 && (
                    <View className="bg-green-50 px-2 py-1 rounded-lg">
                      <Text style={{ fontSize: 12, fontFamily: 'Roboto-Medium', color: '#166534' }}>Available</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center">
                  <MapPin color="#6B7280" size={14} />
                  <Text style={{ fontSize: 13, fontFamily: 'Roboto', color: '#6B7280', marginLeft: 6, flex: 1 }}>
                    {resort.location.address}
                  </Text>
                </View>
              </View>

              {/* Description */}
              {resort.description && (
                <View className="mb-4">
                  <Text style={{ fontSize: 16, fontFamily: 'Roboto-Bold', color: '#111827', marginBottom: 8 }}>
                    About this resort
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Roboto', color: '#6B7280', lineHeight: 20 }}>
                    {resort.description}
                  </Text>
                </View>
              )}
            </>
          ) : null}

          {/* Amenities */}
          {amenities.length > 0 && (
            <View className="mb-4">
              <Text style={{ fontSize: 16, fontFamily: 'Roboto-Bold', color: '#111827', marginBottom: 8 }}>
                Amenities
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <View key={amenity._id} className="bg-gray-50 px-3 py-2 rounded-lg flex-row items-center">
                    <Star color="#6B7280" size={14} />
                    <Text style={{ fontSize: 12, fontFamily: 'Roboto', color: '#4B5563', marginLeft: 6 }}>{amenity.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}


          {/* Location Map */}
          {!loading && resort && (
            <ResortScreenMaps 
              location={resort.location}
              resortName={resort.resort_name}
            />
          )}

          {/* Rooms Available */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ fontSize: 16, fontFamily: 'Roboto-Bold', color: '#111827' }}>
                Available Rooms ({rooms.filter(room => room.status === 'available').length})
              </Text>
              {rooms.length > 0 && (
                <TouchableOpacity onPress={handleViewAllRooms}>
                  <Text style={{ fontSize: 13, fontFamily: 'Roboto-Medium', color: '#1F2937' }}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {rooms.length > 0 ? (
              <View className="gap-3">
                {rooms
                  .filter(room => room.status === 'available')
                  .slice(0, 3)
                  .map((room) => (
                  <TouchableOpacity 
                    key={room._id}
                    onPress={() => room.status === 'available' ? handleBookRoom(room) : null}
                    disabled={room.status !== 'available'}
                    activeOpacity={0.7}
                    className={`rounded-xl p-3 border ${
                      room.status === 'available' 
                        ? 'bg-white border-gray-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text style={{ fontSize: 16, fontFamily: 'Roboto-Bold', color: '#111827', marginBottom: 4 }}>
                          {room.room_type}
                        </Text>
                        <View className="flex-row items-center">
                          <Users color="#6B7280" size={13} />
                          <Text style={{ fontSize: 12, fontFamily: 'Roboto', color: '#6B7280', marginLeft: 4 }}>
                            Up to {room.capacity} guests
                          </Text>
                        </View>
                        {room.status !== 'available' && (
                          <View className="bg-gray-200 px-2 py-1 rounded-lg mt-2 self-start">
                            <Text style={{ fontSize: 11, fontFamily: 'Roboto-Medium', color: '#6B7280' }}>
                              Not Available
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <View className="items-end">
                        <Text style={{ fontSize: 18, fontFamily: 'Roboto-Bold', color: '#111827' }}>
                          ₱{room.price_per_night.toLocaleString()}
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: 'Roboto', color: '#6B7280' }}>/night</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                
                {rooms.filter(room => room.status === 'available').length > 3 && (
                  <TouchableOpacity 
                    onPress={handleViewAllRooms}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-3"
                  >
                    <Text style={{ fontSize: 13, fontFamily: 'Roboto-Medium', color: '#1F2937', textAlign: 'center' }}>
                      View {rooms.filter(room => room.status === 'available').length - 3} More Rooms
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View className="bg-gray-50 rounded-xl p-6 items-center">
                <Text style={{ fontSize: 13, fontFamily: 'Roboto', color: '#6B7280', textAlign: 'center' }}>
                  No rooms available at this resort
                </Text>
              </View>
            )}
          </View>

          {/* Feedback Section */}
{resort?.feedbacks && resort.feedbacks.length > 0 && (
  <View className="mb-4">
    <Text 
      style={{ 
        fontSize: 16, 
        fontFamily: 'Roboto-Bold', 
        color: '#111827', 
        marginBottom: 8 
      }}
    >
      Guest Feedback ({resort.feedbacks.length})
    </Text>

    <View className="gap-3">
      {resort.feedbacks.map((fb) => (
        <View 
          key={fb._id} 
          className="bg-white border border-gray-200 p-3 rounded-xl"
        >
          {/* User & Rating */}
          <View className="flex-row justify-between items-center mb-1">
            <Text 
              style={{ 
                fontSize: 14, 
                fontFamily: 'Roboto-Bold', 
                color: '#111827' 
              }}
            >
              {fb.from_user.username}
            </Text>

            <View className="flex-row items-center">
              <Star 
                size={14} 
                color="#F59E0B" 
                fill="#F59E0B" 
              />
              <Text 
                style={{ 
                  marginLeft: 4, 
                  fontSize: 13, 
                  fontFamily: 'Roboto-Bold', 
                  color: '#92400E' 
                }}>
                {fb.rating}
              </Text>
            </View>
          </View>

          {/* Room info */}
          <Text 
            style={{ 
              fontSize: 12, 
              fontFamily: 'Roboto', 
              color: '#6B7280' 
            }}
          >
            Stayed at: {fb.room.room_type}
            {fb.room.room_number ? ` • Room ${fb.room.room_number}` : ''}
          </Text>

          {/* Comment */}
          {fb.comment && (
            <Text 
              style={{ 
                fontSize: 13, 
                fontFamily: 'Roboto', 
                color: '#374151', 
                marginTop: 6, 
                lineHeight: 18 
              }}
            >
              {fb.comment}
            </Text>
          )}

          {/* Date */}
          <Text 
            style={{ 
              marginTop: 6, 
              fontSize: 11, 
              color: '#9CA3AF', 
              fontFamily: 'Roboto' 
            }}
          >
            {new Date(fb.createdAt).toLocaleDateString()}
          </Text>
        </View>
      ))}
    </View>
  </View>
)}



        </View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View className="bg-white border-t border-gray-200 px-4 py-3">
        {loading ? (
          /* Skeleton for bottom bar */
          <View className="flex-row items-center justify-between">
            <View>
              <View className="h-3 w-20 bg-gray-200 rounded mb-2" />
              <View className="h-6 w-32 bg-gray-200 rounded" />
            </View>
            <View className="flex-row gap-2">
              <View className="h-10 w-24 bg-gray-200 rounded-lg" />
              <View className="h-10 w-28 bg-gray-200 rounded-lg" />
            </View>
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <View>
              <Text style={{ fontSize: 11, fontFamily: 'Roboto', color: '#6B7280' }}>Starting from</Text>
              <Text style={{ fontSize: 20, fontFamily: 'Roboto-Bold', color: '#111827' }}>
                ₱{rooms.length > 0 ? Math.min(...rooms.map(room => room.price_per_night)).toLocaleString() : '1,500'}
                <Text style={{ fontSize: 12, fontFamily: 'Roboto', color: '#6B7280' }}>/night</Text>
              </Text>
            </View>
            
            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={handleSendMessage}
                disabled={!resort}
                className="bg-gray-100 px-4 py-2.5 rounded-lg"
              >
                <Text style={{ fontSize: 13, fontFamily: 'Roboto-Medium', color: '#4B5563' }}>Message</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleBookNow}
                disabled={!resort}
                className="bg-[#1F2937] px-5 py-2.5 rounded-lg"
              >
                <Text style={{ fontSize: 13, fontFamily: 'Roboto-Medium', color: '#FFFFFF' }}>Book Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
