import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import API from '@/src/api/api';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

// Matches the actual API response from GET /student/birthdays
interface BirthdayStudent {
  _id: string;
  first_name: string;
  last_name: string;
  class_name: string;
  section_name: string;
  roll_no: string;
  day: number;
  month: number;         // 1-indexed
  birth_year: number;
  days_until: number;
  is_today: boolean;
}

const AVATAR_COLORS = [
  '#1D4ED8', '#15803D', '#B45309', '#DC2626', '#7C3AED',
  '#0E7490', '#BE185D', '#047857', '#92400E', '#1E40AF',
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function formatBirthday(day: number, month: number) {
  const d = new Date(2000, month - 1, day);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long' });
}

export default function BirthdaysScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<BirthdayStudent[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<'today' | 'upcoming' | 'all'>('today');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    API.get('/student/birthdays')
      .then(({ data }) => setStudents(data.birthdays || data.students || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayBirthdays    = useMemo(() => students.filter(s => s.is_today), [students]);
  const upcomingBirthdays = useMemo(
    () => students.filter(s => !s.is_today && s.days_until <= 30),
    [students],
  );
  const allFiltered = useMemo(() => {
    const q = search.toLowerCase();
    return students
      .filter(s => !q || `${s.first_name} ${s.last_name}`.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => {
        const ma = a.month * 31 + a.day;
        const mb = b.month * 31 + b.day;
        return ma - mb;
      });
  }, [students, search]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Birthdays</Text>
          <Text style={styles.headerSub}>Classmates & staff celebrations</Text>
        </View>
        {todayBirthdays.length > 0 && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>{todayBirthdays.length} today</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {([
          ['today',    'today-outline',    'Today'],
          ['upcoming', 'calendar-outline', 'Upcoming'],
          ['all',      'people-outline',   'All'],
        ] as const).map(([t, icon, label]) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Ionicons name={icon} size={14} color={tab === t ? Brand.blueDark : Colors.textSecondary} />
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Brand.blueDark} /></View>
      ) : (
        <>
          {tab === 'today' && (
            <ScrollView contentContainerStyle={styles.scroll}>
              {todayBirthdays.length === 0 ? (
                <View style={[styles.center, { paddingVertical: 60 }]}>
                  <Text style={styles.cakeEmoji}>🎂</Text>
                  <Text style={styles.emptyTitle}>No birthdays today</Text>
                  <Text style={styles.emptyText}>Check upcoming to see who's celebrating soon.</Text>
                </View>
              ) : (
                <>
                  <View style={styles.todayBanner}>
                    <Text style={styles.todayBannerText}>
                      🎉 {todayBirthdays.length === 1 ? '1 person is' : `${todayBirthdays.length} people are`} celebrating today!
                    </Text>
                  </View>
                  <View style={styles.registerCard}>
                    <View style={styles.regHead}>
                      <Text style={styles.regHeadText}>Today's Birthdays</Text>
                    </View>
                    {todayBirthdays.map((s, i) => (
                      <StudentRow
                        key={s._id}
                        student={s}
                        index={i}
                        total={todayBirthdays.length}
                        showDays={false}
                      />
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          )}

          {tab === 'upcoming' && (
            <ScrollView contentContainerStyle={styles.scroll}>
              {upcomingBirthdays.length === 0 ? (
                <View style={[styles.center, { paddingVertical: 60 }]}>
                  <Ionicons name="calendar-outline" size={40} color={Colors.placeholder} />
                  <Text style={[styles.emptyTitle, { marginTop: 12 }]}>No upcoming birthdays</Text>
                  <Text style={styles.emptyText}>No birthdays in the next 30 days.</Text>
                </View>
              ) : (
                <View style={styles.registerCard}>
                  <View style={styles.regHead}>
                    <Text style={styles.regHeadText}>Next 30 Days</Text>
                    <Text style={styles.regHeadCount}>{upcomingBirthdays.length} birthdays</Text>
                  </View>
                  {upcomingBirthdays.map((s, i) => (
                    <StudentRow
                      key={s._id}
                      student={s}
                      index={i}
                      total={upcomingBirthdays.length}
                      showDays
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          {tab === 'all' && (
            <View style={{ flex: 1 }}>
              <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={16} color={Colors.placeholder} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name…"
                  placeholderTextColor={Colors.placeholder}
                  value={search}
                  onChangeText={setSearch}
                />
                {!!search && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={16} color={Colors.placeholder} />
                  </TouchableOpacity>
                )}
              </View>
              {allFiltered.length === 0 ? (
                <View style={[styles.center, { paddingVertical: 40 }]}>
                  <Text style={styles.emptyText}>No students found.</Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
                  <View style={styles.registerCard}>
                    <View style={styles.regHead}>
                      <Text style={styles.regHeadText}>All Students</Text>
                      <Text style={styles.regHeadCount}>{allFiltered.length} total</Text>
                    </View>
                    {allFiltered.map((s, i) => (
                      <StudentRow
                        key={s._id}
                        student={s}
                        index={i}
                        total={allFiltered.length}
                        showDays
                      />
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

// ─── Single student row ────────────────────────────────────────────────────────
function StudentRow({
  student,
  index,
  total,
  showDays,
}: {
  student: BirthdayStudent;
  index: number;
  total: number;
  showDays: boolean;
}) {
  const fullName = `${student.first_name} ${student.last_name}`;
  const initials = `${student.first_name[0] ?? ''}${student.last_name[0] ?? ''}`.toUpperCase();
  const accentColor = avatarColor(fullName);

  const metaParts = [
    student.class_name,
    student.section_name ? `Sec ${student.section_name}` : '',
    student.roll_no ? `Roll ${student.roll_no}` : '',
  ].filter(Boolean).join(' · ');

  return (
    <View style={[
      row.container,
      index % 2 === 1 && row.alt,
      index < total - 1 && row.border,
      student.is_today && row.todayRow,
    ]}>
      <View style={[row.avatar, { backgroundColor: accentColor }]}>
        <Text style={row.initials}>{initials}</Text>
      </View>

      <View style={row.info}>
        <View style={row.nameRow}>
          <Text style={row.name} numberOfLines={1}>{fullName}</Text>
          {student.is_today && (
            <View style={row.todayBadge}>
              <Text style={row.todayBadgeText}>🎂 Today</Text>
            </View>
          )}
        </View>
        {!!metaParts && <Text style={row.meta}>{metaParts}</Text>}
      </View>

      <View style={row.right}>
        <Text style={row.dateText}>{formatBirthday(student.day, student.month)}</Text>
        {showDays && !student.is_today && student.days_until != null && (
          <Text style={row.daysText}>in {student.days_until}d</Text>
        )}
      </View>
    </View>
  );
}

// ─── Row styles ────────────────────────────────────────────────────────────────
const row = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11, gap: 12,
  },
  alt: { backgroundColor: '#F8FAFC' },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  todayRow: { backgroundColor: '#FFF7ED' },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  initials: { fontSize: 14, fontWeight: '800', color: '#fff' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  todayBadge: {
    backgroundColor: '#FEF3C7', borderRadius: Radius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  todayBadgeText: { fontSize: 10, fontWeight: '700', color: '#B45309' },
  meta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', flexShrink: 0 },
  dateText: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  daysText: { fontSize: 10, color: Brand.blueDark, fontWeight: '600', marginTop: 2 },
});

// ─── Screen styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },

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
  todayBadge: {
    backgroundColor: '#FEF3C7', borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  todayBadgeText: { fontSize: 11, fontWeight: '700', color: '#B45309' },

  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5, paddingVertical: 13,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Brand.blueDark },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Brand.blueDark, fontWeight: '700' },

  todayBanner: {
    backgroundColor: '#FFF7ED', borderRadius: Radius.lg,
    borderWidth: 1, borderColor: '#FED7AA',
    padding: 14, alignItems: 'center',
  },
  todayBannerText: { fontSize: 15, fontWeight: '700', color: '#B45309', textAlign: 'center' },

  registerCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', ...Shadow.subtle,
  },
  regHead: {
    backgroundColor: Brand.blueDark, paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  regHeadText: { fontSize: 13, fontWeight: '700', color: Colors.card },
  regHeadCount: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },

  cakeEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6, textAlign: 'center' },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
});
