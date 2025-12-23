import { useAuth } from '@/contexts/AuthContext';
import { reservationAPI, type Reservation } from '@/services/reservationService';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import * as React from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Avatar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = React.useState<Reservation[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await reservationAPI.getUserReservations();
      setReservations(response.reservations);
      console.log('REservationssss',response.reservations[0]);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchReservations();
    }, [])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'completed': return '#3b82f6';
      case 'rejected': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header with Settings Icon */}
      <View className="bg-white px-4  border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text style={{ fontSize: 22, fontFamily: 'Roboto-Bold', color: '#111827' }}>Profile</Text>
          <TouchableOpacity 
            onPress={() => router.push('/customer/SettingsScreen')}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <Settings color="#1F2937" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}  contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-4 pt-4 pb-4">
          <View className="items-center mb-6">
            <Avatar.Image 
              size={80}
              source={{ uri: user?.avatar || 'https://randomuser.me/api/portraits/women/32.jpg' }}
              style={{ marginBottom: 12 }}
            />
            <Text style={{ fontSize: 20, fontFamily: 'Roboto-Bold', color: '#111827', marginBottom: 2 }}>{user?.name}</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Roboto', color: '#6B7280' }}>{user?.email}</Text>
            <View className="bg-green-50 px-3 py-1 rounded-full mt-2">
              <Text style={{ fontSize: 11, fontFamily: 'Roboto-Medium', color: '#166534', textTransform: 'capitalize' }}>
                {user?.role} Account
              </Text>
            </View>
          </View>



        {/* Reservations Section */}
        <View className="bg-white rounded-xl border border-gray-200 mb-4 p-4">
          <Text style={{ fontSize: 16, fontFamily: 'Roboto-Bold', color: '#111827', marginBottom: 12 }}>My Reservations</Text>
          
          {loading ? (
            <View className="items-center py-8">
              <ActivityIndicator animating={true} color="#1F2937" size="large" />
              <Text style={{ fontSize: 13, fontFamily: 'Roboto', color: '#6B7280', marginTop: 8 }}>Loading reservations...</Text>
            </View>
          ) : reservations.length === 0 ? (
            <View className="items-center py-8">
              <Text style={{ fontSize: 14, fontFamily: 'Roboto-Medium', color: '#6B7280', marginBottom: 4 }}>No reservations found</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Roboto', color: '#9CA3AF', textAlign: 'center' }}>Start exploring resorts to make your first booking!</Text>
            </View>
          ) : (
            <View>
              {reservations.slice(0, 3).map((reservation) => (
                <TouchableOpacity
                  key={reservation._id}
                  className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: "/customer/CustomerReservationDetailsScreen",
                      params: { reservationId: reservation._id },
                    })
                  }
                >
                  <View className="flex-row gap-3">
                    
                    {/* Resort IMAGE */}
                    <Image
                      source={{
                        uri:
                          reservation.room_id?.resort_id?.image ||
                          "https://via.placeholder.com/100x80?text=No+Image",
                      }}
                      style={{
                        width: 90,
                        height: 80,
                        borderRadius: 10,
                      }}
                    />

                    {/* RIGHT SIDE CONTENT */}
                    <View style={{ flex: 1 }}>

                      {/* Resort Name + Status */}
                      <View className="flex-row justify-between items-start mb-1">
                        <Text
                          style={{
                            fontSize: 15,
                            fontFamily: "Roboto-Bold",
                            color: "#111827",
                            flex: 1,
                            marginRight: 8,
                          }}
                        >
                          {reservation.room_id?.resort_id?.resort_name || "Resort Name"}
                        </Text>

                        <View
                          className="px-2 py-1 rounded-lg"
                          style={{ backgroundColor: getStatusColor(reservation.status) }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontFamily: "Roboto-Bold",
                              color: "#FFFFFF",
                              textTransform: "uppercase",
                            }}
                          >
                            {reservation.status}
                          </Text>
                        </View>
                      </View>

                      {/* Room Type + Number */}
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Roboto",
                          color: "#6B7280",
                          marginBottom: 2,
                        }}
                      >
                        Room: {reservation.room_id?.room_type || "N/A"}{" "}
                        {reservation.room_id?.room_number
                          ? `• #${reservation.room_id.room_number}`
                          : ""}
                      </Text>

                      {/* Dates */}
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Roboto",
                          color: "#9CA3AF",
                          marginBottom: 4,
                        }}
                      >
                        {new Date(reservation.start_date).toLocaleDateString()} –{" "}
                        {new Date(reservation.end_date).toLocaleDateString()}
                      </Text>

                      {/* Total Price */}
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "Roboto-Bold",
                          color: "#1F2937",
                        }}
                      >
                        ₱{reservation.total_price.toLocaleString()}
                      </Text>

                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {reservations.length > 3 && (
                <TouchableOpacity 
                  className="py-2 mt-1"
                  onPress={() => router.push('/customer/CustomerReservationsScreen')}
                >
                  <Text style={{ fontSize: 13, fontFamily: 'Roboto-Medium', color: '#1F2937', textAlign: 'center' }}>
                    View All {reservations.length} Reservations
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
