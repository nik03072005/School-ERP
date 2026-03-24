import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { studentService, AdmissionFormData } from '@/src/api/studentService';
import { adminService } from '@/src/api/adminService';
import { Brand, Colors, Radius } from '@/constants/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  editable,
  multiline,
  keyboardType,
}: {
  label: string;
  value?: string | number;
  onChangeText?: (value: string) => void;
  editable: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, multiline && s.inputMulti, !editable && s.inputDisabled]}
        value={value === undefined || value === null ? '' : String(value)}
        onChangeText={onChangeText}
        editable={editable}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        placeholderTextColor={Colors.placeholder}
      />
    </View>
  );
}

function BoolField({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value?: boolean;
  editable: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <View style={s.boolRow}>
        <TouchableOpacity
          disabled={!editable}
          style={[s.boolOption, value === true && s.boolOptionActive, !editable && s.boolOptionReadOnly]}
          onPress={() => onChange?.(true)}
          activeOpacity={0.8}
        >
          <Text style={[s.boolText, value === true && s.boolTextActive]}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!editable}
          style={[s.boolOption, value === false && s.boolOptionActive, !editable && s.boolOptionReadOnly]}
          onPress={() => onChange?.(false)}
          activeOpacity={0.8}
        >
          <Text style={[s.boolText, value === false && s.boolTextActive]}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const RELATIONSHIP_OPTIONS = ['mother', 'father', 'other'];
const GENDER_OPTIONS = ['male', 'female', 'other'];

const normalizeText = (value?: string) => (value ?? '').trim();

export default function AdmissionFormScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { studentUserId } = useLocalSearchParams<{ studentUserId?: string }>();

  const isStudentViewer = Boolean(user?.role === 'student');
  const isAdminEditor = useMemo(
    () => Boolean(user?.role === 'admin' && studentUserId),
    [user?.role, studentUserId]
  );
  const canAccessAdmissionScreen = isStudentViewer || isAdminEditor;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentDocId, setStudentDocId] = useState<string | null>(null);
  const [admissionStatus, setAdmissionStatus] = useState<'not_submitted' | 'pending' | 'approved' | 'rejected'>('not_submitted');
  const [targetStudent, setTargetStudent] = useState<{ first_name?: string; last_name?: string; email?: string; mobile?: string } | null>(null);
  const [form, setForm] = useState<AdmissionFormData>({
    gender: '',
    date_of_birth: '',
    class_applying: '',
    blood_group: '',
    aadhar_number: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    previous_school: '',
    transport_required: false,
    pickup_drop_address: '',
    primary_guardian_name: '',
    primary_guardian_relationship: '',
    primary_guardian_phone: '',
    primary_guardian_email: '',
    primary_guardian_address: '',
    secondary_guardian_name: '',
    secondary_guardian_relationship: '',
    secondary_guardian_phone: '',
    secondary_guardian_email: '',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    has_allergies: false,
    allergies_list: '',
    has_medical_conditions: false,
    medical_conditions: '',
    physician_name: '',
    physician_phone: '',
    health_insurance_provider: '',
    policy_number: '',
    docs_birth_certificate: false,
    docs_vaccination_card: false,
    docs_aadhar_card: false,
    docs_address_proof: false,
    docs_photograph: false,
    docs_other: '',
  });

  const set = <K extends keyof AdmissionFormData>(key: K, value: AdmissionFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!canAccessAdmissionScreen) {
      setLoading(false);
      return;
    }

    const applyStudentData = (student: any) => {
      setStudentDocId(student?._id ?? null);
      setAdmissionStatus(student?.admission_status ?? 'not_submitted');
      setForm({
        gender: student?.gender ?? '',
        date_of_birth: student?.date_of_birth ?? '',
        class_applying: student?.class_applying ?? '',
        blood_group: student?.blood_group ?? '',
        aadhar_number: student?.aadhar_number ?? '',
        address: student?.address ?? '',
        city: student?.city ?? '',
        state: student?.state ?? '',
        zip_code: student?.zip_code ?? '',
        previous_school: student?.previous_school ?? '',
        transport_required: student?.transport_required ?? false,
        pickup_drop_address: student?.pickup_drop_address ?? '',
        primary_guardian_name: student?.primary_guardian_name ?? '',
        primary_guardian_relationship: student?.primary_guardian_relationship ?? '',
        primary_guardian_phone: student?.primary_guardian_phone ?? '',
        primary_guardian_email: student?.primary_guardian_email ?? '',
        primary_guardian_address: student?.primary_guardian_address ?? '',
        secondary_guardian_name: student?.secondary_guardian_name ?? '',
        secondary_guardian_relationship: student?.secondary_guardian_relationship ?? '',
        secondary_guardian_phone: student?.secondary_guardian_phone ?? '',
        secondary_guardian_email: student?.secondary_guardian_email ?? '',
        emergency_contact_name: student?.emergency_contact_name ?? '',
        emergency_contact_relationship: student?.emergency_contact_relationship ?? '',
        emergency_contact_phone: student?.emergency_contact_phone ?? '',
        has_allergies: student?.has_allergies ?? false,
        allergies_list: student?.allergies_list ?? '',
        has_medical_conditions: student?.has_medical_conditions ?? false,
        medical_conditions: student?.medical_conditions ?? '',
        physician_name: student?.physician_name ?? '',
        physician_phone: student?.physician_phone ?? '',
        health_insurance_provider: student?.health_insurance_provider ?? '',
        policy_number: student?.policy_number ?? '',
        docs_birth_certificate: student?.docs_birth_certificate ?? false,
        docs_vaccination_card: student?.docs_vaccination_card ?? false,
        docs_aadhar_card: student?.docs_aadhar_card ?? false,
        docs_address_proof: student?.docs_address_proof ?? false,
        docs_photograph: student?.docs_photograph ?? false,
        docs_other: student?.docs_other ?? '',
      });
    };

    (async () => {
      try {
        if (isAdminEditor && studentUserId) {
          const { student } = await adminService.getStudentAdmissionByUser(String(studentUserId));
          applyStudentData(student);
          setTargetStudent(student?.user_id ?? null);
        } else {
          const { student } = await studentService.getMyAdmission();
          applyStudentData(student);
          setTargetStudent(user ?? null);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? 'Could not load admission details.';
        Alert.alert('Error', msg, [{ text: 'OK', onPress: () => router.back() }]);
      } finally {
        setLoading(false);
      }
    })();
  }, [canAccessAdmissionScreen, isAdminEditor, router, studentUserId, user]);

  const saveAdmission = async () => {
    if (!isAdminEditor || !studentDocId) return;

    setSaving(true);
    try {
      await adminService.upsertStudentAdmission(studentDocId, {
        ...form,
        admission_status: 'approved',
      });
      setAdmissionStatus('approved');
      Alert.alert('Saved', 'Admission form saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not save admission form.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={Brand.blueDark} />
        </View>
      </SafeAreaView>
    );
  }

  if (!canAccessAdmissionScreen) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.textSecondary} />
          <Text style={s.readOnlyText}>Admission form is available for students only.</Text>
          <TouchableOpacity style={s.backBtnInline} onPress={() => router.replace('/(app)/' as any)}>
            <Text style={s.backBtnInlineText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusLabel = admissionStatus.replace('_', ' ').toUpperCase();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Brand.blueDark} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{isAdminEditor ? 'Student Admission Form' : 'Admission Details'}</Text>
          <Text style={s.headerSub}>
            {targetStudent?.first_name ?? ''} {targetStudent?.last_name ?? ''}
          </Text>
        </View>
        <View style={s.statusPill}>
          <Text style={s.statusText}>{statusLabel}</Text>
        </View>
      </View>

      {!isAdminEditor && (
        <View style={s.readOnlyBanner}>
          <Ionicons name="information-circle-outline" size={16} color={Brand.blueDark} />
          <Text style={s.readOnlyText}>Admission details are managed by admin. This page is read-only.</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Section title="STUDENT INFORMATION">
          <Field label="Full Name" value={`${targetStudent?.first_name ?? ''} ${targetStudent?.last_name ?? ''}`} editable={false} />
          <Field label="Email" value={targetStudent?.email ?? ''} editable={false} />
          <Field label="Mobile" value={targetStudent?.mobile ?? ''} editable={false} />
          <Field label="Date of Birth" value={form.date_of_birth} editable={isAdminEditor} onChangeText={(v) => set('date_of_birth', v)} />
          <Field label="Class Applying For" value={form.class_applying} editable={isAdminEditor} onChangeText={(v) => set('class_applying', v)} />
          <Field label="Blood Group" value={form.blood_group} editable={isAdminEditor} onChangeText={(v) => set('blood_group', v)} />
          <Field label="Aadhar Number" value={form.aadhar_number} editable={isAdminEditor} onChangeText={(v) => set('aadhar_number', v)} keyboardType="numeric" />
          <Field label="Address" value={form.address} editable={isAdminEditor} onChangeText={(v) => set('address', v)} multiline />
          <Field label="City" value={form.city} editable={isAdminEditor} onChangeText={(v) => set('city', v)} />
          <Field label="State" value={form.state} editable={isAdminEditor} onChangeText={(v) => set('state', v)} />
          <Field label="Zip Code" value={form.zip_code} editable={isAdminEditor} onChangeText={(v) => set('zip_code', v)} keyboardType="numeric" />
          <Field label="Previous School" value={form.previous_school} editable={isAdminEditor} onChangeText={(v) => set('previous_school', v)} />
          <Field label="Gender (male/female/other)" value={form.gender} editable={isAdminEditor} onChangeText={(v) => set('gender', normalizeText(v).toLowerCase())} />
          {isAdminEditor && !GENDER_OPTIONS.includes(normalizeText(form.gender).toLowerCase()) && normalizeText(form.gender) !== '' && (
            <Text style={s.warningText}>Use one of: male, female, other.</Text>
          )}
          <BoolField label="Transport Required" value={form.transport_required} editable={isAdminEditor} onChange={(v) => set('transport_required', v)} />
          <Field label="Pickup / Drop Address" value={form.pickup_drop_address} editable={isAdminEditor} onChangeText={(v) => set('pickup_drop_address', v)} multiline />
        </Section>

        <Section title="PRIMARY GUARDIAN">
          <Field label="Name" value={form.primary_guardian_name} editable={isAdminEditor} onChangeText={(v) => set('primary_guardian_name', v)} />
          <Field label="Relationship (mother/father/other)" value={form.primary_guardian_relationship} editable={isAdminEditor} onChangeText={(v) => set('primary_guardian_relationship', normalizeText(v).toLowerCase())} />
          {isAdminEditor && !RELATIONSHIP_OPTIONS.includes(normalizeText(form.primary_guardian_relationship).toLowerCase()) && normalizeText(form.primary_guardian_relationship) !== '' && (
            <Text style={s.warningText}>Use one of: mother, father, other.</Text>
          )}
          <Field label="Phone" value={form.primary_guardian_phone} editable={isAdminEditor} onChangeText={(v) => set('primary_guardian_phone', v)} keyboardType="phone-pad" />
          <Field label="Email" value={form.primary_guardian_email} editable={isAdminEditor} onChangeText={(v) => set('primary_guardian_email', v)} keyboardType="email-address" />
          <Field label="Address" value={form.primary_guardian_address} editable={isAdminEditor} onChangeText={(v) => set('primary_guardian_address', v)} multiline />
        </Section>

        <Section title="SECONDARY GUARDIAN">
          <Field label="Name" value={form.secondary_guardian_name} editable={isAdminEditor} onChangeText={(v) => set('secondary_guardian_name', v)} />
          <Field label="Relationship (mother/father/other)" value={form.secondary_guardian_relationship} editable={isAdminEditor} onChangeText={(v) => set('secondary_guardian_relationship', normalizeText(v).toLowerCase())} />
          {isAdminEditor && !RELATIONSHIP_OPTIONS.includes(normalizeText(form.secondary_guardian_relationship).toLowerCase()) && normalizeText(form.secondary_guardian_relationship) !== '' && (
            <Text style={s.warningText}>Use one of: mother, father, other.</Text>
          )}
          <Field label="Phone" value={form.secondary_guardian_phone} editable={isAdminEditor} onChangeText={(v) => set('secondary_guardian_phone', v)} keyboardType="phone-pad" />
          <Field label="Email" value={form.secondary_guardian_email} editable={isAdminEditor} onChangeText={(v) => set('secondary_guardian_email', v)} keyboardType="email-address" />
        </Section>

        <Section title="EMERGENCY CONTACT">
          <Field label="Name" value={form.emergency_contact_name} editable={isAdminEditor} onChangeText={(v) => set('emergency_contact_name', v)} />
          <Field label="Relationship" value={form.emergency_contact_relationship} editable={isAdminEditor} onChangeText={(v) => set('emergency_contact_relationship', v)} />
          <Field label="Phone" value={form.emergency_contact_phone} editable={isAdminEditor} onChangeText={(v) => set('emergency_contact_phone', v)} keyboardType="phone-pad" />
        </Section>

        <Section title="MEDICAL INFORMATION">
          <BoolField label="Has Allergies" value={form.has_allergies} editable={isAdminEditor} onChange={(v) => set('has_allergies', v)} />
          <Field label="Allergy Details" value={form.allergies_list} editable={isAdminEditor} onChangeText={(v) => set('allergies_list', v)} multiline />
          <BoolField label="Has Medical Conditions" value={form.has_medical_conditions} editable={isAdminEditor} onChange={(v) => set('has_medical_conditions', v)} />
          <Field label="Condition Details" value={form.medical_conditions} editable={isAdminEditor} onChangeText={(v) => set('medical_conditions', v)} multiline />
          <Field label="Physician Name" value={form.physician_name} editable={isAdminEditor} onChangeText={(v) => set('physician_name', v)} />
          <Field label="Physician Phone" value={form.physician_phone} editable={isAdminEditor} onChangeText={(v) => set('physician_phone', v)} keyboardType="phone-pad" />
          <Field label="Insurance Provider" value={form.health_insurance_provider} editable={isAdminEditor} onChangeText={(v) => set('health_insurance_provider', v)} />
          <Field label="Policy Number" value={form.policy_number} editable={isAdminEditor} onChangeText={(v) => set('policy_number', v)} />
        </Section>

        <Section title="DOCUMENTS">
          <BoolField label="Birth Certificate" value={form.docs_birth_certificate} editable={isAdminEditor} onChange={(v) => set('docs_birth_certificate', v)} />
          <BoolField label="Vaccination Card" value={form.docs_vaccination_card} editable={isAdminEditor} onChange={(v) => set('docs_vaccination_card', v)} />
          <BoolField label="Aadhar Card" value={form.docs_aadhar_card} editable={isAdminEditor} onChange={(v) => set('docs_aadhar_card', v)} />
          <BoolField label="Address Proof" value={form.docs_address_proof} editable={isAdminEditor} onChange={(v) => set('docs_address_proof', v)} />
          <BoolField label="Photograph" value={form.docs_photograph} editable={isAdminEditor} onChange={(v) => set('docs_photograph', v)} />
          <Field label="Other Documents" value={form.docs_other} editable={isAdminEditor} onChangeText={(v) => set('docs_other', v)} multiline />
        </Section>

        {isAdminEditor && (
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.7 }]}
            onPress={saveAdmission}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="save-outline" size={18} color="#fff" />}
            <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save Admission Form'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Brand.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary },
  statusPill: {
    borderRadius: Radius.full,
    backgroundColor: Brand.blueLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: { fontSize: 10, color: Brand.blueDark, fontWeight: '700', letterSpacing: 0.4 },

  readOnlyBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.blueLight,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyText: { flex: 1, fontSize: 12, color: Colors.textPrimary },

  backBtnInline: {
    marginTop: 8,
    backgroundColor: Brand.blueDark,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtnInlineText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  section: {
    marginTop: 12,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Brand.blueDark,
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  fieldWrap: { marginBottom: 9 },
  label: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginBottom: 5 },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  inputDisabled: { backgroundColor: '#F5F7FB' },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },

  boolRow: { flexDirection: 'row', gap: 8 },
  boolOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  boolOptionActive: { borderColor: Brand.blueDark, backgroundColor: Brand.blueLight },
  boolOptionReadOnly: { opacity: 0.95 },
  boolText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  boolTextActive: { color: Brand.blueDark },

  warningText: { marginTop: -4, marginBottom: 6, color: Colors.error, fontSize: 11, fontWeight: '600' },

  saveBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.blueDark,
    borderRadius: Radius.md,
    paddingVertical: 13,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
