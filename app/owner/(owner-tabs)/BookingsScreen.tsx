import { useAuth } from '@/contexts/AuthContext';
import { PaginationInfo, Reservation, reservationAPI } from '@/services/reservationService';
import { useRouter } from 'expo-router';
import { Calendar, CheckCircle, ChevronDown, Clock, Search, X, XCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchReservations();
  }, [selectedFilter, searchQuery]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== '') {
        setCurrentPage(1);
        fetchReservations();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchReservations = async (isRefresh = false, loadMore = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setCurrentPage(1);
      } else if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const pageToLoad = loadMore ? currentPage + 1 : (isRefresh ? 1 : currentPage);
      const filterValue = selectedFilter.toLowerCase() === 'all' ? undefined : selectedFilter.toLowerCase();
      
      const response = await reservationAPI.getOwnerReservations({
        status: filterValue,
        search: searchQuery.trim() || undefined,
        page: pageToLoad,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (loadMore) {
        setReservations(prev => [...prev, ...response.reservations]);
        setCurrentPage(pageToLoad);
      } else {
        setReservations(response.reservations || []);
        if (!isRefresh) {
          setCurrentPage(1);
        }
      }
      
      setPagination(response.pagination);
    } catch (error: any) {
      console.error('Error fetching reservations:', error);
      Alert.alert('Error', 'Failed to load reservations. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (pagination?.hasNextPage && !loadingMore) {
      fetchReservations(false, true);
    }
  };

  const handleViewDetails = (reservation: Reservation) => {
    router.push({
      pathname: '/owner/BookingDetailsScreen',
      params: { reservation: JSON.stringify(reservation) }
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      case 'cancelled': return '#6B7280';
      case 'completed': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      case 'cancelled': return XCircle;
      case 'completed': return CheckCircle;
      default: return Clock;
    }
  };

  // No need for client-side filtering since we're doing server-side filtering
  const filteredReservations = reservations;

  return (
    <SafeAreaView className="flex-1 h-[100v] bg-gray-100">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchReservations(true)}
            colors={['#1F2937']}
          />
        }
      >
        {/* Header */}
        <View className="px-6 pb-6 ">
         <Text className="text-xl text-center py-3 text-gray-900" style={{ fontFamily: 'Roboto-Bold' }}>Reservations</Text>

          {/* Search Input */}
          <View className="pb-4">
            <View className="flex-row items-center bg-white rounded-2xl px-2">
              <Search color="#9CA3AF" size={20} />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder="Search by guest, room, or resort..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                style={{ fontSize: 16, fontFamily: 'Roboto' }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  className="w-5 h-5 items-center justify-center ml-2"
                  activeOpacity={0.6}
                >
                  <X color="#9CA3AF" size={16} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            {['All', 'Pending', 'Approved', 'Completed', 'Rejected', 'Cancelled'].map((filter, index) => {
              const isSelected = selectedFilter === filter;
              const colors = {
                'All': '#6366F1',
                'Pending': '#F59E0B', 
                'Approved': '#10B981',
                'Completed': '#8B5CF6',
                'Rejected': '#EF4444',
                'Cancelled': '#6B7280'
              };
              
              return (
                <Chip
                  key={filter}
                  mode="flat"
                  selected={isSelected}
                  onPress={() => {
                    setSelectedFilter(filter);
                    setCurrentPage(1);
                  }}
                  className={`mx-1 ${index === 0 ? 'ml-1' : ''}`}
                  style={{
                    backgroundColor: isSelected ? colors[filter as keyof typeof colors] : '#F3F4F6',
                    borderRadius: 12,
                  }}
                  textStyle={{
                    color: isSelected ? 'white' : '#6B7280',
                    fontFamily: 'Roboto-Medium',
                    fontWeight: '600',
                    fontSize: 13
                  }}
                >
                  {filter}
                </Chip>
              );
            })}
          </ScrollView>
        </View>



        {/* Reservations List */}
        <View className="px-6 pt-2">
          {loading && !refreshing ? (
            <View className="flex-1 justify-center items-center py-32 px-8">
              <ActivityIndicator size="large" color="#1F2937" />
              <Text style={{ color: '#6B7280', marginTop: 16, fontFamily: 'Roboto', fontSize: 16 }}>Loading reservations...</Text>
            </View>
          ) : filteredReservations.length === 0 ? (
            <View className="flex-1 justify-center items-center py-32 px-8">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
                <Calendar color="#9CA3AF" size={40} />
              </View>
              <Text style={{ color: '#111827', fontSize: 20, fontWeight: 'bold', fontFamily: 'Roboto-Bold', marginBottom: 8, textAlign: 'center' }}>No reservations found</Text>
              <Text style={{ color: '#6B7280', textAlign: 'center', fontFamily: 'Roboto', lineHeight: 24 }}>
                {searchQuery ? 
                  `No reservations found matching "${searchQuery}"` :
                  selectedFilter === 'Pending' 
                    ? 'No pending reservations to review at the moment'
                    : selectedFilter === 'Completed'
                    ? 'No completed reservations found'
                    : selectedFilter === 'Cancelled'
                    ? 'No cancelled reservations found'
                    : `No ${selectedFilter.toLowerCase()} reservations found`
                }
              </Text>
            </View>
          ) : (
            filteredReservations.map((reservation) => {
              const StatusIcon = getStatusIcon(reservation.status);
              const roomInfo = reservation.room_id;
              const userInfo = reservation.user_id_populated;
              const resortInfo = roomInfo?.resort_id;

              return (
                <TouchableOpacity 
                  key={reservation._id}
                  onPress={() => handleViewDetails(reservation)}
                  activeOpacity={0.7}
                >
                  <Card className="mb-4 shadow-none border" style={{ 
                    borderRadius: 10,
                    borderColor: '#E5E7EB',
                    borderWidth: 1,
                  }}>
                    <Card.Content className="p-4 bg-white rounded-xl">
                      {/* Header: Customer Name and Status */}
                      <View className="flex-row items-center justify-between mb-3">
                        <Text style={{ fontWeight: 'bold', fontFamily: 'Roboto-Bold', color: '#111827', fontSize: 16 }}>
                          {userInfo?.username || 'Guest'}
                        </Text>
                        <Chip
                          mode="flat"
                          compact
                          style={{
                            backgroundColor: `${getStatusColor(reservation.status)}20`,
                            borderWidth: 1,
                            borderColor: getStatusColor(reservation.status),
                          }}
                          textStyle={{ 
                            color: getStatusColor(reservation.status), 
                            fontSize: 11, 
                            fontFamily: 'Roboto-Medium', 
                            fontWeight: '600' 
                          }}
                        >
                          {reservation.status.toUpperCase()}
                        </Chip>
                      </View>

                      {/* Room Info */}
                      <Text style={{ fontSize: 13, color: '#6B7280', fontFamily: 'Roboto', marginBottom: 12 }}>
                        {resortInfo?.resort_name || 'Resort'} • {roomInfo?.room_type || 'Room'}
                      </Text>

                      {/* Dates and Duration */}
                      <View className="flex-row justify-between items-center mb-3">
                        <View>
                          <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Roboto-Medium' }}>Check-in</Text>
                          <Text style={{ fontSize: 13, color: '#111827', fontFamily: 'Roboto-Medium', marginTop: 2 }}>
                            {formatDate(reservation.start_date)}
                          </Text>
                        </View>
                        <View className="items-center">
                          <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Roboto-Medium' }}>Duration</Text>
                          <Text style={{ fontSize: 13, color: '#111827', fontFamily: 'Roboto-Bold', marginTop: 2 }}>
                            {Math.ceil((new Date(reservation.end_date).getTime() - new Date(reservation.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Roboto-Medium' }}>Check-out</Text>
                          <Text style={{ fontSize: 13, color: '#111827', fontFamily: 'Roboto-Medium', marginTop: 2 }}>
                            {formatDate(reservation.end_date)}
                          </Text>
                        </View>
                      </View>

                      {/* Amount */}
                      <View className="border-t border-gray-200 pt-3 flex-row justify-between items-center">
                        <Text style={{ fontSize: 13, color: '#6B7280', fontFamily: 'Roboto-Medium' }}>Total Amount</Text>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', fontFamily: 'Roboto-Bold' }}>
                          ₱{reservation.total_price}
                        </Text>
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}

        {/* Pagination Info */}
        {pagination && pagination.totalReservations > 0 && (
          <View className="px-6 pb-4">
            <Text style={{ fontSize: 14, fontFamily: 'Roboto', color: '#6B7280', textAlign: 'center' }}>
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalReservations)} of {pagination.totalReservations} reservations
            </Text>
          </View>
        )}

          {/* Load More Button */}
          {pagination?.hasNextPage && (
            <TouchableOpacity
              onPress={handleLoadMore}
              disabled={loadingMore}
              className="mt-6 mb-4"
            >
              <View className="bg-gray-100 border border-gray-200 rounded-2xl py-4 px-6 flex-row items-center justify-center">
                {loadingMore ? (
                  <>
                    <ActivityIndicator size="small" color="#6B7280" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 16, fontFamily: 'Roboto-Medium', color: '#6B7280' }}>
                      Loading more...
                    </Text>
                  </>
                ) : (
                  <>
                    <ChevronDown color="#6B7280" size={20} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 16, fontFamily: 'Roboto-Medium', color: '#6B7280' }}>
                      Load More ({pagination.totalReservations - (pagination.currentPage * pagination.limit)} remaining)
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View className="mb-32" />
      </ScrollView>


    </SafeAreaView>
  );
}
