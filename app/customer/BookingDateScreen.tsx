import { AvailabilityCheck } from '@/services/reservationService';
import { Room } from '@/services/roomService';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookingDateScreen() {
  const { 
    resortId, 
    roomId, 
    resortName, 
    roomType, 
    pricePerNight, 
    capacity 
  } = useLocalSearchParams<{
    resortId: string;
    roomId: string;
    resortName: string;
    roomType: string;
    pricePerNight: string;
    capacity: string;
  }>();

  const [room, setRoom] = useState<Room | null>(null);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilityCheck | null>(null);
  const [markedDates, setMarkedDates] = useState<any>({});

  // useEffect(() => {
  //   if (roomId) {
  //     fetchRoomDetails();
  //   }
  // }, [roomId]);

  // useEffect(() => {
  //   if (checkInDate && checkOutDate && checkInDate < checkOutDate) {
  //     checkAvailability();
  //   }
  // }, [checkInDate, checkOutDate]);

  useEffect(() => {
    updateMarkedDates();
  }, [checkInDate, checkOutDate, bookedDates]);

  // const fetchRoomDetails = async () => {
  //   try {
  //     setLoading(true);
  //     console.log('Fetching room details for roomId:', roomId);
      
  //     const [roomData, bookedDatesData] = await Promise.all([
  //       roomAPI.getRoomById(roomId as string),
  //       reservationAPI.getBookedDates(roomId as string)
  //     ]);
      
  //     console.log('Room data received:', roomData);
  //     console.log('Booked dates received:', bookedDatesData);
      
  //     setRoom(roomData);
  //     setBookedDates(bookedDatesData.booked_dates || []);
  //   } catch (error) {
  //     console.error('Error fetching room details:', error);
  //     // Don't show error alert since we have fallbacks - just log it
  //     console.log('Continuing with fallback data due to error');
  //     // Set empty booked dates as fallback
  //     setBookedDates([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const checkAvailability = async () => {
  //   if (!checkInDate || !checkOutDate) return;
    
  //   try {
  //     setCheckingAvailability(true);
  //     const startDate = checkInDate.toISOString().split('T')[0];
  //     const endDate = checkOutDate.toISOString().split('T')[0];
      
  //     console.log('Checking availability for:', { roomId, startDate, endDate });
      
  //     const result = await reservationAPI.checkAvailability(
  //       roomId as string,
  //       startDate,
  //       endDate
  //     );
      
  //     console.log('Availability result:', result);
  //     setAvailabilityResult(result);
  //   } catch (error) {
  //     console.error('Error checking availability:', error);
  //     // For now, assume room is available if we can't check
  //     console.log('Assuming room is available due to check error');
  //     setAvailabilityResult({
  //       available: true,
  //       room: {
  //         id: roomId as string,
  //         type: roomType as string,
  //         capacity: parseInt(capacity as string),
  //         price_per_night: parseFloat(pricePerNight as string),
  //         resort: null
  //       },
  //       booking_details: {
  //         start_date: checkInDate.toISOString().split('T')[0],
  //         end_date: checkOutDate.toISOString().split('T')[0],
  //         total_price: parseFloat(pricePerNight as string) * Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)),
  //         nights: Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
  //       }
  //     });
  //   } finally {
  //     setCheckingAvailability(false);
  //   }
  // };

  const updateMarkedDates = () => {
    const marked: any = {};

    // Mark booked dates
    bookedDates.forEach(date => {
      marked[date] = {
        disabled: true,
        disableTouchEvent: true,
        color: '#FEE2E2',
        textColor: '#DC2626'
      };
    });

    // Mark selected dates
    if (checkInDate) {
      const checkInStr = checkInDate.toISOString().split('T')[0];
      marked[checkInStr] = {
        ...marked[checkInStr],
        selected: true,
        selectedColor: '#1F2937',
        selectedTextColor: '#FFFFFF'
      };
    }

    if (checkOutDate) {
      const checkOutStr = checkOutDate.toISOString().split('T')[0];
      marked[checkOutStr] = {
        ...marked[checkOutStr],
        selected: true,
        selectedColor: '#1F2937',
        selectedTextColor: '#FFFFFF'
      };
    }

    // Mark dates in range
    if (checkInDate && checkOutDate) {
      const current = new Date(checkInDate);
      current.setDate(current.getDate() + 1);
      
      while (current < checkOutDate) {
        const dateStr = current.toISOString().split('T')[0];
        if (!marked[dateStr] || !marked[dateStr].disabled) {
          marked[dateStr] = {
            ...marked[dateStr],
            color: '#F3F4F6',
            textColor: '#374151'
          };
        }
        current.setDate(current.getDate() + 1);
      }
    }

    setMarkedDates(marked);
  };

  const handleDayPress = (day: any) => {
    const selectedDate = new Date(day.dateString);
    
    // Don't allow selection of past dates or booked dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today || bookedDates.includes(day.dateString)) {
      return;
    }

    if (!checkInDate) {
      // First selection - set check-in date
      setCheckInDate(selectedDate);
      setCheckOutDate(null);
    } else if (!checkOutDate) {
      // Second selection - set check-out date if after check-in
      if (selectedDate > checkInDate) {
        setCheckOutDate(selectedDate);
      } else {
        // Reset if selected date is before check-in
        setCheckInDate(selectedDate);
        setCheckOutDate(null);
      }
    } else {
      // Both dates selected - start over
      setCheckInDate(selectedDate);
      setCheckOutDate(null);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    if (!checkInDate || !checkOutDate) {
      Alert.alert('Incomplete Selection', 'Please select both check-in and check-out dates');
      return;
    }

    // Navigate to customer room view
    router.push({
      pathname: '/customer/ViewRooms',
      params: {
        resortId,
        resortName,
        checkInDate: checkInDate.toISOString().split('T')[0],
        checkOutDate: checkOutDate.toISOString().split('T')[0],
      }
    });

    // Navigate to booking confirmation
    // router.push({
    //   pathname: '/customer/BookingConfirmation',
    //   params: {
    //     resortId,
    //     // roomId,
    //     resortName,
    //     // roomType: availabilityResult.room.type,
    //     // capacity: availabilityResult.room.capacity.toString(),
    //     // pricePerNight: availabilityResult.room.price_per_night.toString(),
    //     checkInDate: checkInDate.toISOString().split('T')[0],
    //     checkOutDate: checkOutDate.toISOString().split('T')[0],
    //     // totalPrice: availabilityResult.booking_details.total_price.toString(),
    //     // nights: availabilityResult.booking_details.nights.toString()
    //   }
    // });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={handleBack} className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center">
          <ChevronLeft color="#1F2937" size={20} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontFamily: 'Roboto-Bold', color: '#111827' }}>Select Dates</Text>
        <View className="w-9" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      

        {/* Date Selection Summary */}
        <View className="px-4 py-3">
          <View className="flex-row gap-2">
            <View className="flex-1 p-3 bg-white border border-gray-200 rounded-xl">
              <Text style={{ fontSize: 10, fontFamily: 'Roboto-Medium', color: '#6B7280', marginBottom: 4, letterSpacing: 0.5 }}>CHECK-IN</Text>
              <Text style={{ fontSize: 14, fontFamily: 'Roboto-Bold', color: '#111827' }}>
                {checkInDate ? formatDate(checkInDate) : 'Select date'}
              </Text>
            </View>
            
            <View className="flex-1 p-3 bg-white border border-gray-200 rounded-xl">
              <Text style={{ fontSize: 10, fontFamily: 'Roboto-Medium', color: '#6B7280', marginBottom: 4, letterSpacing: 0.5 }}>CHECK-OUT</Text>
              <Text style={{ fontSize: 14, fontFamily: 'Roboto-Bold', color: '#111827' }}>
                {checkOutDate ? formatDate(checkOutDate) : 'Select date'}
              </Text>
            </View>
          </View>
        </View>

        {/* Calendar */}
        <View className="px-4 mb-2">
          <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
            <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            markingType={'period'}
            minDate={new Date().toISOString().split('T')[0]}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#6B7280',
                textSectionTitleDisabledColor: '#D1D5DB',
                selectedDayBackgroundColor: '#1F2937',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#1F2937',
                dayTextColor: '#374151',
                textDisabledColor: '#9CA3AF',
                dotColor: '#1F2937',
                selectedDotColor: '#ffffff',
                arrowColor: '#1F2937',
                disabledArrowColor: '#D1D5DB',
                monthTextColor: '#1F2937',
                indicatorColor: '#1F2937',
                textDayFontFamily: 'Roboto',
                textMonthFontFamily: 'Roboto-Bold',
                textDayHeaderFontFamily: 'Roboto-Medium',
                textDayFontWeight: '400',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12
              }}
              style={{
                paddingTop: 8,
                paddingBottom: 12
              }}
              enableSwipeMonths={true}
              hideExtraDays={true}
              firstDay={0}
            />
          </View>
        </View>

        {/* Legend */}
        <View className="px-4 py-3">
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-[#1F2937] rounded mr-2" />
              <Text style={{ fontSize: 11, fontFamily: 'Roboto', color: '#6B7280' }}>Selected</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-red-200 rounded mr-2" />
              <Text style={{ fontSize: 11, fontFamily: 'Roboto', color: '#6B7280' }}>Booked</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-gray-100 rounded mr-2" />
              <Text style={{ fontSize: 11, fontFamily: 'Roboto', color: '#6B7280' }}>In range</Text>
            </View>
          </View>
        </View>

        {/* Availability Result */}
        {checkingAvailability && (
          <View className="px-4 py-2">
            <View className="flex-row items-center justify-center p-3 bg-blue-50 rounded-xl border border-blue-100">
              <ActivityIndicator size="small" color="#3B82F6" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, fontFamily: 'Roboto-Medium', color: '#1E40AF' }}>Checking availability...</Text>
            </View>
          </View>
        )}

        {availabilityResult && checkInDate && checkOutDate && (
          <View className="px-4 py-2">
            <View className={`p-3 rounded-xl border ${
              availabilityResult.available ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
            }`}>
              <Text style={{
                fontSize: 14,
                fontFamily: 'Roboto-Bold',
                color: availabilityResult.available ? '#166534' : '#991B1B'
              }}>
                {availabilityResult.available ? '✓ Available!' : '✕ Not Available'}
              </Text>
              {availabilityResult.available && (
                <Text style={{ fontSize: 13, fontFamily: 'Roboto', color: '#166534', marginTop: 4 }}>
                  {availabilityResult.booking_details.nights} night{availabilityResult.booking_details.nights !== 1 ? 's' : ''} • ₱{availabilityResult.booking_details.total_price.toLocaleString()} total
                </Text>
              )}
            </View>
          </View>
        )}
        
        <View className="h-20" />
      </ScrollView>

      {/* Continue Button */}
      <View className="bg-white px-4 py-3 border-t border-gray-200">
        <TouchableOpacity
          onPress={handleContinue}
          // disabled={!checkInDate || !checkOutDate || !availabilityResult?.available || checkingAvailability}
          
          disabled={!checkInDate || !checkOutDate}
          className={`py-3 rounded-xl items-center ${
            checkInDate && checkOutDate
              ? 'bg-[#1F2937]'
              : 'bg-gray-300'
          }`}
        >
          <Text style={{ fontSize: 14, fontFamily: 'Roboto-Bold', color: '#FFFFFF' }}>
            Continue to Booking
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}