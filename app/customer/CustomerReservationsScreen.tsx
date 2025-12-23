import { reservationAPI, type Reservation } from '@/services/reservationService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomerReservationsScreen() {
  const router = useRouter();
  
  const [reservations, setReservations] = React.useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = React.useState<Reservation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFilter, setSelectedFilter] = React.useState<string>('all');

  const statusFilters = [
    { key: 'all', label: 'All', count: 0 },
    { key: 'pending', label: 'Pending', count: 0 },
    { key: 'approved', label: 'Approved', count: 0 },
    { key: 'completed', label: 'Completed', count: 0 },
    { key: 'rejected', label: 'Rejected', count: 0 },
    { key: 'cancelled', label: 'Cancelled', count: 0 }
  ];

  const fetchReservations = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await reservationAPI.getUserReservations();
      setReservations(response.reservations);
      setFilteredReservations(response.reservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchReservations();
    }, [])
  );

  // Filter and search logic
  React.useEffect(() => {
    let filtered = reservations;

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(reservation => reservation.status === selectedFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(reservation => {
        const resortName = reservation.room_id?.resort_id.resort_name?.toLowerCase() || '';
        const roomType = reservation.room_id?.room_type?.toLowerCase() || '';
        const location = reservation.room_id?.resort_id.location?.address?.toLowerCase() || '';
        
        return resortName.includes(query) || 
               roomType.includes(query) || 
               location.includes(query);
      });
    }

    setFilteredReservations(filtered);
  }, [reservations, selectedFilter, searchQuery]);

  // Update filter counts
  const updatedFilters = statusFilters.map(filter => ({
    ...filter,
    count: filter.key === 'all' 
      ? reservations.length 
      : reservations.filter(r => r.status === filter.key).length
  }));

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'completed': return 'flag';
      case 'rejected': return 'close-circle';
      case 'cancelled': return 'ban';
      default: return 'help-circle';
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return `${start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })} - ${end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  const calculateNights = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator animating={true} color="#3b82f6" size="large" />
          <Text className="text-gray-500 mt-4">Loading your reservations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="p-6 bg-white border-b border-gray-200">
        <View className="flex-row items-center mb-4">
          <Button 
            mode="text" 
            onPress={() => router.back()}
            contentStyle={{ flexDirection: 'row-reverse' }}
          >
            <Ionicons name="arrow-back" size={24} color="#3b82f6" />
          </Button>
          <Text className="text-xl font-bold text-gray-800 ml-2">My Reservations</Text>
        </View>

        {/* Search Bar */}
        <TextInput
          mode="outlined"
          placeholder="Search by resort name, room type, or location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon={() => <Ionicons name="search" size={20} color="#6b7280" />} />}
          outlineColor="#e5e7eb"
          activeOutlineColor="#3b82f6"
          style={{ backgroundColor: 'white' }}
          className="mb-4"
        />

        {/* Status Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {updatedFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setSelectedFilter(filter.key)}
              className="mr-3"
            >
              <Chip
                mode={selectedFilter === filter.key ? 'flat' : 'outlined'}
                selected={selectedFilter === filter.key}
                textStyle={{
                  color: selectedFilter === filter.key ? 'white' : '#6b7280',
                  fontWeight: selectedFilter === filter.key ? 'bold' : 'normal'
                }}
                style={{
                  backgroundColor: selectedFilter === filter.key ? '#3b82f6' : 'transparent',
                  borderColor: selectedFilter === filter.key ? '#3b82f6' : '#e5e7eb'
                }}
              >
                {filter.label} ({filter.count})
              </Chip>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Reservations List */}
      <ScrollView 
        className="flex-1 p-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchReservations(true)} />
        }
      >
        {filteredReservations.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text className="text-xl font-semibold text-gray-500 mt-4 mb-2">
              {searchQuery.trim() || selectedFilter !== 'all' ? 'No matching reservations' : 'No reservations yet'}
            </Text>
            <Text className="text-gray-400 text-center mb-6">
              {searchQuery.trim() || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start exploring amazing resorts and make your first booking!'
              }
            </Text>
            {(!searchQuery.trim() && selectedFilter === 'all') && (
              <Button
                mode="contained"
                onPress={() => router.push('/customer/(customer-tabs)/HomeScreen')}
                buttonColor="#3b82f6"
              >
                Explore Resorts
              </Button>
            )}
          </View>
        ) : (
          <View>
            {/* Results Count */}
            <Text className="text-sm text-gray-600 mb-4">
              Showing {filteredReservations.length} of {reservations.length} reservations
            </Text>

            {/* Reservation Cards */}
            {filteredReservations.map((reservation) => {
              const resort = reservation.room_id?.resort_id;
              const room = reservation.room_id;
              const nights = calculateNights(reservation.start_date, reservation.end_date);

              return (
                <TouchableOpacity
                  key={reservation._id}
                  onPress={() => router.push({
                    pathname: '/customer/CustomerReservationDetailsScreen',
                    params: { reservationId: reservation._id }
                  })}
                >
                  <Card className="mb-4">
                    <Card.Content className="p-6">
                      {/* Header Row */}
                      <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-1 mr-3">
                          <Text className="text-lg font-bold text-gray-800 mb-1">
                            {resort?.resort_name || 'Resort Name'}
                          </Text>
                          <View className="flex-row items-center">
                            <Ionicons name="location" size={14} color="#6b7280" />
                            <Text className="text-sm text-gray-600 ml-1" numberOfLines={1}>
                              {resort?.location?.address || 'Location not available'}
                            </Text>
                          </View>
                        </View>
                        
                        <Chip
                          mode="flat"
                          icon={() => <Ionicons name={getStatusIcon(reservation.status)} size={14} color="white" />}
                          textStyle={{ fontSize: 11, color: 'white', fontWeight: 'bold' }}
                          style={{ backgroundColor: getStatusColor(reservation.status) }}
                          compact
                        >
                          {reservation.status.toUpperCase()}
                        </Chip>
                      </View>

                      {/* Reservation Details */}
                      <View className="space-y-2">
                        <View className="flex-row justify-between">
                          <Text className="text-gray-600">Room:</Text>
                          <Text className="font-medium text-gray-800">
                            {room?.room_type || 'N/A'}
                          </Text>
                        </View>
                        
                        <View className="flex-row justify-between">
                          <Text className="text-gray-600">Dates:</Text>
                          <Text className="font-medium text-gray-800">
                            {formatDateRange(reservation.start_date, reservation.end_date)}
                          </Text>
                        </View>
                        
                        <View className="flex-row justify-between">
                          <Text className="text-gray-600">Duration:</Text>
                          <Text className="font-medium text-gray-800">
                            {nights} {nights === 1 ? 'night' : 'nights'}
                          </Text>
                        </View>
                        
                        <View className="flex-row justify-between items-center pt-2 border-t border-gray-200">
                          <Text className="text-gray-600">Total:</Text>
                          <Text className="text-xl font-bold text-blue-600">
                            ${reservation.total_price}
                          </Text>
                        </View>
                      </View>

                      {/* Booking Date */}
                      <Text className="text-xs text-gray-400 mt-3">
                        Booked on {new Date(reservation.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}