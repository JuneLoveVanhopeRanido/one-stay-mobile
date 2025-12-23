import {
  Reservation,
  feedbackAPI,
  reservationAPI,
} from "@/services/reservationService";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  MapPin,
  Star,
  XCircle
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Card, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BookingDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [processing, setProcessing] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedbackEligibility, setFeedbackEligibility] = useState<any>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");

  // Parse the reservation data from params
  const reservation: Reservation = JSON.parse(params.reservation as string);

  useEffect(() => {
    checkFeedbackEligibility();
  }, []);

  const checkFeedbackEligibility = async () => {
    try {
      setLoadingFeedback(true);
      const eligibility = await feedbackAPI.getFeedbackEligibility(
        reservation._id
      );
      setFeedbackEligibility(eligibility);
    } catch (error) {
      console.error("Error checking feedback eligibility:", error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleStatusUpdate = async (newStatus: "approved" | "rejected") => {
    try {
      setProcessing(true);
      setLoadingAction(newStatus);

      await reservationAPI.updateReservationStatus(reservation._id, newStatus);

      Alert.alert(
        "Success",
        `Reservation has been ${newStatus} successfully!`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error("Error updating reservation:", error);
      Alert.alert(
        "Error",
        `Failed to ${newStatus} reservation. Please try again.`
      );
    } finally {
      setProcessing(false);
      setLoadingAction(null);
    }
  };

  const handleApprove = () => {
    Alert.alert(
      "Approve Reservation",
      `Are you sure you want to approve this reservation for ${reservation.user_id_populated?.username || "the guest"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => handleStatusUpdate("approved"),
          style: "default",
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      "Reject Reservation",
      `Are you sure you want to reject this reservation for ${reservation.user_id_populated?.username || "the guest"}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          onPress: () => handleStatusUpdate("rejected"),
          style: "destructive",
        },
      ]
    );
  };

  const handleComplete = async () => {
    Alert.alert(
      "Complete Reservation",
      `Mark this reservation as completed? This will allow both parties to rate each other.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            try {
              setProcessing(true);
              setLoadingAction("complete");
              await reservationAPI.completeReservation(reservation._id);
              Alert.alert(
                "Success",
                "Reservation marked as completed successfully!",
                [
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error: any) {
              console.error("Error completing reservation:", error);
              Alert.alert(
                "Error",
                "Failed to complete reservation. Please try again."
              );
            } finally {
              setProcessing(false);
              setLoadingAction(null);
            }
          },
          style: "default",
        },
      ]
    );
  };

  const handleCancelReservation = () => {
    setShowCancelModal(true);
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert("Error", "Please provide a reason for cancellation");
      return;
    }

    try {
      await reservationAPI.cancelReservation(reservation._id!,cancelReason);
      Alert.alert("Success", "Reservation cancelled successfully");
      setShowCancelModal(false);
      router.back();
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      Alert.alert("Error", "Failed to cancel reservation");
    }
  };

  const handleRateCustomer = () => {
    router.push({
      pathname: "./CustomerRatingScreen",
      params: { reservation: JSON.stringify(reservation) },
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "rejected":
        return "#EF4444";
      case "cancelled":
        return "#6B7280";
      case "completed":
        return "#8B5CF6";
      default:
        return "#6B7280";
    }
  };

  const roomInfo = reservation.room_id;
  const userInfo = reservation.user_id_populated;
  const resortInfo = roomInfo?.resort_id;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text
              className="text-xl text-gray-900"
              style={{ fontFamily: "Roboto-Bold" }}
            >
              Booking Details
            </Text>
            <View
              className="px-3 py-1 rounded-full mt-1"
              style={{
                backgroundColor: getStatusColor(reservation.status) + "20",
              }}
            >
              <Text
                className="text-xs capitalize"
                style={{
                  fontFamily: "Roboto-Medium",
                  color: getStatusColor(reservation.status),
                }}
              >
                {reservation.status}
              </Text>
            </View>
          </View>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-gray-50"
      >
        {/* Guest Information */}
        <View className="px-4 pt-6 pb-4">
          <Card
            className="shadow-none border"
            style={{
              borderRadius: 16,
              borderColor: "#E5E7EB",
              borderWidth: 1,
            }}
          >
            <Card.Content className="p-5 bg-white rounded-2xl">
              <Text
                className="text-lg text-gray-900 mb-4"
                style={{ fontFamily: "Roboto-Bold" }}
              >
                Guest Information
              </Text>
              <View className="flex-row items-center mb-4">
                <View className="flex-1">
                  <Text
                    className="text-base text-gray-900"
                    style={{ fontFamily: "Roboto-Bold" }}
                  >
                    {userInfo?.username || "Guest"}
                  </Text>
                  <Text
                    className="text-sm text-gray-600 mt-1"
                    style={{ fontFamily: "Roboto" }}
                  >
                    {userInfo?.email || "No email provided"}
                  </Text>
                </View>
              </View>

              <Divider className="my-4" />

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Calendar size={16} color="#6B7280" />
                  <Text
                    className="ml-2 text-sm text-gray-600"
                    style={{ fontFamily: "Roboto-Medium" }}
                  >
                    Booked on
                  </Text>
                </View>
                <Text
                  className="text-sm text-gray-900"
                  style={{ fontFamily: "Roboto-Medium" }}
                >
                  {formatTime(reservation.createdAt)}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Booking Details */}
        <View className="px-4 pb-4">
          <Card
            className="shadow-none border"
            style={{
              borderRadius: 16,
              borderColor: "#E5E7EB",
              borderWidth: 1,
            }}
          >
            <Card.Content className="p-5 bg-white rounded-2xl">
              <Text
                className="text-lg text-gray-900 mb-4"
                style={{ fontFamily: "Roboto-Bold" }}
              >
                Booking Details
              </Text>

              {/* Resort & Room */}
              <View className="mb-4">
                <View className="flex-row items-center mb-2">
                  <MapPin size={16} color="#6B7280" />
                  <Text
                    className="ml-2 text-sm text-gray-600"
                    style={{ fontFamily: "Roboto-Medium" }}
                  >
                    Resort
                  </Text>
                </View>
                <Text
                  className="text-base text-gray-900 ml-6"
                  style={{ fontFamily: "Roboto-Medium" }}
                >
                  {resortInfo?.resort_name || "Resort Name"}
                </Text>
                <Text
                  className="text-sm text-gray-600 ml-6 mt-1"
                  style={{ fontFamily: "Roboto" }}
                >
                  {roomInfo?.room_type || "Room Type"}
                </Text>
              </View>

              <Divider className="my-4" />

              {/* Check-in & Check-out in horizontal layout */}
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text
                    className="text-sm text-gray-600 mb-1"
                    style={{ fontFamily: "Roboto-Medium" }}
                  >
                    Check-in
                  </Text>
                  <Text
                    className="text-sm text-gray-900"
                    style={{ fontFamily: "Roboto-Medium" }}
                  >
                    {formatTime(reservation.start_date)}
                  </Text>
                </View>
                <View className="items-center">
                  <Text
                    className="text-sm text-gray-600 mb-1"
                    style={{ fontFamily: "Roboto-Medium" }}
                  >
                    Duration
                  </Text>
                  <Text
                    className="text-sm text-gray-900"
                    style={{ fontFamily: "Roboto-Bold" }}
                  >
                    {Math.ceil(
                      (new Date(reservation.end_date).getTime() -
                        new Date(reservation.start_date).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className="text-sm text-gray-600 mb-1"
                    style={{ fontFamily: "Roboto-Medium" }}
                  >
                    Check-out
                  </Text>
                  <Text
                    className="text-sm text-gray-900"
                    style={{ fontFamily: "Roboto-Medium" }}
                  >
                    {formatTime(reservation.end_date)}
                  </Text>
                </View>
              </View>

              <Divider className="my-4" />

              {/* Total Amount */}
              <View className="flex-row items-center justify-between">
                <Text
                  className="text-sm text-gray-600"
                  style={{ fontFamily: "Roboto-Medium" }}
                >
                  Total Amount
                </Text>
                <Text
                  className="text-xl text-gray-900"
                  style={{ fontFamily: "Roboto-Bold" }}
                >
                  ₱{reservation.total_price}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Action Buttons - Dynamic based on status */}
        <View className="px-4 pt-6 pb-8">
          {reservation.status === "pending" && (
            <View className="space-y-4">
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleReject}
                  disabled={processing}
                  className={`flex-1 py-4 mb-2 rounded-xl ${
                    loadingAction === "rejected" ? "bg-gray-300" : "bg-red-500"
                  }`}
                >
                  <View className="flex-row items-center justify-center">
                    {loadingAction === "rejected" ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <XCircle color="white" size={18} />
                    )}
                    <Text
                      className="text-white text-sm ml-2"
                      style={{ fontFamily: "Roboto-Medium" }}
                    >
                      Reject
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleApprove}
                  disabled={processing}
                  className={`flex-1 py-4 mb-2 rounded-xl ${
                    loadingAction === "approved"
                      ? "bg-gray-300"
                      : "bg-green-500"
                  }`}
                >
                  <View className="flex-row items-center justify-center">
                    {loadingAction === "approved" ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <CheckCircle color="white" size={18} />
                    )}
                    <Text
                      className="text-white text-sm ml-2"
                      style={{ fontFamily: "Roboto-Medium" }}
                    >
                      Approve
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleCancelReservation}
                disabled={processing}
                className={`py-4 rounded-xl ${
                  loadingAction === "cancel" ? "bg-gray-300" : "bg-gray-600"
                }`}
              >
                <View className="flex-row items-center justify-center">
                  {loadingAction === "cancel" ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <XCircle color="white" size={18} />
                  )}
                  <Text
                    className="text-white text-sm ml-2"
                    style={{ fontFamily: "Roboto-Medium" }}
                  >
                    Cancel Booking
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {reservation.status === "approved" && (
            <View className="space-y-4">
              <TouchableOpacity
                onPress={handleComplete}
                disabled={processing}
                className={`py-4 rounded-xl mb-2 ${
                  loadingAction === "complete" ? "bg-gray-300" : "bg-purple-600"
                }`}
              >
                <View className="flex-row items-center justify-center">
                  {loadingAction === "complete" ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <CheckCircle color="white" size={18} />
                  )}
                  <Text
                    className="text-white text-sm ml-2"
                    style={{ fontFamily: "Roboto-Medium" }}
                  >
                    Mark as Completed
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancelReservation}
                disabled={processing}
                className={`py-4 rounded-xl ${
                  loadingAction === "cancel" ? "bg-gray-300" : "bg-gray-600"
                }`}
              >
                <View className="flex-row items-center justify-center">
                  {loadingAction === "cancel" ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <XCircle color="white" size={18} />
                  )}
                  <Text
                    className="text-white text-sm ml-2"
                    style={{ fontFamily: "Roboto-Medium" }}
                  >
                    Cancel Booking
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {reservation.status === "completed" && (
            <View className="space-y-4">
              {!loadingFeedback &&
                feedbackEligibility &&
                !feedbackEligibility.alreadySubmitted && (
                  <TouchableOpacity
                    onPress={handleRateCustomer}
                    className="py-4 rounded-xl bg-blue-600"
                  >
                    <View className="flex-row items-center justify-center">
                      <Star color="white" size={18} />
                      <Text
                        className="text-white text-sm ml-2"
                        style={{ fontFamily: "Roboto-Medium" }}
                      >
                        Rate Customer
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

              {!loadingFeedback &&
                feedbackEligibility &&
                feedbackEligibility.alreadySubmitted && (
                  <View className="py-4 px-6 rounded-xl bg-green-100 border border-green-300">
                    <Text
                      className="text-green-800 text-center text-sm"
                      style={{ fontFamily: "Roboto-Medium" }}
                    >
                      ✓ You have already rated this customer
                    </Text>
                  </View>
                )}

              {feedbackEligibility?.mutualFeedback?.bothCompleted && (
                <View className="py-4 px-6 rounded-xl bg-purple-100 border border-purple-300">
                  <Text
                    className="text-purple-800 text-center text-sm"
                    style={{ fontFamily: "Roboto-Medium" }}
                  >
                    🤝 Mutual feedback completed! Both parties have rated each
                    other.
                  </Text>
                </View>
              )}
            </View>
          )}

          {(reservation.status === "rejected" ||
            reservation.status === "cancelled") && (
            <View className="py-4 px-6 rounded-xl bg-white border border-gray-300">
              <Text
                className="text-gray-600 text-center text-sm"
                style={{ fontFamily: "Roboto-Medium" }}
              >
                This reservation has been {reservation.status}.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
        <Modal
          visible={showCancelModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCancelModal(false)}
        >
  <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              padding: 20,
              borderRadius: 12,
              width: '100%',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
              Cancel Reservation
            </Text>
            <Text style={{ marginBottom: 10 }}>
              Please enter the reason for cancellation:
            </Text>
            <TextInput
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Reason..." 
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                padding: 10,
                marginBottom: 20,
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 15,
                  backgroundColor: '#ccc',
                  borderRadius: 8,
                }}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitCancel}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 15,
                  backgroundColor: '#FF4D4F',
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
</Modal>
    </SafeAreaView>
  );
}
