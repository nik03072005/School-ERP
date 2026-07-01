import React, { useCallback, useEffect, useState } from 'react';
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
import { useAuth } from '@/src/context/AuthContext';
import API from '@/src/api/api';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

interface ClassDoc { _id: string; name: string; grade_level: number; is_active: boolean }
interface SectionDoc {
  _id: string; name: string; is_active: boolean;
  class_id: { _id: string; name: string; grade_level: number };
  class_teacher_user_id?: { first_name: string; last_name: string };
}
interface PeriodDoc {
  _id: string; name: string; period_number: number;
  start_time: string; end_time: string; is_break: boolean; is_active: boolean;
}

type Tab = 'classes' | 'sections' | 'periods';

export default function SchoolSetupScreen() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/(app)');
  }, [user]);

  const [tab, setTab] = useState<Tab>('classes');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>School Setup</Text>
          <Text style={styles.headerSub}>Manage classes, sections & periods</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['classes', 'sections', 'periods'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'classes' && <ClassesTab />}
      {tab === 'sections' && <SectionsTab />}
      {tab === 'periods' && <PeriodsTab />}
    </SafeAreaView>
  );
}

// ─── Classes Tab ───────────────────────────────────────────────────────────────
function ClassesTab() {
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/setup/classes');
      setClasses(data.classes || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!name.trim() || !gradeLevel.trim()) {
      Alert.alert('Required', 'Class name and grade level are required.');
      return;
    }
    setSaving(true);
    try {
      await API.post('/setup/classes', {
        name: name.trim(),
        grade_level: Number(gradeLevel),
      });
      setName('');
      setGradeLevel('');
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create class.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Create form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add New Class</Text>
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Class name (e.g. Grade 5)"
              placeholderTextColor={Colors.placeholder}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Grade #"
              placeholderTextColor={Colors.placeholder}
              value={gradeLevel}
              onChangeText={setGradeLevel}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity
            style={[styles.createBtn, saving && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={Colors.card} size="small" />
              : <><Ionicons name="add-circle-outline" size={16} color={Colors.card} /><Text style={styles.createBtnText}>Create Class</Text></>
            }
          </TouchableOpacity>
        </View>

        {/* List */}
        <View style={styles.listCard}>
          <Text style={styles.listHeader}>All Classes ({classes.length})</Text>
          {loading ? (
            <ActivityIndicator color={Brand.blueDark} style={{ marginVertical: 24 }} />
          ) : classes.length === 0 ? (
            <EmptyState icon="school-outline" text="No classes created yet." />
          ) : (
            classes.map((c, i) => (
              <View key={c._id} style={[styles.listRow, i < classes.length - 1 && styles.rowBorder]}>
                <View style={styles.listIconWrap}>
                  <Ionicons name="school-outline" size={18} color={Brand.blueDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listRowTitle}>{c.name}</Text>
                  <Text style={styles.listRowSub}>Grade {c.grade_level}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: c.is_active ? Colors.successBg : Colors.errorBg }]}>
                  <Text style={[styles.statusText, { color: c.is_active ? Colors.success : Colors.error }]}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Sections Tab ──────────────────────────────────────────────────────────────
function SectionsTab() {
  const [sections, setSections] = useState<SectionDoc[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [secRes, clsRes] = await Promise.all([
        API.get('/setup/sections'),
        API.get('/setup/classes', { params: { is_active: true } }),
      ]);
      setSections(secRes.data.sections || []);
      const cls: ClassDoc[] = clsRes.data.classes || [];
      setClasses(cls);
      if (cls.length > 0 && !selectedClassId) setSelectedClassId(cls[0]._id);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!selectedClassId || !name.trim()) {
      Alert.alert('Required', 'Please select a class and enter a section name.');
      return;
    }
    setSaving(true);
    try {
      await API.post('/setup/sections', { class_id: selectedClassId, name: name.trim() });
      setName('');
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create section.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add New Section</Text>

          <Text style={styles.label}>Class</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={styles.pillRow}>
              {classes.map(c => (
                <TouchableOpacity
                  key={c._id}
                  style={[styles.pill, selectedClassId === c._id && styles.pillActive]}
                  onPress={() => setSelectedClassId(c._id)}
                >
                  <Text style={[styles.pillText, selectedClassId === c._id && styles.pillTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.label}>Section Name</Text>
          <TextInput
            style={[styles.input, { marginBottom: 0 }]}
            placeholder="e.g. A, B, Rose, Lotus"
            placeholderTextColor={Colors.placeholder}
            value={name}
            onChangeText={setName}
          />
          <TouchableOpacity
            style={[styles.createBtn, saving && { opacity: 0.6 }, { marginTop: 12 }]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={Colors.card} size="small" />
              : <><Ionicons name="add-circle-outline" size={16} color={Colors.card} /><Text style={styles.createBtnText}>Create Section</Text></>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.listHeader}>All Sections ({sections.length})</Text>
          {loading ? (
            <ActivityIndicator color={Brand.blueDark} style={{ marginVertical: 24 }} />
          ) : sections.length === 0 ? (
            <EmptyState icon="git-branch-outline" text="No sections created yet." />
          ) : (
            sections.map((s, i) => (
              <View key={s._id} style={[styles.listRow, i < sections.length - 1 && styles.rowBorder]}>
                <View style={styles.listIconWrap}>
                  <Ionicons name="git-branch-outline" size={18} color={Brand.blueDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listRowTitle}>{s.class_id?.name} – {s.name}</Text>
                  <Text style={styles.listRowSub}>
                    {s.class_teacher_user_id
                      ? `Class Teacher: ${s.class_teacher_user_id.first_name} ${s.class_teacher_user_id.last_name}`
                      : 'No class teacher assigned'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: s.is_active ? Colors.successBg : Colors.errorBg }]}>
                  <Text style={[styles.statusText, { color: s.is_active ? Colors.success : Colors.error }]}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Periods Tab ───────────────────────────────────────────────────────────────
function PeriodsTab() {
  const [periods, setPeriods] = useState<PeriodDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [periodNumber, setPeriodNumber] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isBreak, setIsBreak] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/setup/periods');
      setPeriods(data.periods || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!name.trim() || !periodNumber.trim() || !startTime.trim() || !endTime.trim()) {
      Alert.alert('Required', 'Name, period number, start time and end time are required.');
      return;
    }
    setSaving(true);
    try {
      await API.post('/setup/periods', {
        name: name.trim(),
        period_number: Number(periodNumber),
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        is_break: isBreak,
      });
      setName('');
      setPeriodNumber('');
      setStartTime('');
      setEndTime('');
      setIsBreak(false);
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create period.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add New Period</Text>
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Period name (e.g. Period 1)"
              placeholderTextColor={Colors.placeholder}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Order #"
              placeholderTextColor={Colors.placeholder}
              value={periodNumber}
              onChangeText={setPeriodNumber}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Start (09:00)"
              placeholderTextColor={Colors.placeholder}
              value={startTime}
              onChangeText={setStartTime}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="End (09:45)"
              placeholderTextColor={Colors.placeholder}
              value={endTime}
              onChangeText={setEndTime}
            />
          </View>
          <TouchableOpacity style={styles.checkRow} onPress={() => setIsBreak(b => !b)} activeOpacity={0.7}>
            <View style={[styles.checkbox, isBreak && styles.checkboxActive]}>
              {isBreak && <Ionicons name="checkmark" size={13} color={Colors.card} />}
            </View>
            <Text style={styles.checkLabel}>This is a break period</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createBtn, saving && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={Colors.card} size="small" />
              : <><Ionicons name="add-circle-outline" size={16} color={Colors.card} /><Text style={styles.createBtnText}>Create Period</Text></>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.listHeader}>All Periods ({periods.length})</Text>
          {loading ? (
            <ActivityIndicator color={Brand.blueDark} style={{ marginVertical: 24 }} />
          ) : periods.length === 0 ? (
            <EmptyState icon="time-outline" text="No periods created yet." />
          ) : (
            periods.map((p, i) => (
              <View key={p._id} style={[styles.listRow, i < periods.length - 1 && styles.rowBorder]}>
                <View style={[styles.listIconWrap, p.is_break && { backgroundColor: Colors.warningBg }]}>
                  <Ionicons
                    name={p.is_break ? 'cafe-outline' : 'time-outline'}
                    size={18}
                    color={p.is_break ? Colors.warning : Brand.blueDark}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listRowTitle}>
                    {p.name} {p.is_break ? '(Break)' : ''}
                  </Text>
                  <Text style={styles.listRowSub}>{p.start_time} – {p.end_time}</Text>
                </View>
                <View style={[styles.numBadge]}>
                  <Text style={styles.numBadgeText}>#{p.period_number}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────
function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name={icon as any} size={36} color={Colors.placeholder} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 16, ...Shadow.subtle,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  rowInputs: { flexDirection: 'row', gap: 8 },
  input: {
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: Colors.textPrimary, marginBottom: 10,
  },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.background,
  },
  pillActive: { backgroundColor: Brand.blueLight, borderColor: Brand.blueDark },
  pillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  pillTextActive: { color: Brand.blueDark, fontWeight: '700' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: Colors.border, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: { backgroundColor: Brand.blueDark, borderColor: Brand.blueDark },
  checkLabel: { fontSize: 13, color: Colors.textPrimary },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Brand.blueDark, borderRadius: Radius.md, paddingVertical: 11,
  },
  createBtnText: { color: Colors.card, fontWeight: '700', fontSize: 13 },

  listCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadow.subtle,
  },
  listHeader: {
    fontSize: 13, fontWeight: '700', color: Colors.card,
    backgroundColor: Brand.blueDark, paddingHorizontal: 16, paddingVertical: 10,
  },
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  listIconWrap: {
    width: 38, height: 38, borderRadius: Radius.sm,
    backgroundColor: Brand.blueLight, justifyContent: 'center', alignItems: 'center',
  },
  listRowTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  listRowSub: { fontSize: 12, color: Colors.textSecondary },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  numBadge: {
    backgroundColor: Brand.blueLight, borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  numBadgeText: { fontSize: 12, fontWeight: '700', color: Brand.blueDark },
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});
