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

type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave_pending' | 'leave_approved';

const STATUS_META: Record<string, { label: string; short: string; bg: string; text: string; icon: string }> = {
  present:        { label: 'Present',       short: 'P', bg: '#DCFCE7', text: '#15803D', icon: 'checkmark-circle' },
  absent:         { label: 'Absent',        short: 'A', bg: '#FEE2E2', text: '#DC2626', icon: 'close-circle' },
  late:           { label: 'Late',          short: 'L', bg: '#FEF3C7', text: '#B45309', icon: 'time' },
  half_day:       { label: 'Half Day',      short: 'H', bg: '#FFEDD5', text: '#EA580C', icon: 'remove-circle' },
  leave_pending:  { label: 'Leave Pending', short: 'LP', bg: '#DBEAFE', text: '#1D4ED8', icon: 'hourglass' },
  leave_approved: { label: 'Leave Aprvd',  short: 'LA', bg: '#EDE9FE', text: '#6D28D9', icon: 'checkmark-done' },
  not_marked:     { label: 'Not Marked',   short: '–',  bg: Colors.border, text: Colors.textSecondary, icon: 'ellipse-outline' },
};

// Student calendar: dot colour per status
const STATUS_DOT_COLOR: Record<string, string> = {
  present:        '#15803D',
  absent:         '#DC2626',
  late:           '#B45309',
  half_day:       '#EA580C',
  leave_pending:  '#1D4ED8',
  leave_approved: '#6D28D9',
};

interface StudentRecord {
  _id: string; attendance_date: string;
  checkpoint: string; status: string; remarks?: string;
}

