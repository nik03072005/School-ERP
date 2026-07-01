import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import API from '@/src/api/api';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

const LEAVE_TYPES = [
  { value: 'sick',      label: 'Sick Leave',  icon: 'medkit-outline' },
  { value: 'casual',    label: 'Casual',       icon: 'sunny-outline' },
  { value: 'emergency', label: 'Emergency',    icon: 'warning-outline' },
  { value: 'other',     label: 'Other',        icon: 'ellipsis-horizontal-circle-outline' },
] as const;

const STATUS_META: Record<string, { bg: string; text: string; icon: string }> = {
  pending:   { bg: '#FEF3C7', text: '#B45309', icon: 'time-outline' },
  approved:  { bg: '#DCFCE7', text: '#15803D', icon: 'checkmark-circle-outline' },
  rejected:  { bg: '#FEE2E2', text: '#DC2626', icon: 'close-circle-outline' },
  cancelled: { bg: Colors.border, text: Colors.textSecondary, icon: 'ban-outline' },
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

interface Leave {
  _id: string; leave_type: string; status: string;
  start_date: string; end_date: string; total_days: number;
  reason: string; review_remarks?: string;
}

export default function LeaveScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'apply' | 'history'>('apply');
  const [leaveType, setLeaveType] = useState<'sick' | 'casual' | 'emergency' | 'other'>('sick');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myLeaves, setMyLeaves] = useState<Leave[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await API.get('/leaves/mine');
      setMyLeaves(data.leaves || []);
    } catch {
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) { Alert.alert('Required', 'Please provide a reason for the leave.'); return; }
    if (endDate < startDate) { Alert.alert('Invalid Dates', 'End date must be on or after start date.'); return; }
    setSubmitting(true);
    try {
      await API.post('/leaves', { leave_type: leaveType, start_date: startDate, end_date: endDate, reason: reason.trim() });
      Alert.alert('Submitted', 'Your leave application has been submitted successfully.');
      setReason(''); setStartDate(todayISO()); setEndDate(todayISO()); setLeaveType('sick');
      setTab('history');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to submit leave application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Leave', 'Are you sure you want to cancel this application?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await API.patch(`/leaves/${id}/cancel`);
            setMyLeaves(prev => prev.map(l => l._id === id ? { ...l, status: 'cancelled' } : l));
          } catch {
            Alert.alert('Error', 'Failed to cancel leave.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Leave Application</Text>
          <Text style={styles.headerSub}>Apply for and track your leaves</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {([['apply', 'create-outline', 'Apply'], ['history', 'time-outline', 'My Leaves']] as const).map(([t, icon, label]) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t as any)}>
            <Ionicons name={icon} size={14} color={tab === t ? Brand.blueDark : Colors.textSecondary} />
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'apply' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.form}>
            {/* Leave type */}
            <Text style={styles.sectionTitle}>Leave Type</Text>
            <View style={styles.typeGrid}>
              {LEAVE_TYPES.map(t => {
                const active = leaveType === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setLeaveType(t.value)}
                    style={[styles.typeCard, active && styles.typeCardActive]}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.typeIconWrap, active && { backgroundColor: Brand.blueDark }]}>
                      <Ionicons name={t.icon} size={20} color={active ? Colors.card : Brand.blueDark} />
                    </View>
                    <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Date range */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Duration</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.fieldLabel}>From</Text>
                <TextInput
                  style={styles.dateInput}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.placeholder}
                  keyboardType="numeric"
                />
              </View>
              <Ionicons name="arrow-forward" size={18} color={Colors.textSecondary} style={{ marginTop: 24 }} />
              <View style={styles.dateField}>
                <Text style={styles.fieldLabel}>To</Text>
                <TextInput
                  style={styles.dateInput}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.placeholder}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Reason */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Reason *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Briefly describe why you need this leave…"
              placeholderTextColor={Colors.placeholder}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color={Colors.card} />
                : <><Ionicons name="send-outline" size={17} color={Colors.card} /><Text style={styles.submitBtnText}>Submit Application</Text></>
              }
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : historyLoading ? (
        <View style={styles.center}><ActivityIndicator color={Brand.blueDark} /></View>
      ) : myLeaves.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.iconCircle}>
            <Ionicons name="calendar-outline" size={36} color={Brand.blueDark} />
          </View>
          <Text style={styles.emptyTitle}>No Applications</Text>
          <Text style={styles.emptyText}>You haven't applied for any leave yet.</Text>
          <TouchableOpacity style={styles.applyLink} onPress={() => setTab('apply')}>
            <Text style={styles.applyLinkText}>Apply for Leave</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
          {myLeaves.map(leave => {
            const meta = STATUS_META[leave.status] || STATUS_META.pending;
            const typeInfo = LEAVE_TYPES.find(t => t.value === leave.leave_type);
            return (
              <View key={leave._id} style={styles.leaveCard}>
                <View style={styles.leaveCardTop}>
                  <View style={styles.leaveLeft}>
                    <View style={[styles.leaveTypeIcon, { backgroundColor: Brand.blueLight }]}>
                      <Ionicons name={typeInfo?.icon ?? 'calendar-outline'} size={18} color={Brand.blueDark} />
                    </View>
                    <View>
                      <Text style={styles.leaveTypeName} numberOfLines={1}>
                        {typeInfo?.label ?? leave.leave_type} Leave
                      </Text>
                      <Text style={styles.leaveDays}>
                        {leave.total_days} day{leave.total_days !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon as any} size={11} color={meta.text} />
                    <Text style={[styles.statusText, { color: meta.text }]}>
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.leaveDateRow}>
                  <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.leaveDateText}>
                    {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
                  </Text>
                </View>

                <Text style={styles.leaveReason} numberOfLines={2}>{leave.reason}</Text>

                {leave.review_remarks ? (
                  <View style={styles.remarkBox}>
                    <Ionicons name="chatbubble-outline" size={13} color={Brand.blueDark} />
                    <Text style={styles.remarkText}>{leave.review_remarks}</Text>
                  </View>
                ) : null}

                {leave.status === 'pending' && (
                  <TouchableOpacity onPress={() => handleCancel(leave._id)} style={styles.cancelBtn}>
                    <Ionicons name="close-circle-outline" size={14} color={Colors.error} />
                    <Text style={styles.cancelBtnText}>Cancel Application</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Brand.blueDark, paddingHorizontal: 20, paddingVertical: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.card },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Brand.blueDark },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Brand.blueDark, fontWeight: '700' },
  form: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  typeGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  typeCard: {
    width: '47%', backgroundColor: Colors.card,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border,
    padding: 16, alignItems: 'center', gap: 8, ...Shadow.subtle,
  },
  typeCardActive: { borderColor: Brand.blueDark, backgroundColor: Brand.blueLight },
  typeIconWrap: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Brand.blueLight, justifyContent: 'center', alignItems: 'center',
  },
  typeLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  typeLabelActive: { color: Brand.blueDark },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  dateField: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  dateInput: {
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 14, height: 46,
    fontSize: 14, color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: Colors.textPrimary,
  },
  textarea: { minHeight: 110 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Brand.blueDark, borderRadius: Radius.md,
    height: 52, marginTop: 24, ...Shadow.card,
  },
  submitBtnText: { color: Colors.card, fontSize: 16, fontWeight: '700' },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Brand.blueLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, ...Shadow.card,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  applyLink: {
    backgroundColor: Brand.blueDark, borderRadius: Radius.full,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  applyLinkText: { color: Colors.card, fontSize: 14, fontWeight: '700' },
  leaveCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10, ...Shadow.subtle,
  },
  leaveCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leaveLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  leaveTypeIcon: {
    width: 40, height: 40, borderRadius: Radius.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  leaveTypeName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  leaveDays: { fontSize: 12, color: Colors.textSecondary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  leaveDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leaveDateText: { fontSize: 12, color: Colors.textSecondary },
  leaveReason: { fontSize: 13, color: Colors.textPrimary, lineHeight: 19 },
  remarkBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: Brand.blueLight, borderRadius: Radius.md, padding: 10,
  },
  remarkText: { fontSize: 12, color: Colors.textPrimary, flex: 1, lineHeight: 18 },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.error + '50',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  cancelBtnText: { fontSize: 12, color: Colors.error, fontWeight: '600' },
});
