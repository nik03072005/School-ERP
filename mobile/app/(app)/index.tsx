import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { FeatureCard } from '@/src/components/FeatureCard';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

// ─── Feature cards config ─────────────────────────────────────────────────────
const BASE_FEATURES = [
  { title: 'Attendance', subtitle: 'Track daily attendance', icon: 'calendar-outline', route: '/features/attendance' },
  { title: 'Timetable', subtitle: 'View class schedule', icon: 'time-outline', route: '/features/timetable' },
  { title: 'Notices', subtitle: 'School announcements', icon: 'notifications-outline', route: '/features/notices' },
  { title: 'Fees', subtitle: 'Payment & dues', icon: 'card-outline', route: '/features/fees' },
  { title: 'Results', subtitle: 'Marks & report cards', icon: 'bar-chart-outline', route: '/features/results' },
] as const;

const ADMIN_FEATURES = [
  { title: 'User Management', subtitle: 'Approve & manage users', icon: 'people-outline', route: '/features/user-management' },
] as const;

const STUDENT_FEATURES = [
  { title: 'Admission Details', subtitle: 'View your admission record', icon: 'document-text-outline', route: '/features/admission-form' },
] as const;

// ─── Role labels ──────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  teaching_staff: 'Teacher',
  non_teaching_staff: 'Staff',
  admin: 'Admin',
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  student: { bg: Brand.blueLight, text: Brand.blueDark },
  teaching_staff: { bg: Brand.yellowLight, text: '#8B7A00' },
  non_teaching_staff: { bg: '#E0F2F1', text: '#00695C' },
  admin: { bg: '#FCE4EC', text: '#C2185B' },
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const roleColor = ROLE_COLORS[user.role] ?? ROLE_COLORS.student;
  const features = user.role === 'admin'
    ? [...BASE_FEATURES, ...ADMIN_FEATURES]
    : user.role === 'student'
      ? [...BASE_FEATURES, ...STUDENT_FEATURES]
      : BASE_FEATURES;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Top header ──────────────────────────────────────── */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user.first_name[0]}{user.last_name[0]}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.userName}>{user.first_name} {user.last_name}</Text>
            </View>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleColor.bg }]}>
            <Text style={[styles.roleText, { color: roleColor.text }]}>
              {ROLE_LABELS[user.role]}
            </Text>
          </View>
        </View>

        {/* ── Quick stats bar ──────────────────────────────────── */}
        <View style={styles.statsRow}>
          {[
            { label: 'Attendance', value: '—', icon: 'calendar' },
            { label: 'Notices', value: '—', icon: 'notifications' },
            { label: 'Fees Due', value: '—', icon: 'card' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={18} color={Brand.blueDark} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Features grid ────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.grid}>
          {features.map((f) => (
            <View key={f.title} style={styles.gridItem}>
              <FeatureCard
                title={f.title}
                subtitle={f.subtitle}
                iconName={f.icon as any}
                onPress={() => router.push(f.route as any)}
              />
            </View>
          ))}
        </View>

        {/* ── Notice banner ────────────────────────────────────── */}
        <View style={styles.noticeBanner}>
          <Ionicons name="star" size={18} color={Brand.yellow} />
          <Text style={styles.noticeText}>
            More features are on the way! Stay tuned for updates.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 32 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.blue,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.blueDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.card,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.card,
  },

  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: -2,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: Brand.blue,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 3,
    ...Shadow.card,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Brand.blueDark,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 12,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  gridItem: { width: '47%' },

  // Banner
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.subtle,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
