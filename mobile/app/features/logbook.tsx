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
  FlatList,
  Image,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import API from '@/src/api/api';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

interface Section { _id: string; name: string; class_id: { _id: string; name: string } }
interface Entry {
  _id: string; subject: string; date: string; status: string;
  classwork?: { text?: string; media?: { url: string; type: string }[] };
  homework?: { text?: string; media?: { url: string; type: string }[] };
  teacher_id?: { first_name: string; last_name: string };
  class_id?: { name: string }; section_id?: { name: string };
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

export default function LogbookScreen() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teaching_staff' || user?.role === 'admin';
  return isTeacher ? <TeacherLogbook /> : <StudentLogbook />;
}

// ─── Teacher Logbook ───────────────────────────────────────────────────────────
function TeacherLogbook() {
  const router = useRouter();
  const [tab, setTab] = useState<'create' | 'entries'>('create');
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  // Form state
  const [sectionId, setSectionId] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(todayISO());
  const [classworkText, setClassworkText] = useState('');
  const [homeworkText, setHomeworkText] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [saving, setSaving] = useState(false);

  // Entries state
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

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

  const loadEntries = useCallback(async () => {
    setEntriesLoading(true);
    try {
      const { data } = await API.get('/logbook/mine', { params: { limit: 30 } });
      setEntries(data.entries || []);
    } catch {
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => { if (tab === 'entries') loadEntries(); }, [tab, loadEntries]);

  const selectedSection = sections.find(s => s._id === sectionId);

  const handleSubmit = async () => {
    if (!sectionId || !subject.trim() || !date) {
      Alert.alert('Required', 'Please fill in section, subject, and date.');
      return;
    }
    if (!classworkText.trim() && !homeworkText.trim()) {
      Alert.alert('Required', 'Please add at least classwork or homework content.');
      return;
    }
    setSaving(true);
    try {
      await API.post('/logbook', {
        class_id: selectedSection?.class_id._id,
        section_id: sectionId,
        subject: subject.trim(),
        date,
        classwork: { text: classworkText.trim(), media: [] },
        homework: { text: homeworkText.trim(), media: [] },
        status,
      });
      Alert.alert('Success', status === 'published' ? 'Logbook entry published.' : 'Entry saved as draft.');
      setSubject(''); setClassworkText(''); setHomeworkText('');
      setTab('entries');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save logbook entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Daily Logbook</Text>
          <Text style={styles.headerSub}>Record classwork & homework</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['create', 'entries'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Ionicons
              name={t === 'create' ? 'create-outline' : 'book-outline'}
              size={15} color={tab === t ? Brand.blueDark : Colors.textSecondary}
            />
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'create' ? 'New Entry' : 'My Entries'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'create' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.form}>
            {sectionsLoading ? (
              <ActivityIndicator color={Brand.blueDark} />
            ) : (
              <>
                <Text style={styles.label}>Section *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  <View style={styles.pillRow}>
                    {sections.map(s => (
                      <TouchableOpacity
                        key={s._id}
                        style={[styles.pill, sectionId === s._id && styles.pillActive]}
                        onPress={() => setSectionId(s._id)}
                      >
                        <Text style={[styles.pillText, sectionId === s._id && styles.pillTextActive]}>
                          {s.class_id?.name} – {s.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={styles.label}>Subject *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mathematics, Science…"
                  placeholderTextColor={Colors.placeholder}
                  value={subject}
                  onChangeText={setSubject}
                />

                <Text style={styles.label}>Date *</Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity onPress={() => {
                    const d = new Date(date); d.setDate(d.getDate() - 1);
                    setDate(d.toISOString().slice(0, 10));
                  }} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={18} color={Brand.blueDark} />
                  </TouchableOpacity>
                  <Text style={styles.dateText}>{new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                  <TouchableOpacity onPress={() => {
                    const d = new Date(date); d.setDate(d.getDate() + 1);
                    const nd = d.toISOString().slice(0, 10);
                    if (nd <= todayISO()) setDate(nd);
                  }} style={styles.navBtn}>
                    <Ionicons name="chevron-forward" size={18} color={Brand.blueDark} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.label, { marginTop: 12 }]}>Classwork</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="What was covered in class today…"
                  placeholderTextColor={Colors.placeholder}
                  value={classworkText}
                  onChangeText={setClassworkText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Text style={styles.label}>Homework</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Assignment or homework given…"
                  placeholderTextColor={Colors.placeholder}
                  value={homeworkText}
                  onChangeText={setHomeworkText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Text style={styles.label}>Publish Status</Text>
                <View style={styles.pillRow}>
                  {(['published', 'draft'] as const).map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.pill, status === s && styles.pillActive]}
                      onPress={() => setStatus(s)}
                    >
                      <Ionicons
                        name={s === 'published' ? 'globe-outline' : 'document-outline'}
                        size={13} color={status === s ? Brand.blueDark : Colors.placeholder}
                      />
                      <Text style={[styles.pillText, status === s && styles.pillTextActive]}>
                        {s === 'published' ? 'Publish Now' : 'Save as Draft'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSubmit}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color={Colors.card} />
                    : <><Ionicons name="save-outline" size={17} color={Colors.card} /><Text style={styles.submitBtnText}>Save Entry</Text></>
                  }
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : entriesLoading ? (
        <View style={styles.center}><ActivityIndicator color={Brand.blueDark} /></View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.iconCircle}>
            <Ionicons name="book-outline" size={36} color={Brand.blueDark} />
          </View>
          <Text style={styles.emptyTitle}>No Entries Yet</Text>
          <Text style={styles.emptyText}>Your logbook entries will appear here after you create them.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setExpanded(expanded === item._id ? null : item._id)}
              style={styles.entryCard}
            >
              <View style={styles.entryHeader}>
                <View style={styles.entryMeta}>
                  <Text style={styles.entrySubject}>{item.subject}</Text>
                  <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
                </View>
                <View style={styles.entryRight}>
                  <View style={[styles.statusDot, { backgroundColor: item.status === 'published' ? Colors.success : Colors.warning }]} />
                  <Text style={styles.entryClass}>
                    {item.class_id?.name}{item.section_id ? ` · ${item.section_id.name}` : ''}
                  </Text>
                  <Ionicons name={expanded === item._id ? 'chevron-up' : 'chevron-down'} size={15} color={Colors.textSecondary} />
                </View>
              </View>
              {expanded === item._id && (
                <View style={styles.entryBody}>
                  {item.classwork?.text ? (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={styles.entrySection}>Classwork</Text>
                      <Text style={styles.entryContent}>{item.classwork.text}</Text>
                    </View>
                  ) : null}
                  {item.homework?.text ? (
                    <View>
                      <Text style={styles.entrySection}>Homework</Text>
                      <Text style={styles.entryContent}>{item.homework.text}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Student Logbook ───────────────────────────────────────────────────────────
function StudentLogbook() {
  const router = useRouter();
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sectionsLoading, setSectionsLoading] = useState(true);

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

  const loadEntries = useCallback(async () => {
    if (!sectionId) return;
    const sec = sections.find(s => s._id === sectionId);
    if (!sec) return;
    setLoading(true);
    try {
      const { data } = await API.get('/logbook', {
        params: { class_id: sec.class_id._id, section_id: sectionId, date },
      });
      setEntries(data.entries || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [sectionId, date, sections]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Daily Logbook</Text>
          <Text style={styles.headerSub}>Classwork & homework</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        {/* Date navigation */}
        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => {
            const d = new Date(date); d.setDate(d.getDate() - 1);
            setDate(d.toISOString().slice(0, 10));
          }} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={18} color={Brand.blueDark} />
          </TouchableOpacity>
          <Text style={styles.dateText}>{new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' })}</Text>
          <TouchableOpacity onPress={() => {
            const d = new Date(date); d.setDate(d.getDate() + 1);
            const nd = d.toISOString().slice(0, 10);
            if (nd <= todayISO()) setDate(nd);
          }} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={18} color={Brand.blueDark} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Brand.blueDark} style={{ marginTop: 40 }} />
        ) : entries.length === 0 ? (
          <View style={[styles.center, { paddingVertical: 48 }]}>
            <Ionicons name="book-outline" size={36} color={Colors.placeholder} />
            <Text style={[styles.emptyText, { marginTop: 12 }]}>No entries for this date.</Text>
          </View>
        ) : entries.map(item => (
          <TouchableOpacity
            key={item._id}
            activeOpacity={0.85}
            onPress={() => setExpanded(expanded === item._id ? null : item._id)}
            style={styles.entryCard}
          >
            <View style={styles.entryHeader}>
              <Text style={styles.entrySubject}>{item.subject}</Text>
              <View style={styles.entryRight}>
                <Text style={styles.entryTeacher}>
                  {item.teacher_id ? `${item.teacher_id.first_name} ${item.teacher_id.last_name}` : ''}
                </Text>
                <Ionicons name={expanded === item._id ? 'chevron-up' : 'chevron-down'} size={15} color={Colors.textSecondary} />
              </View>
            </View>
            {expanded === item._id && (
              <View style={styles.entryBody}>
                {item.classwork?.text ? (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={styles.entrySection}>Classwork</Text>
                    <Text style={styles.entryContent}>{item.classwork.text}</Text>
                  </View>
                ) : null}
                {item.homework?.text ? (
                  <View>
                    <Text style={styles.entrySection}>Homework</Text>
                    <Text style={styles.entryContent}>{item.homework.text}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  form: { padding: 16, gap: 4, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6, marginTop: 8 },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.background,
  },
  pillActive: { backgroundColor: Brand.blueLight, borderColor: Brand.blueDark },
  pillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  pillTextActive: { color: Brand.blueDark, fontWeight: '700' },
  input: {
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: Colors.textPrimary, marginBottom: 4,
  },
  textarea: { minHeight: 90 },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 4, height: 48, marginBottom: 4,
  },
  navBtn: { padding: 10 },
  dateText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Brand.blueDark, borderRadius: Radius.md,
    height: 52, marginTop: 16, ...Shadow.card,
  },
  submitBtnText: { color: Colors.card, fontSize: 16, fontWeight: '700' },
  entryCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 14, ...Shadow.subtle,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryMeta: { flex: 1 },
  entrySubject: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  entryDate: { fontSize: 11, color: Colors.placeholder, marginTop: 2 },
  entryRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  entryClass: { fontSize: 11, color: Colors.textSecondary },
  entryTeacher: { fontSize: 11, color: Colors.textSecondary },
  entryBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  entrySection: {
    fontSize: 10, fontWeight: '800', color: Brand.blueDark,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
  },
  entryContent: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Brand.blueLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, ...Shadow.card,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
});
