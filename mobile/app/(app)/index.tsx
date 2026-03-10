import React from 'react';
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
    : BASE_FEATURES;

  // ── Student admission gate ─────────────────────────────────────────────────
  if (user.role === 'student' && user.admission_status !== 'approved') {
    const admStatus = user.admission_status ?? 'not_submitted';

    const gateConfig = {
      not_submitted: {
        icon: 'document-text-outline' as const,
        iconColor: Brand.blueDark,
        iconBg: Brand.blueLight,
        title: 'Complete Your Admission',
        subtitle: 'You need to fill out the student admission form before accessing your dashboard.',
        btnLabel: 'Fill Admission Form',
        btnColor: Brand.blueDark,
        btnAction: () => router.push('/features/admission-form' as any),
      },
      pending: {
        icon: 'hourglass-outline' as const,
        iconColor: Colors.warning,
        iconBg: Colors.warningBg,
        title: 'Admission Under Review',
        subtitle: 'Your admission form has been submitted and is awaiting approval from the admin. You will be notified once reviewed.',
        btnLabel: null,
        btnColor: '',
        btnAction: () => {},
      },
      rejected: {
        icon: 'close-circle-outline' as const,
        iconColor: Colors.error,
        iconBg: Colors.errorBg,
        title: 'Admission Not Approved',
        subtitle: 'Your admission form was not approved. Please review the details and resubmit.',
        btnLabel: 'Edit & Resubmit',
        btnColor: Colors.error,
        btnAction: () => router.push('/features/admission-form' as any),
      },
    }[admStatus] ?? {
      icon: 'document-text-outline' as const,
      iconColor: Brand.blueDark,
      iconBg: Brand.blueLight,
      title: 'Complete Your Admission',
      subtitle: 'Please fill the admission form.',
      btnLabel: 'Fill Admission Form',
      btnColor: Brand.blueDark,
      btnAction: () => router.push('/features/admission-form' as any),
    };

    return (
      <SafeAreaView style={styles.safe}>
        {/* Mini header */}
        <View style={[styles.topBar, { paddingBottom: 16 }]}>
          <View style={styles.topBarLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{user.first_name[0]}{user.last_name[0]}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.userName}>{user.first_name} {user.last_name}</Text>
            </View>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleColor.bg }]}>
            <Text style={[styles.roleText, { color: roleColor.text }]}>{ROLE_LABELS[user.role]}</Text>
          </View>
        </View>

        {/* Gate content */}
        <View style={styles.gateContainer}>
          <View style={[styles.gateIconCircle, { backgroundColor: gateConfig.iconBg }]}>
            <Ionicons name={gateConfig.icon} size={56} color={gateConfig.iconColor} />
          </View>
          <Text style={styles.gateTitle}>{gateConfig.title}</Text>
          <Text style={styles.gateSubtitle}>{gateConfig.subtitle}</Text>

          {gateConfig.btnLabel && (
            <TouchableOpacity
              style={[styles.gateBtn, { backgroundColor: gateConfig.btnColor }]}
              onPress={gateConfig.btnAction}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" />
              <Text style={styles.gateBtnText}>{gateConfig.btnLabel}</Text>
            </TouchableOpacity>
          )}

          {admStatus === 'pending' && (
            <View style={styles.gatePendingBadge}>
              <Ionicons name="time-outline" size={14} color={Colors.warning} />
              <Text style={styles.gatePendingText}>Waiting for admin review…</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

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

  // ── Admission gate ──────────────────────────────────────────────
  gateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  gateIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  gateSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  gateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: Radius.lg,
    marginTop: 8,
  },
  gateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  gatePendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.warningBg,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  gatePendingText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600',
  },
});