// Builds calendar grid rows (Sun–Sat) for a given month
function buildCalendarGrid(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// Columns shown in the register table (mark tab)
const REGISTER_COLS: AttendanceStatus[] = ['present', 'absent', 'late', 'half_day'];

const CHECKPOINTS = [
  { value: 'start', label: 'Morning' },
  { value: 'end',   label: 'Afternoon' },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

interface Section { _id: string; name: string; class_id: { _id: string; name: string } }
interface AttendanceRow { student_id: string; name: string; roll_no?: string; status: string; remarks: string; marked_at?: string }

export default function AttendanceScreen() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teaching_staff' || user?.role === 'admin';
  return isTeacher ? <TeacherAttendance /> : <StudentAttendance />;
}

// ─── Teacher View ──────────────────────────────────────────────────────────────
function TeacherAttendance() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<'mark' | 'records'>('mark');
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [checkpoint, setCheckpoint] = useState('start');
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    API.get('/setup/sections', { params: { is_active: true } })
      .then(({ data }) => {
        const all: Section[] = data.sections || [];
        setSections(all);
        if (all.length > 0) setSectionId(all[0]._id);
      })
      .catch(() => {})
      .finally(() => setSectionsLoading(false));
  }, []);

  const loadAttendance = useCallback(async () => {
    if (!sectionId) return;
    const sec = sections.find(s => s._id === sectionId);
    if (!sec) return;
    setLoading(true);
    try {
      const { data } = await API.get('/attendance/students/daily', {
        params: { class_id: sec.class_id._id, section_id: sectionId, attendance_date: date, checkpoint },
      });
      setRows((data.rows || []).map((r: any) => ({
        ...r,
        status: r.status || 'present',
        remarks: r.remarks || '',
      })));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  }, [sectionId, date, checkpoint, sections]);

  useEffect(() => { if (sectionId) loadAttendance(); }, [sectionId, date, checkpoint]);

  const updateStatus = (studentId: string, status: string) => {
    setRows(prev => prev.map(r => r.student_id === studentId ? { ...r, status } : r));
  };

  const saveAttendance = async () => {
    if (rows.length === 0) return;
    const sec = sections.find(s => s._id === sectionId);
    if (!sec) return;
    setSaving(true);
    try {
      await API.post('/attendance/students/mark-bulk', {
        class_id: sec.class_id._id,
        section_id: sectionId,
        attendance_date: date,
        checkpoint,
        records: rows.map(r => ({ student_id: r.student_id, status: r.status, remarks: r.remarks })),
      });
      setNotice('Attendance saved!');
      setTimeout(() => setNotice(''), 3000);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const sectionLabel = (s: Section) => `${s.class_id?.name ?? ''} – ${s.name}`;

  const summary = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1; return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Attendance</Text>
          <Text style={styles.headerSub}>Mark & review class attendance</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['mark', 'records'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'mark' ? 'Mark Attendance' : 'Records'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {sectionsLoading ? (
        <View style={styles.center}><ActivityIndicator color={Brand.blueDark} /></View>
      ) : sections.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={40} color={Colors.placeholder} />
          <Text style={styles.emptyTitle}>No Sections Assigned</Text>
          <Text style={styles.emptyText}>You are not assigned as class teacher of any section.</Text>
        </View>
      ) : (
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

            <Text style={styles.label}>Section</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={styles.pillRow}>
                {sections.map(s => (
                  <TouchableOpacity
                    key={s._id}
                    style={[styles.pill, sectionId === s._id && styles.pillActive]}
                    onPress={() => setSectionId(s._id)}
                  >
                    <Text style={[styles.pillText, sectionId === s._id && styles.pillTextActive]}>
                      {sectionLabel(s)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>Date</Text>
            <View style={styles.inputRow}>
              <TouchableOpacity
                onPress={() => {
                  const d = new Date(date);
                  d.setDate(d.getDate() - 1);
                  setDate(d.toISOString().slice(0, 10));
                }}
                style={styles.navBtn}
              >
                <Ionicons name="chevron-back" size={18} color={Brand.blueDark} />
              </TouchableOpacity>
              <Text style={styles.dateText}>
                {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const d = new Date(date);
                  d.setDate(d.getDate() + 1);
                  const newDate = d.toISOString().slice(0, 10);
                  if (newDate <= todayISO()) setDate(newDate);
                }}
                style={styles.navBtn}
              >
                <Ionicons name="chevron-forward" size={18} color={Brand.blueDark} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>Checkpoint</Text>
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

          {/* Summary (records tab) */}
          {tab === 'records' && rows.length > 0 && (
            <View style={styles.summaryRow}>
              {Object.entries(summary).map(([status, count]) => {
                const meta = STATUS_META[status] || STATUS_META.not_marked;
                return (
                  <View key={status} style={[styles.summaryCard, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.summaryCount, { color: meta.text }]}>{count}</Text>
                    <Text style={[styles.summaryLabel, { color: meta.text }]}>{meta.label}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Student Register */}
          {loading ? (
            <View style={styles.center}><ActivityIndicator color={Brand.blueDark} /></View>
          ) : rows.length === 0 ? (
            <View style={[styles.center, { paddingVertical: 40 }]}>
              <Text style={styles.emptyText}>No students found for this section.</Text>
            </View>
          ) : tab === 'mark' ? (
            <RegisterTable rows={rows} updateStatus={updateStatus} onSave={saveAttendance} saving={saving} />
          ) : (
            <RecordsTable rows={rows} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Register Table (mark tab) ─────────────────────────────────────────────────
function RegisterTable({
  rows,
  updateStatus,
  onSave,
  saving,
}: {
  rows: AttendanceRow[];
  updateStatus: (id: string, status: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <View style={reg.wrapper}>
      {/* Table header */}
      <View style={reg.tableHead}>
        <Text style={[reg.colRoll, reg.headText]}>#</Text>
        <Text style={[reg.colName, reg.headText]}>Student Name</Text>
        {REGISTER_COLS.map(s => (
          <View key={s} style={reg.colStatus}>
            <Text style={[reg.headText, { color: STATUS_META[s].text }]}>{STATUS_META[s].short}</Text>
          </View>
        ))}
      </View>

      {/* Legend row */}
      <View style={reg.legend}>
        {REGISTER_COLS.map(s => (
          <View key={s} style={reg.legendItem}>
            <View style={[reg.legendDot, { backgroundColor: STATUS_META[s].text }]} />
            <Text style={[reg.legendText, { color: STATUS_META[s].text }]}>{STATUS_META[s].label}</Text>
          </View>
        ))}
      </View>

      {/* Student rows */}
      {rows.map((row, i) => (
        <View
          key={row.student_id}
          style={[reg.tableRow, i % 2 === 1 && reg.rowAlt, i < rows.length - 1 && reg.rowBorder]}
        >
          <Text style={reg.colRoll}>{row.roll_no ?? i + 1}</Text>
          <Text style={reg.colName} numberOfLines={2}>{row.name}</Text>
          {REGISTER_COLS.map(s => {
            const active = row.status === s;
            const meta = STATUS_META[s];
            return (
              <TouchableOpacity
                key={s}
                style={reg.colStatus}
                onPress={() => updateStatus(row.student_id, s)}
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

      {/* Save footer */}
      <View style={reg.footer}>
        <Text style={reg.footerCount}>{rows.length} students</Text>
        <TouchableOpacity
          style={[reg.saveBtn, saving && { opacity: 0.6 }]}
          onPress={onSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={Colors.card} />
            : (
              <>
                <Ionicons name="save-outline" size={14} color={Colors.card} />
                <Text style={reg.saveBtnText}>Save Attendance</Text>
              </>
            )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Records Table (records tab) ───────────────────────────────────────────────
function RecordsTable({ rows }: { rows: AttendanceRow[] }) {
  return (
    <View style={reg.wrapper}>
      <View style={reg.tableHead}>
        <Text style={[reg.colRoll, reg.headText]}>#</Text>
        <Text style={[reg.colName, reg.headText]}>Student Name</Text>
        <Text style={[reg.headText, { textAlign: 'right', flex: 1 }]}>Status</Text>
      </View>
      {rows.map((row, i) => {
        const meta = STATUS_META[row.status] || STATUS_META.not_marked;
        return (
          <View
            key={row.student_id}
            style={[reg.tableRow, i % 2 === 1 && reg.rowAlt, i < rows.length - 1 && reg.rowBorder]}
          >
            <Text style={reg.colRoll}>{row.roll_no ?? i + 1}</Text>
            <Text style={reg.colName} numberOfLines={2}>{row.name}</Text>
            <View style={[reg.recordBadge, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon as any} size={11} color={meta.text} />
              <Text style={[reg.recordBadgeText, { color: meta.text }]}>{meta.label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Student View ──────────────────────────────────────────────────────────────
function StudentAttendance() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());  // 0-indexed
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const toDate   = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

  useEffect(() => { load(); }, [year, month]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/attendance/students/me', {
        params: { from_date: fromDate, to_date: toDate },
      });
      setRecords(data.records || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) {
      if (month === 11) { setMonth(0); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    }
  };

  // date string → status (prefer 'start' checkpoint for the dot)
  const dateMap: Record<string, string> = {};
  for (const r of records) {
    const d = r.attendance_date?.slice(0, 10);
    if (d && (!dateMap[d] || r.checkpoint === 'start')) dateMap[d] = r.status;
  }

  // stats: count once per day (start checkpoint only)
  const countMap: Record<string, number> = {};
  for (const r of records) {
    if (r.checkpoint !== 'start') continue;
    countMap[r.status] = (countMap[r.status] || 0) + 1;
  }
  const totalDays   = Object.values(countMap).reduce((a, b) => a + b, 0);
  const presentDays = (countMap.present || 0) + (countMap.late || 0) + (countMap.half_day || 0) * 0.5;
  const pct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : null;

  const monthLabel = new Date(year, month, 1)
    .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const weeks = buildCalendarGrid(year, month);

  const STAT_COLS = [
    { key: 'present',        label: 'Present',  color: '#15803D', bg: '#DCFCE7' },
    { key: 'absent',         label: 'Absent',   color: '#DC2626', bg: '#FEE2E2' },
    { key: 'late',           label: 'Late',     color: '#B45309', bg: '#FEF3C7' },
    { key: 'half_day',       label: 'Half Day', color: '#EA580C', bg: '#FFEDD5' },
    { key: 'leave_approved', label: 'Leave',    color: '#6D28D9', bg: '#EDE9FE' },
  ] as const;

  // Records sorted newest first, deduplicated for display (show all checkpoints)
  const sortedRecords = [...records].sort((a, b) =>
    b.attendance_date.localeCompare(a.attendance_date)
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>My Attendance</Text>
          <Text style={styles.headerSub}>Monthly attendance record</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}>

        {/* Month navigation */}
        <View style={att.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={att.navArrow}>
            <Ionicons name="chevron-back" size={20} color={Brand.blueDark} />
          </TouchableOpacity>
          <Text style={att.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={nextMonth} style={att.navArrow}>
            <Ionicons name="chevron-forward" size={20} color={Brand.blueDark} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={[styles.center, { paddingVertical: 60 }]}>
            <ActivityIndicator color={Brand.blueDark} />
          </View>
        ) : (
          <>
            {/* Stats row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={att.statsRow}>
                {STAT_COLS.map(s => (
                  <View key={s.key} style={[att.statCard, { backgroundColor: s.bg }]}>
                    <Text style={[att.statNum, { color: s.color }]}>{countMap[s.key] || 0}</Text>
                    <Text style={[att.statLabel, { color: s.color }]}>{s.label}</Text>
                  </View>
                ))}
                <View style={[att.statCard, { backgroundColor: pct == null ? Colors.border : pct >= 75 ? '#DCFCE7' : '#FEE2E2' }]}>
                  <Text style={[att.statNum, { color: pct == null ? Colors.textSecondary : pct >= 75 ? '#15803D' : '#DC2626' }]}>
                    {pct != null ? `${pct}%` : '—'}
                  </Text>
                  <Text style={[att.statLabel, { color: pct == null ? Colors.textSecondary : pct >= 75 ? '#15803D' : '#DC2626' }]}>
                    Overall
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Calendar */}
            <View style={att.calCard}>
              {/* Day-of-week header */}
              <View style={att.calDowRow}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <Text key={d} style={att.calDow}>{d}</Text>
                ))}
              </View>
              {/* Weeks */}
              {weeks.map((week, wi) => (
                <View key={wi} style={att.calWeek}>
                  {week.map((day, di) => {
                    if (!day) return <View key={di} style={att.calCell} />;
                    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const status = dateMap[ds];
                    const dotColor = status ? STATUS_DOT_COLOR[status] : null;
                    const isToday = now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
                    return (
                      <View key={di} style={[att.calCell, isToday && att.calCellToday]}>
                        <Text style={[att.calDayNum, isToday && att.calDayNumToday]}>{day}</Text>
                        {dotColor
                          ? <View style={[att.calDot, { backgroundColor: dotColor }]} />
                          : <View style={att.calDotEmpty} />
                        }
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={att.legend}>
              {[
                { color: '#15803D', label: 'Present' },
                { color: '#DC2626', label: 'Absent' },
                { color: '#B45309', label: 'Late' },
                { color: '#EA580C', label: 'Half Day' },
                { color: '#6D28D9', label: 'Leave' },
              ].map(l => (
                <View key={l.label} style={att.legendItem}>
                  <View style={[att.legendDot, { backgroundColor: l.color }]} />
                  <Text style={att.legendText}>{l.label}</Text>
                </View>
              ))}
            </View>

            {/* Records register table */}
            {sortedRecords.length > 0 && (
              <View style={att.tableWrap}>
                <View style={att.tableHead}>
                  <Text style={[att.colDate, att.headText]}>Date</Text>
                  <Text style={[att.colSession, att.headText]}>Session</Text>
                  <Text style={[att.colStatus, att.headText]}>Status</Text>
                </View>
                {sortedRecords.map((r, i) => {
                  const meta = STATUS_META[r.status] || STATUS_META.not_marked;
                  return (
                    <View
                      key={r._id || i}
                      style={[att.tableRow, i % 2 === 1 && att.rowAlt, i < sortedRecords.length - 1 && att.rowBorder]}
                    >
                      <Text style={att.colDate}>
                        {new Date(r.attendance_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </Text>
                      <Text style={att.colSession}>
                        {r.checkpoint === 'start' ? 'Morning' : 'Afternoon'}
                      </Text>
                      <View style={[att.statusBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[att.statusBadgeText, { color: meta.text }]}>{meta.label}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {sortedRecords.length === 0 && (
              <View style={[styles.center, { paddingVertical: 32 }]}>
                <Ionicons name="calendar-outline" size={36} color={Colors.placeholder} />
                <Text style={[styles.emptyText, { marginTop: 10 }]}>
                  No attendance records found for this month.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Register table styles ─────────────────────────────────────────────────────
const reg = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.subtle,
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.blueDark,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.card,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '600' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  rowAlt: { backgroundColor: '#F8FAFC' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  colRoll: {
    width: 28,
    fontSize: 12,
    fontWeight: '700',
    color: Brand.blueDark,
    textAlign: 'center',
  },
  colName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 10,
    marginRight: 6,
  },
  colStatus: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recordBadgeText: { fontSize: 10, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#F8FAFC',
  },
  footerCount: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.blueDark,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtnText: { color: Colors.card, fontSize: 13, fontWeight: '700' },
});

// ─── Page-level styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Brand.blueDark,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.card },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Brand.blueDark },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Brand.blueDark, fontWeight: '700' },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.subtle,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.background,
  },
  pillActive: { backgroundColor: Brand.blueLight, borderColor: Brand.blueDark },
  pillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  pillTextActive: { color: Brand.blueDark, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 4,
    height: 44,
  },
  navBtn: { padding: 10 },
  dateText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.successBg, borderRadius: Radius.md,
    padding: 12, borderWidth: 1, borderColor: '#BBF7D0',
  },
  successText: { fontSize: 13, color: Colors.success, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryCard: { borderRadius: Radius.md, padding: 10, minWidth: 80, alignItems: 'center', gap: 2 },
  summaryCount: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Brand.blueLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, ...Shadow.card,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
});

// ─── Student attendance styles ─────────────────────────────────────────────────
const att = StyleSheet.create({
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 4, height: 50,
    ...Shadow.subtle,
  },
  navArrow: { padding: 12 },
  monthLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { borderRadius: Radius.md, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', gap: 2, minWidth: 76 },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  calCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 12, ...Shadow.subtle,
  },
  calDowRow: { flexDirection: 'row', marginBottom: 4 },
  calDow: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  calWeek: { flexDirection: 'row' },
  calCell: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  calCellToday: { backgroundColor: Brand.blueLight, borderRadius: Radius.sm },
  calDayNum: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  calDayNumToday: { color: Brand.blueDark },
  calDot: { width: 6, height: 6, borderRadius: 3 },
  calDotEmpty: { width: 6, height: 6 },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },

  tableWrap: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadow.subtle,
  },
  tableHead: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Brand.blueDark, paddingHorizontal: 12, paddingVertical: 10,
  },
  headText: { fontSize: 11, fontWeight: '700', color: Colors.card },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, minHeight: 42,
  },
  rowAlt: { backgroundColor: '#F8FAFC' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  colDate:    { width: 68, fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  colSession: { flex: 1, fontSize: 12, color: Colors.textSecondary },
  colStatus:  { alignItems: 'flex-end' },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
});
