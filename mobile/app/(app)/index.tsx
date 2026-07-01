import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import API from '@/src/api/api';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

interface Feature {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const BASE_FEATURES: Feature[] = [
  { title: 'Attendance',  subtitle: 'Track daily attendance',    icon: 'calendar-outline',       route: '/features/attendance' },
  { title: 'Timetable',  subtitle: 'View class schedule',        icon: 'time-outline',           route: '/features/timetable' },
  { title: 'Notices',    subtitle: 'School announcements',       icon: 'notifications-outline',  route: '/features/notices' },
  { title: 'Fees',       subtitle: 'Payment & dues',             icon: 'card-outline',           route: '/features/fees' },
];

const TEACHER_FEATURES: Feature[] = [
  { title: 'Marks Entry',    subtitle: 'Enter student exam marks',    icon: 'create-outline',           route: '/features/results' },
  { title: 'Daily Logbook',  subtitle: 'Record classwork & homework', icon: 'book-outline',             route: '/features/logbook' },
  { title: 'Leave',          subtitle: 'Apply & track leave',         icon: 'calendar-clear-outline',   route: '/features/leave' },
  { title: 'Parent Queries', subtitle: 'View & reply to queries',     icon: 'chatbubbles-outline',      route: '/features/parent-notes' },
];

const ADMIN_FEATURES: Feature[] = [
  { title: 'User Management',  subtitle: 'Approve & manage users',       icon: 'people-outline',          route: '/features/user-management' },
  { title: 'School Setup',     subtitle: 'Classes, sections & periods',  icon: 'school-outline',          route: '/features/school-setup' },
  { title: 'Exam Management',  subtitle: 'Create & manage exam schedules', icon: 'clipboard-outline',     route: '/features/exam-management' },
  { title: 'Staff Attendance', subtitle: 'Mark daily staff attendance',  icon: 'person-circle-outline',  route: '/features/staff-attendance' },
  { title: 'Marks Entry',      subtitle: 'Enter student exam marks',     icon: 'create-outline',          route: '/features/results' },
  { title: 'Daily Logbook',    subtitle: 'Log classwork entries',        icon: 'book-outline',            route: '/features/logbook' },
  { title: 'Parent Queries',   subtitle: 'View & reply to queries',      icon: 'chatbubbles-outline',     route: '/features/parent-notes' },
];

const STUDENT_FEATURES: Feature[] = [
  { title: 'My Results',        subtitle: 'Marks & report cards',       icon: 'bar-chart-outline',      route: '/features/results' },
  { title: 'Logbook',           subtitle: 'Classwork & homework',       icon: 'book-outline',           route: '/features/logbook' },
  { title: 'Leave',             subtitle: 'Apply for leave',            icon: 'calendar-clear-outline', route: '/features/leave' },
  { title: 'Queries',           subtitle: 'Submit parent queries',      icon: 'chatbubble-outline',     route: '/features/parent-notes' },
  { title: 'Birthdays',         subtitle: 'Classmates & staff birthdays', icon: 'gift-outline',         route: '/features/birthdays' },
  { title: 'Admission Details', subtitle: 'View your admission record', icon: 'document-text-outline',  route: '/features/admission-form' },
];

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  teaching_staff: 'Teacher',
  non_teaching_staff: 'Staff',
  admin: 'Admin',
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  student:            { bg: Brand.blueLight,  text: Brand.blueDark },
  teaching_staff:     { bg: Brand.yellowLight, text: '#8B7A00' },
  non_teaching_staff: { bg: '#E0F2F1',         text: '#00695C' },
  admin:              { bg: '#FCE4EC',          text: '#C2185B' },
};

