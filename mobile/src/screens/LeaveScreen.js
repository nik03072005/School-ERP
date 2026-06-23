import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../api/api";

const LEAVE_TYPES = [
  { value: "sick", label: "Sick Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "emergency", label: "Emergency" },
  { value: "other", label: "Other" },
];

const STATUS_COLORS = {
  pending: { bg: "#fef3c7", text: "#b45309" },
  approved: { bg: "#dcfce7", text: "#15803d" },
  rejected: { bg: "#fee2e2", text: "#dc2626" },
  cancelled: { bg: "#f1f5f9", text: "#64748b" },
};

const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function LeaveScreen() {
  const [tab, setTab] = useState("apply"); // "apply" | "history"
  const [leaveType, setLeaveType] = useState("sick");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [myLeaves, setMyLeaves] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await API.get("/leaves/mine");
      setMyLeaves(data.leaves || []);
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert("Required", "Please provide a reason for the leave.");
      return;
    }
    if (endDate < startDate) {
      Alert.alert("Invalid dates", "End date must be on or after start date.");
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/leaves", { leave_type: leaveType, start_date: startDate, end_date: endDate, reason });
      Alert.alert("Submitted", "Your leave application has been submitted.");
      setReason("");
      setStartDate(today());
      setEndDate(today());
      setLeaveType("sick");
      setTab("history");
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to submit leave.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = (id) => {
    Alert.alert("Cancel Leave", "Are you sure you want to cancel this leave application?", [
      { text: "No" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await API.patch(`/leaves/${id}/cancel`);
            setMyLeaves((prev) => prev.map((l) => (l._id === id ? { ...l, status: "cancelled" } : l)));
          } catch {
            Alert.alert("Error", "Failed to cancel leave.");
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Leave Application</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === "apply" && styles.tabActive]}
            onPress={() => setTab("apply")}
          >
            <Text style={[styles.tabText, tab === "apply" && styles.tabTextActive]}>Apply</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "history" && styles.tabActive]}
            onPress={() => setTab("history")}
          >
            <Text style={[styles.tabText, tab === "history" && styles.tabTextActive]}>My Applications</Text>
          </TouchableOpacity>
        </View>

        {tab === "apply" ? (
          <ScrollView contentContainerStyle={styles.form}>
            <Text style={styles.label}>Leave Type</Text>
            <View style={styles.typeRow}>
              {LEAVE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setLeaveType(t.value)}
                  style={[styles.typePill, leaveType === t.value && styles.typePillActive]}
                >
                  <Text style={[styles.typePillText, leaveType === t.value && styles.typePillTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>From Date</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              style={styles.input}
              keyboardType="numeric"
            />

            <Text style={styles.label}>To Date</Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              style={styles.input}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Reason</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Briefly describe the reason for leave…"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textarea]}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Application</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        ) : historyLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#0891b2" />
        ) : myLeaves.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No leave applications yet.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            {myLeaves.map((leave) => {
              const colors = STATUS_COLORS[leave.status] || STATUS_COLORS.pending;
              return (
                <View key={leave._id} style={styles.leaveCard}>
                  <View style={styles.leaveCardTop}>
                    <Text style={styles.leaveType}>{leave.leave_type} leave</Text>
                    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.statusText, { color: colors.text }]}>{leave.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.leaveDates}>
                    {formatDate(leave.start_date)} → {formatDate(leave.end_date)} · {leave.total_days} day{leave.total_days !== 1 ? "s" : ""}
                  </Text>
                  <Text style={styles.leaveReason} numberOfLines={2}>{leave.reason}</Text>
                  {leave.review_remarks ? (
                    <Text style={styles.remark}>Remark: {leave.review_remarks}</Text>
                  ) : null}
                  {leave.status === "pending" && (
                    <TouchableOpacity onPress={() => handleCancel(leave._id)} style={styles.cancelBtn}>
                      <Text style={styles.cancelBtnText}>Cancel Application</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  tabs: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#0891b2" },
  tabText: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  tabTextActive: { color: "#0891b2", fontWeight: "700" },
  form: { padding: 16, gap: 4 },
  label: { fontSize: 12, fontWeight: "600", color: "#475569", marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
  },
  textarea: { minHeight: 90 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typePill: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  typePillActive: { backgroundColor: "#0891b2", borderColor: "#0891b2" },
  typePillText: { fontSize: 12, color: "#475569", fontWeight: "500" },
  typePillTextActive: { color: "#fff" },
  submitBtn: {
    marginTop: 20,
    backgroundColor: "#0891b2",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 13, color: "#94a3b8" },
  leaveCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 4,
  },
  leaveCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  leaveType: { fontSize: 13, fontWeight: "700", color: "#0f172a", textTransform: "capitalize" },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  leaveDates: { fontSize: 12, color: "#64748b" },
  leaveReason: { fontSize: 12, color: "#475569" },
  remark: { fontSize: 11, color: "#0891b2", fontStyle: "italic" },
  cancelBtn: { marginTop: 8, alignSelf: "flex-start", borderRadius: 10, borderWidth: 1, borderColor: "#fca5a5", paddingHorizontal: 12, paddingVertical: 6 },
  cancelBtnText: { fontSize: 12, color: "#ef4444", fontWeight: "600" },
});
