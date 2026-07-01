import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import API from '@/src/api/api';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day';

const STATUS_META: Record<string, { label: string; short: string; bg: string; text: string }> = {
  present:  { label: 'Present',  short: 'P', bg: '#DCFCE7', text: '#15803D' },
  absent:   { label: 'Absent',   short: 'A', bg: '#FEE2E2', text: '#DC2626' },
  late:     { label: 'Late',     short: 'L', bg: '#FEF3C7', text: '#B45309' },
  half_day: { label: 'Half Day', short: 'H', bg: '#FFEDD5', text: '#EA580C' },
};

const MARK_COLS: AttendanceStatus[] = ['present', 'absent', 'late', 'half_day'];
const CHECKPOINTS = [
  { value: 'start', label: 'Morning' },
  { value: 'end',   label: 'Afternoon' },
];
const STAFF_ROLE_LABELS: Record<string, string> = {
  teaching_staff:     'Teacher',
  non_teaching_staff: 'Staff',
};

const todayISO = () => new Date().toISOString().slice(0, 10);

interface StaffRow {
  user_id: string;
  name: string;
  role: string;
  employee_code?: string;
  status: AttendanceStatus;
  remarks: string;
}

export default function StaffAttendanceScreen() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/(app)');
  }, [user]);

  const [tab, setTab] = useState<'mark' | 'records'>('mark');
  const [date, setDate] = useState(todayISO());
  const [checkpoint, setCheckpoint] = useState('start');
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const loadStaffWithAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const [teachRes, ntRes, attRes] = await Promise.allSettled([
        API.get('/admin/users', { params: { role: 'teaching_staff', limit: 100 } }),
        API.get('/admin/users', { params: { role: 'non_teaching_staff', limit: 100 } }),
        API.get('/attendance/staff/daily', { params: { attendance_date: date, checkpoint } }),
      ]);

      const teachUsers = teachRes.status === 'fulfilled' ? (teachRes.value.data.users || []) : [];
      const ntUsers   = ntRes.status   === 'fulfilled' ? (ntRes.value.data.users   || []) : [];
      const allStaff  = [...teachUsers, ...ntUsers];

      const attRecords: any[] = attRes.status === 'fulfilled' ? (attRes.value.data.records || []) : [];
      const attMap = new Map(attRecords.map((r: any) => [String(r.user_id?._id || r.user_id), r]));

      const built: StaffRow[] = allStaff
        .filter((u: any) => u.is_active)
        .map((u: any) => {
          const att = attMap.get(String(u._id));
          return {
            user_id: u._id,
            name: `${u.first_name} ${u.last_name}`,
            role: u.role_id?.name || '',
            employee_code: u.staff_profile?.employee_code || '',
            status: (att?.status as AttendanceStatus) || 'present',
            remarks: att?.remarks || '',
          };
        });

      setRows(built);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [date, checkpoint]);

  useEffect(() => { loadStaffWithAttendance(); }, [date, checkpoint]);

  const updateStatus = (userId: string, status: AttendanceStatus) => {
    setRows(prev => prev.map(r => r.user_id === userId ? { ...r, status } : r));
  };

  const saveAttendance = async () => {
    if (rows.length === 0) return;
    setSaving(true);
    try {
      await API.post('/attendance/staff/mark-bulk', {
        attendance_date: date,
        checkpoint,
        records: rows.map(r => ({ user_id: r.user_id, status: r.status, remarks: r.remarks })),
      });
      setNotice('Staff attendance saved!');
      setTimeout(() => setNotice(''), 3000);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const summary = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const prevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().slice(0, 10));
  };
  const nextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().slice(0, 10);
    if (next <= todayISO()) setDate(next);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Staff Attendance</Text>
          <Text style={styles.headerSub}>Mark & review staff attendance</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['mark', 'records'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'mark' ? 'Mark Attendance' : 'Summary'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!!notice && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.successText}>{notice}</Text>
          </View>
        )}

        {/* Filters */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Filters</Text>

          <Text style={styles.filterLabel}>Date</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity onPress={prevDay} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={18} color={Brand.blueDark} />
            </TouchableOpacity>
            <Text style={styles.dateText}>
              {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={nextDay} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={18} color={Brand.blueDark} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.filterLabel, { marginTop: 12 }]}>Checkpoint</Text>
          <View style={styles.pillRow}>
            {CHECKPOINTS.map(c => (
              <TouchableOpacity
                key={c.value}
                style={[styles.pill, checkpoint === c.value && styles.pillActive]}
                onPress={() => setCheckpoint(c.value)}
              >
                <Text style={[styles.pillText, checkpoint === c.value && styles.pillTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary row (records tab) */}
        {tab === 'records' && Object.keys(summary).length > 0 && (
          <View style={styles.summaryRow}>
            {Object.entries(summary).map(([status, count]) => {
              const meta = STATUS_META[status] || STATUS_META.present;
              return (
                <View key={status} style={[styles.summaryCard, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.summaryCount, { color: meta.text }]}>{count}</Text>
                  <Text style={[styles.summaryLabel, { color: meta.text }]}>{meta.label}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Staff register */}
        {loading ? (
          <View style={styles.centerPad}><ActivityIndicator color={Brand.blueDark} /></View>
        ) : rows.length === 0 ? (
          <View style={styles.centerPad}>
            <Ionicons name="people-outline" size={36} color={Colors.placeholder} />
            <Text style={styles.emptyText}>No staff members found.</Text>
          </View>
        ) : tab === 'mark' ? (
          <MarkTable rows={rows} updateStatus={updateStatus} onSave={saveAttendance} saving={saving} />
        ) : (
          <RecordTable rows={rows} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Mark Table ────────────────────────────────────────────────────────────────
function MarkTable({
  rows,
  updateStatus,
  onSave,
  saving,
}: {
  rows: StaffRow[];
  updateStatus: (id: string, status: AttendanceStatus) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <View style={reg.wrapper}>
      <View style={reg.tableHead}>
        <Text style={[reg.colName, reg.headText]}>Staff Name</Text>
        {MARK_COLS.map(s => (
          <View key={s} style={reg.colStatus}>
            <Text style={[reg.headText, { color: STATUS_META[s].text }]}>{STATUS_META[s].short}</Text>
          </View>
        ))}
      </View>

      <View style={reg.legend}>
        {MARK_COLS.map(s => (
          <View key={s} style={reg.legendItem}>
            <View style={[reg.legendDot, { backgroundColor: STATUS_META[s].text }]} />
            <Text style={[reg.legendText, { color: STATUS_META[s].text }]}>{STATUS_META[s].label}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, i) => (
        <View key={row.user_id} style={[reg.tableRow, i % 2 === 1 && reg.rowAlt, i < rows.length - 1 && reg.rowBorder]}>
          <View style={reg.colName}>
            <Text style={reg.nameText} numberOfLines={1}>{row.name}</Text>
            <Text style={reg.roleText}>{STAFF_ROLE_LABELS[row.role] || row.role}</Text>
          </View>
          {MARK_COLS.map(s => {
            const active = row.status === s;
            const meta = STATUS_META[s];
            return (
              <TouchableOpacity
                key={s}
                style={reg.colStatus}
                onPress={() => updateStatus(row.user_id, s)}
                activeOpacity={0.7}
              >
                <View style={[reg.statusDot, active && { backgroundColor: meta.text, borderColor: meta.text }]}>
                  {active && <Ionicons name="checkmark" size={11} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <View style={reg.footer}>
        <Text style={reg.footerCount}>{rows.length} staff members</Text>
        <TouchableOpacity
          style={[reg.saveBtn, saving && { opacity: 0.6 }]}
          onPress={onSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={Colors.card} />
            : <><Ionicons name="save-outline" size={14} color={Colors.card} /><Text style={reg.saveBtnText}>Save Attendance</Text></>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Record Table ──────────────────────────────────────────────────────────────
function RecordTable({ rows }: { rows: StaffRow[] }) {
  return (
    <View style={reg.wrapper}>
      <View style={reg.tableHead}>
        <Text style={[reg.colName, reg.headText]}>Staff Name</Text>
        <Text style={[reg.headText, { textAlign: 'right', flex: 0, minWidth: 90 }]}>Status</Text>
      </View>
      {rows.map((row, i) => {
        const meta = STATUS_META[row.status] || STATUS_META.present;
        return (
          <View key={row.user_id} style={[reg.tableRow, i % 2 === 1 && reg.rowAlt, i < rows.length - 1 && reg.rowBorder]}>
            <View style={reg.colName}>
              <Text style={reg.nameText} numberOfLines={1}>{row.name}</Text>
              <Text style={reg.roleText}>{STAFF_ROLE_LABELS[row.role] || row.role}</Text>
            </View>
            <View style={[reg.badge, { backgroundColor: meta.bg }]}>
              <Text style={[reg.badgeText, { color: meta.text }]}>{meta.label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const reg = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadow.subtle,
  },
  tableHead: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Brand.blueDark, paddingHorizontal: 12, paddingVertical: 10,
  },
  headText: { fontSize: 12, fontWeight: '700', color: Colors.card, textAlign: 'center' },
  legend: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '600' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, minHeight: 52,
  },
  rowAlt: { backgroundColor: '#F8FAFC' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  colName: { flex: 1, marginRight: 8 },
  nameText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  roleText: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  colStatus: { width: 40, alignItems: 'center', justifyContent: 'center' },
  statusDot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  badge: {
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, minWidth: 82, alignItems: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: '#F8FAFC',
  },
  footerCount: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Brand.blueDark, borderRadius: Radius.full,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  saveBtnText: { color: Colors.card, fontSize: 13, fontWeight: '700' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
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
  tab: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Brand.blueDark },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Brand.blueDark, fontWeight: '700' },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 16, ...Shadow.subtle,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  filterLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 4, height: 44,
  },
  navBtn: { padding: 10 },
  dateText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.background,
  },
  pillActive: { backgroundColor: Brand.blueLight, borderColor: Brand.blueDark },
  pillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  pillTextActive: { color: Brand.blueDark, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryCard: { borderRadius: Radius.md, padding: 10, minWidth: 80, alignItems: 'center', gap: 2 },
  summaryCount: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.successBg, borderRadius: Radius.md,
    padding: 12, borderWidth: 1, borderColor: '#BBF7D0',
  },
  successText: { fontSize: 13, color: Colors.success, fontWeight: '600' },
  centerPad: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