// Icon accent colours per feature (makes the register rows feel distinct)
const ICON_COLORS: Record<string, { bg: string; icon: string }> = {
  'calendar-outline':         { bg: '#DBEAFE', icon: '#1D4ED8' },
  'time-outline':             { bg: '#FEF3C7', icon: '#B45309' },
  'notifications-outline':    { bg: '#FFEDD5', icon: '#EA580C' },
  'card-outline':             { bg: '#DCFCE7', icon: '#15803D' },
  'create-outline':           { bg: '#EDE9FE', icon: '#6D28D9' },
  'book-outline':             { bg: '#FEE2E2', icon: '#DC2626' },
  'calendar-clear-outline':   { bg: '#F0FDF4', icon: '#16A34A' },
  'chatbubbles-outline':      { bg: '#DBEAFE', icon: '#2563EB' },
  'chatbubble-outline':       { bg: '#DBEAFE', icon: '#2563EB' },
  'people-outline':           { bg: '#FCE7F3', icon: '#BE185D' },
  'bar-chart-outline':        { bg: '#FEF9C3', icon: '#CA8A04' },
  'document-text-outline':    { bg: '#F1F5F9', icon: '#475569' },
  'gift-outline':             { bg: '#FCE7F3', icon: '#BE185D' },
  'school-outline':           { bg: '#DBEAFE', icon: '#1E40AF' },
  'clipboard-outline':        { bg: '#FEF3C7', icon: '#92400E' },
  'person-circle-outline':    { bg: '#DCFCE7', icon: '#15803D' },
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashStats, setDashStats] = useState<{
    attendance: string; notices: string; leavesOrFees: string;
  }>({ attendance: '—', notices: '—', leavesOrFees: '—' });

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm   = String(now.getMonth() + 1).padStart(2, '0');
    const fromDate = `${yyyy}-${mm}-01`;
    const toDate   = `${yyyy}-${mm}-${new Date(yyyy, now.getMonth() + 1, 0).getDate()}`;

    if (user.role === 'student') {
      Promise.allSettled([
        API.get('/attendance/students/me', { params: { from_date: fromDate, to_date: toDate } }),
        API.get('/notices'),
        API.get('/leaves/mine'),
      ]).then(([attRes, noticeRes, leaveRes]) => {
        // Attendance %
        let attStr = '—';
        if (attRes.status === 'fulfilled') {
          const recs = (attRes.value.data.records || []).filter((r: any) => r.checkpoint === 'start');
          const total = recs.length;
          const present = recs.filter((r: any) => ['present', 'late', 'half_day'].includes(r.status)).length;
          if (total > 0) attStr = `${Math.round((present / total) * 100)}%`;
        }
        // Notices count
        let noticeStr = '—';
        if (noticeRes.status === 'fulfilled') {
          noticeStr = String((noticeRes.value.data.notices || []).length);
        }
        // Pending leaves
        let leaveStr = '—';
        if (leaveRes.status === 'fulfilled') {
          const pending = (leaveRes.value.data.leaves || []).filter((l: any) => l.status === 'pending').length;
          leaveStr = String(pending);
        }
        setDashStats({ attendance: attStr, notices: noticeStr, leavesOrFees: leaveStr });
      });
    } else if (user.role === 'admin') {
      Promise.allSettled([
        API.get('/admin/users/pending'),
        API.get('/notices'),
        API.get('/admin/admissions/pending'),
      ]).then(([pendingRes, noticeRes, admRes]) => {
        const pendingStr = pendingRes.status === 'fulfilled'
          ? String((pendingRes.value.data.users || []).length)
          : '—';
        const noticeStr = noticeRes.status === 'fulfilled'
          ? String((noticeRes.value.data.notices || []).length)
          : '—';
        const admStr = admRes.status === 'fulfilled'
          ? String((admRes.value.data.students || []).length)
          : '—';
        setDashStats({ attendance: pendingStr, notices: noticeStr, leavesOrFees: admStr });
      });
    } else {
      // Non-teaching staff: show notice count only
      Promise.allSettled([API.get('/notices')]).then(([noticeRes]) => {
        const noticeStr = noticeRes.status === 'fulfilled'
          ? String((noticeRes.value.data.notices || []).length)
          : '—';
        setDashStats({ attendance: '—', notices: noticeStr, leavesOrFees: '—' });
      });
    }
  }, [user?.role]);

  if (!user) return null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const roleColor = ROLE_COLORS[user.role] ?? ROLE_COLORS.student;

  const roleSpecific =
    user.role === 'admin' ? ADMIN_FEATURES
    : user.role === 'teaching_staff' || user.role === 'non_teaching_staff' ? TEACHER_FEATURES
    : STUDENT_FEATURES;

  const roleGroupLabel =
    user.role === 'admin' ? 'Administration'
    : user.role === 'teaching_staff' || user.role === 'non_teaching_staff' ? 'Teaching Tools'
    : 'My Academics';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ──────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user.first_name[0]}{user.last_name[0]}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {user.first_name} {user.last_name}
              </Text>
            </View>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleColor.bg }]}>
            <Text style={[styles.roleText, { color: roleColor.text }]}>
              {ROLE_LABELS[user.role]}
            </Text>
          </View>
        </View>

        {/* ── Stats strip ─────────────────────────────────────── */}
        <View style={styles.statsStrip}>
          {[
            {
              label: user.role === 'admin' ? 'Pending Users' : 'Attendance',
              value: dashStats.attendance,
              icon: user.role === 'admin' ? 'people' as const : 'calendar' as const,
            },
            { label: 'Notices', value: dashStats.notices, icon: 'notifications' as const },
            {
              label: user.role === 'admin' ? 'Pending Admissions'
                : user.role === 'student' ? 'Pending Leave'
                : 'Upcoming',
              value: dashStats.leavesOrFees,
              icon: user.role === 'admin' ? 'document-text' as const
                : user.role === 'student' ? 'calendar-clear' as const
                : 'time' as const,
            },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon} size={18} color={Brand.blueDark} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── School features register ─────────────────────────── */}
        <FeatureSection title="School" features={BASE_FEATURES} router={router} />

        {/* ── Role-specific features register ─────────────────── */}
        <FeatureSection title={roleGroupLabel} features={roleSpecific} router={router} />

        {/* ── Footer banner ───────────────────────────────────── */}
        <View style={styles.banner}>
          <Ionicons name="star" size={16} color={Brand.yellow} />
          <Text style={styles.bannerText}>
            {user.role === 'admin'
              ? 'Manage users, school setup, exams, staff attendance, marks, and more — all from your phone.'
              : user.role === 'teaching_staff' || user.role === 'non_teaching_staff'
              ? 'Mark attendance, enter marks, write logbook entries, and more — all from your phone.'
              : 'More features are on the way! Stay tuned for updates.'}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Feature section (register-style list) ────────────────────────────────────
