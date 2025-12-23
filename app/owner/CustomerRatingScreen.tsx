import { useAuth } from '@/contexts/AuthContext';
import { feedbackAPI, FeedbackRequest, Reservation } from '@/services/reservationService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, Send, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Avatar, Card, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomerRatingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Parse the reservation data from params
  const reservation: Reservation = JSON.parse(params.reservation as string);
  
  const handleRatingPress = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    try {
      setSubmitting(true);

      const feedbackData: FeedbackRequest = {
        reservation_id: reservation._id,
        rating,
        comment: comment.trim() || undefined,
        feedback_type: 'owner_to_customer'
      };

      await feedbackAPI.createFeedback(feedbackData);

      Alert.alert(
        'Success',
        'Your rating has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      let errorMessage = 'Failed to submit rating. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select Rating';
    }
  };

  const roomInfo = reservation.room_id;
  const userInfo = reservation.user_id_populated;
  const resortInfo = roomInfo?.resort_id;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold font-inter text-gray-900">Rate Customer</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Customer Info Card */}
        <View className="px-6 pt-6">
          <Card style={{ borderRadius: 16, elevation: 1 }}>
            <Card.Content className="p-6">
              <Text className="text-lg font-bold font-inter text-gray-900 mb-4">Customer Information</Text>
              
              <View className="flex-row items-center mb-4">
                <Avatar.Text 
                  size={56} 
                  label={userInfo?.username?.[0]?.toUpperCase() || 'G'} 
                  style={{ backgroundColor: '#6366F1' }}
                  labelStyle={{ fontSize: 20, fontWeight: 'bold' }}
                />
                <View className="ml-4 flex-1">
                  <Text className="text-xl font-bold font-inter text-gray-900">
                    {userInfo?.username || 'Guest'}
                  </Text>
                  <Text className="text-sm text-gray-600 font-inter mt-1">
                    {userInfo?.email || 'No email provided'}
                  </Text>
                </View>
              </View>
              
              <Divider className="my-4" />
              
              {/* Booking Summary */}
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <MapPin size={16} color="#6B7280" />
                  <Text className="ml-2 text-sm text-gray-600 font-inter">
                    {resortInfo?.resort_name || 'Resort'} • {roomInfo?.room_type || 'Room'}
                  </Text>
                </View>
                
                <View className="flex-row items-center">
                  <Calendar size={16} color="#6B7280" />
                  <Text className="ml-2 text-sm text-gray-600 font-inter">
                    {formatDate(reservation.start_date)} - {formatDate(reservation.end_date)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Rating Section */}
        <View className="px-6 pt-6">
          <Card style={{ borderRadius: 16, elevation: 1 }}>
            <Card.Content className="p-6">
              <Text className="text-lg font-bold font-inter text-gray-900 mb-2">Rate Your Guest</Text>
              <Text className="text-sm text-gray-600 font-inter mb-6">
                How was your experience with this guest?
              </Text>

              {/* Star Rating */}
              <View className="items-center mb-6">
                <View className="flex-row justify-center mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => handleRatingPress(star)}
                      className="mx-1"
                      activeOpacity={0.7}
                    >
                      <Star
                        size={40}
                        color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                        fill={star <= rating ? '#F59E0B' : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text className="text-lg font-semibold font-inter text-gray-900">
                  {getRatingText(rating)}
                </Text>
                
                {rating > 0 && (
                  <Chip
                    mode="flat"
                    style={{ 
                      backgroundColor: '#F59E0B20',
                      borderColor: '#F59E0B',
                      borderWidth: 1,
                      marginTop: 8
                    }}
                    textStyle={{ 
                      color: '#F59E0B',
                      fontFamily: 'Inter',
                      fontWeight: '600'
                    }}
                  >
                    {rating} Star{rating !== 1 ? 's' : ''}
                  </Chip>
                )}
              </View>

              <Divider className="mb-6" />

              {/* Comment Section */}
              <View>
                <Text className="text-base font-semibold font-inter text-gray-900 mb-3">
                  Comments (Optional)
                </Text>
                <Text className="text-sm text-gray-600 font-inter mb-3">
                  Share your feedback about the guest's behavior, cleanliness, and overall experience.
                </Text>
                
                <View className="bg-gray-50 rounded-2xl p-4">
                  <TextInput
                    className="text-base font-inter text-gray-900"
                    placeholder="Share your experience with this guest..."
                    placeholderTextColor="#9CA3AF"
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    maxLength={500}
                    style={{ 
                      minHeight: 100,
                      fontFamily: 'Inter'
                    }}
                  />
                  
                  <View className="flex-row justify-between items-center mt-3">
                    <Text className="text-xs text-gray-500 font-inter">
                      This will help other hosts make informed decisions
                    </Text>
                    <Text className="text-xs text-gray-500 font-inter">
                      {comment.length}/500
                    </Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Submit Button */}
        <View className="px-6 pt-6 pb-8">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
            className={`py-4 rounded-2xl ${
              submitting || rating === 0 ? 'bg-gray-300' : 'bg-blue-600'
            } shadow-lg`}
            style={{ elevation: 3 }}
          >
            <View className="flex-row items-center justify-center">
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Send color="white" size={20} />
              )}
              <Text className="text-white font-bold font-inter ml-2 text-base">
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </Text>
            </View>
          </TouchableOpacity>
          
          {rating === 0 && (
            <Text className="text-center text-gray-500 text-sm font-inter mt-3">
              Please select a rating to continue
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}