function FeatureSection({
  title,
  features,
  router,
}: {
  title: string;
  features: Feature[];
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <View style={reg.wrapper}>
      {/* Section header — same dark blue as attendance register */}
      <View style={reg.sectionHead}>
        <Text style={reg.sectionHeadText}>{title}</Text>
      </View>

      {features.map((f, i) => {
        const accent = ICON_COLORS[f.icon] ?? { bg: Brand.blueLight, icon: Brand.blueDark };
        return (
          <TouchableOpacity
            key={f.title}
            style={[reg.row, i % 2 === 1 && reg.rowAlt, i < features.length - 1 && reg.rowBorder]}
            onPress={() => router.push(f.route as any)}
            activeOpacity={0.7}
          >
            <View style={[reg.iconWrap, { backgroundColor: accent.bg }]}>
              <Ionicons name={f.icon} size={20} color={accent.icon} />
            </View>
            <View style={reg.textWrap}>
              <Text style={reg.rowTitle}>{f.title}</Text>
              <Text style={reg.rowSub} numberOfLines={1}>{f.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.placeholder} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Register section styles ──────────────────────────────────────────────────
const reg = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    ...Shadow.subtle,
  },
  sectionHead: {
    backgroundColor: Brand.blueDark,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionHeadText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.card,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 14,
    backgroundColor: Colors.card,
  },
  rowAlt: { backgroundColor: '#F8FAFC' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  textWrap: { flex: 1 },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

// ─── Page styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 32 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.blue,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 12 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Brand.blueDark,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: { color: Colors.card, fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  greeting: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: 17, fontWeight: '700', color: Colors.card },

  roleBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, flexShrink: 0 },
  roleText: { fontSize: 12, fontWeight: '700' },

  statsStrip: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    backgroundColor: Brand.blue,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingVertical: 12, alignItems: 'center', gap: 3, ...Shadow.card,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: Brand.blueDark },
  statLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 18,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: 14, borderWidth: 1, borderColor: Colors.border, ...Shadow.subtle,
  },
  bannerText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});
