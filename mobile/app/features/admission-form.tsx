import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { studentService, AdmissionFormData } from '@/src/api/studentService';
import { Brand, Colors, Radius } from '@/constants/theme';

// ─── Reusable primitives ──────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{children}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  editable = true,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  editable?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, !editable && s.inputDisabled, multiline && s.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor={Colors.placeholder}
        keyboardType={keyboardType ?? 'default'}
        editable={editable}
        multiline={multiline}
      />
    </View>
  );
}

function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <View style={s.radioRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={s.radioOption}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
          >
            <View style={[s.radioCircle, value === opt.value && s.radioCircleActive]}>
              {value === opt.value && <View style={s.radioDot} />}
            </View>
            <Text style={s.radioLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function Checkbox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity style={s.checkRow} onPress={() => onChange(!value)} activeOpacity={0.7}>
      <View style={[s.checkBox, value && s.checkBoxActive]}>
        {value && <Ionicons name="checkmark" size={13} color="#fff" />}
      </View>
      <Text style={s.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function RowPair({ children }: { children: React.ReactNode[] }) {
  return <View style={s.rowPair}>{children}</View>;
}

// ─── Step headers config ──────────────────────────────────────────────────────
const STEPS = [
  { label: 'Student\nInfo', icon: 'person-outline' },
  { label: 'Guardian\nInfo', icon: 'people-outline' },
  { label: 'Emergency\n& Medical', icon: 'medkit-outline' },
  { label: 'Documents\n& Submit', icon: 'documents-outline' },
] as const;

const GENDER_OPTS = [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }];
const REL_OPTS = [{ label: 'Mother', value: 'mother' }, { label: 'Father', value: 'father' }, { label: 'Other', value: 'other' }];
const BOOL_OPTS = [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }];

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AdmissionFormScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState<AdmissionFormData & Record<string, any>>({
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

  const set = (key: string) => (val: any) => setForm((f) => ({ ...f, [key]: val }));

  // Convert boolean to radio string and back
  const boolToStr = (b?: boolean) => (b ? 'yes' : 'no');
  const strToBool = (s: string) => s === 'yes';

  // Pre-load existing data (for resubmission after rejection)
  useEffect(() => {
    (async () => {
      try {
        const { student } = await studentService.getMyAdmission();
        if (student && student.admission_status !== 'not_submitted') {
          setForm((f) => ({
            ...f,
            gender: student.gender ?? '',
            date_of_birth: student.date_of_birth ?? '',
            class_applying: student.class_applying ?? '',
            blood_group: student.blood_group ?? '',
            aadhar_number: student.aadhar_number ?? '',
            address: student.address ?? '',
            city: student.city ?? '',
            state: student.state ?? '',
            zip_code: student.zip_code ?? '',
            previous_school: student.previous_school ?? '',
            transport_required: student.transport_required ?? false,
            pickup_drop_address: student.pickup_drop_address ?? '',
            primary_guardian_name: student.primary_guardian_name ?? '',
            primary_guardian_relationship: student.primary_guardian_relationship ?? '',
            primary_guardian_phone: student.primary_guardian_phone ?? '',
            primary_guardian_email: student.primary_guardian_email ?? '',
            primary_guardian_address: student.primary_guardian_address ?? '',
            secondary_guardian_name: student.secondary_guardian_name ?? '',
            secondary_guardian_relationship: student.secondary_guardian_relationship ?? '',
            secondary_guardian_phone: student.secondary_guardian_phone ?? '',
            secondary_guardian_email: student.secondary_guardian_email ?? '',
            emergency_contact_name: student.emergency_contact_name ?? '',
            emergency_contact_relationship: student.emergency_contact_relationship ?? '',
            emergency_contact_phone: student.emergency_contact_phone ?? '',
            has_allergies: student.has_allergies ?? false,
            allergies_list: student.allergies_list ?? '',
            has_medical_conditions: student.has_medical_conditions ?? false,
            medical_conditions: student.medical_conditions ?? '',
            physician_name: student.physician_name ?? '',
            physician_phone: student.physician_phone ?? '',
            health_insurance_provider: student.health_insurance_provider ?? '',
            policy_number: student.policy_number ?? '',
            docs_birth_certificate: student.docs_birth_certificate ?? false,
            docs_vaccination_card: student.docs_vaccination_card ?? false,
            docs_aadhar_card: student.docs_aadhar_card ?? false,
            docs_address_proof: student.docs_address_proof ?? false,
            docs_photograph: student.docs_photograph ?? false,
            docs_other: student.docs_other ?? '',
          }));
        }
      } catch {
        // Ignore — start with empty form
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    Alert.alert(
      'Submit Admission Form',
      'Please confirm all information is accurate before submitting.',
      [
        { text: 'Review Again', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              await studentService.submitAdmissionForm(form);
              await refreshUser();
              Alert.alert(
                'Submitted!',
                'Your admission form has been submitted. Please wait for admin approval.',
                [{ text: 'OK', onPress: () => router.replace('/(app)') }]
              );
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message ?? 'Could not submit. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
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

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Brand.blueDark} />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>Admission Form</Text>
            <Text style={s.headerSub}>Step {step + 1} of {STEPS.length}</Text>
          </View>
        </View>

        {/* Step indicator */}
        <View style={s.stepper}>
          {STEPS.map((st, i) => (
            <React.Fragment key={i}>
              <View style={s.stepItem}>
                <View style={[s.stepCircle, i <= step && s.stepCircleActive]}>
                  {i < step
                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                    : <Ionicons name={st.icon as any} size={14} color={i === step ? '#fff' : Colors.placeholder} />
                  }
                </View>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[s.stepLine, i < step && s.stepLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── STEP 1: Student Information ─────────────────────────── */}
          {step === 0 && (
            <>
              <SectionTitle>STUDENT INFORMATION</SectionTitle>
              <Field label="Full Name" value={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`} editable={false} />
              <Field label="Email" value={user?.email ?? ''} editable={false} />
              <RowPair>
                <Field label="Date of Birth" value={form.date_of_birth ?? ''} onChangeText={set('date_of_birth')} placeholder="DD/MM/YYYY" />
                <Field label="Blood Group" value={form.blood_group ?? ''} onChangeText={set('blood_group')} placeholder="e.g. A+" />
              </RowPair>
              <RadioGroup label="Gender" options={GENDER_OPTS} value={form.gender ?? ''} onChange={set('gender')} />
              <Field label="Home Address" value={form.address ?? ''} onChangeText={set('address')} placeholder="Street address" multiline />
              <RowPair>
                <Field label="City" value={form.city ?? ''} onChangeText={set('city')} placeholder="City" />
                <Field label="State" value={form.state ?? ''} onChangeText={set('state')} placeholder="State" />
              </RowPair>
              <RowPair>
                <Field label="Zip Code" value={form.zip_code ?? ''} onChangeText={set('zip_code')} placeholder="Zip" keyboardType="numeric" />
                <Field label="Aadhar Number" value={form.aadhar_number ?? ''} onChangeText={set('aadhar_number')} placeholder="12-digit" keyboardType="numeric" />
              </RowPair>
              <Field label="Previous School (if any)" value={form.previous_school ?? ''} onChangeText={set('previous_school')} placeholder="School name" />
              <Field label="Class Applying For" value={form.class_applying ?? ''} onChangeText={set('class_applying')} placeholder="e.g. Nursery / Class 1" />
              <RadioGroup
                label="Transport Required"
                options={BOOL_OPTS}
                value={boolToStr(form.transport_required)}
                onChange={(v) => set('transport_required')(strToBool(v))}
              />
              {form.transport_required && (
                <Field label="Pickup / Drop Address" value={form.pickup_drop_address ?? ''} onChangeText={set('pickup_drop_address')} placeholder="Enter address if different" multiline />
              )}
            </>
          )}

          {/* ── STEP 2: Parent / Guardian Information ─────────────── */}
          {step === 1 && (
            <>
              <SectionTitle>PARENT / GUARDIAN INFORMATION</SectionTitle>
              <Text style={s.subSectionLabel}>Primary Guardian</Text>
              <Field label="Full Name" value={form.primary_guardian_name ?? ''} onChangeText={set('primary_guardian_name')} placeholder="Guardian's full name" />
              <RadioGroup label="Relationship to Student" options={REL_OPTS} value={form.primary_guardian_relationship ?? ''} onChange={set('primary_guardian_relationship')} />
              <RowPair>
                <Field label="Phone Number" value={form.primary_guardian_phone ?? ''} onChangeText={set('primary_guardian_phone')} placeholder="Mobile" keyboardType="phone-pad" />
                <Field label="Email Address" value={form.primary_guardian_email ?? ''} onChangeText={set('primary_guardian_email')} placeholder="Email" keyboardType="email-address" />
              </RowPair>
              <Field label="Address (if different from student)" value={form.primary_guardian_address ?? ''} onChangeText={set('primary_guardian_address')} placeholder="Leave blank if same" multiline />

              <View style={s.divider} />
              <Text style={s.subSectionLabel}>Secondary Guardian (optional)</Text>
              <Field label="Full Name" value={form.secondary_guardian_name ?? ''} onChangeText={set('secondary_guardian_name')} placeholder="Guardian's full name" />
              <RadioGroup label="Relationship to Student" options={REL_OPTS} value={form.secondary_guardian_relationship ?? ''} onChange={set('secondary_guardian_relationship')} />
              <RowPair>
                <Field label="Phone Number" value={form.secondary_guardian_phone ?? ''} onChangeText={set('secondary_guardian_phone')} placeholder="Mobile" keyboardType="phone-pad" />
                <Field label="Email Address" value={form.secondary_guardian_email ?? ''} onChangeText={set('secondary_guardian_email')} placeholder="Email" keyboardType="email-address" />
              </RowPair>
            </>
          )}

          {/* ── STEP 3: Emergency Contact & Medical ───────────────── */}
          {step === 2 && (
            <>
              <SectionTitle>EMERGENCY CONTACT</SectionTitle>
              <Field label="Contact Name" value={form.emergency_contact_name ?? ''} onChangeText={set('emergency_contact_name')} placeholder="Full name" />
              <RowPair>
                <Field label="Relationship" value={form.emergency_contact_relationship ?? ''} onChangeText={set('emergency_contact_relationship')} placeholder="e.g. Uncle" />
                <Field label="Phone Number" value={form.emergency_contact_phone ?? ''} onChangeText={set('emergency_contact_phone')} placeholder="Mobile" keyboardType="phone-pad" />
              </RowPair>

              <SectionTitle>MEDICAL INFORMATION</SectionTitle>
              <RadioGroup
                label="Does the student have any allergies?"
                options={BOOL_OPTS}
                value={boolToStr(form.has_allergies)}
                onChange={(v) => set('has_allergies')(strToBool(v))}
              />
              {form.has_allergies && (
                <Field label="If yes, please list" value={form.allergies_list ?? ''} onChangeText={set('allergies_list')} placeholder="List all allergies" multiline />
              )}
              <RadioGroup
                label="Does the student have any medical conditions?"
                options={BOOL_OPTS}
                value={boolToStr(form.has_medical_conditions)}
                onChange={(v) => set('has_medical_conditions')(strToBool(v))}
              />
              {form.has_medical_conditions && (
                <Field label="If yes, please specify" value={form.medical_conditions ?? ''} onChangeText={set('medical_conditions')} placeholder="Describe conditions" multiline />
              )}
              <RowPair>
                <Field label="Primary Physician" value={form.physician_name ?? ''} onChangeText={set('physician_name')} placeholder="Doctor's name" />
                <Field label="Physician Phone" value={form.physician_phone ?? ''} onChangeText={set('physician_phone')} placeholder="Phone" keyboardType="phone-pad" />
              </RowPair>
              <RowPair>
                <Field label="Health Insurance Provider" value={form.health_insurance_provider ?? ''} onChangeText={set('health_insurance_provider')} placeholder="Provider name" />
                <Field label="Policy Number" value={form.policy_number ?? ''} onChangeText={set('policy_number')} placeholder="Policy #" />
              </RowPair>
            </>
          )}

          {/* ── STEP 4: Documents & Submit ────────────────────────── */}
          {step === 3 && (
            <>
              <SectionTitle>DOCUMENTS SUBMITTED (ATTACH PHOTOCOPIES)</SectionTitle>
              <Checkbox label="Birth Certificate" value={form.docs_birth_certificate ?? false} onChange={set('docs_birth_certificate')} />
              <Checkbox label="Vaccination Card" value={form.docs_vaccination_card ?? false} onChange={set('docs_vaccination_card')} />
              <Checkbox label="Aadhar Card (Child & Parents – Self Attested)" value={form.docs_aadhar_card ?? false} onChange={set('docs_aadhar_card')} />
              <Checkbox label="Address Proof" value={form.docs_address_proof ?? false} onChange={set('docs_address_proof')} />
              <Checkbox label="2 Photographs (Child & Parents)" value={form.docs_photograph ?? false} onChange={set('docs_photograph')} />
              <Field label="Other Documents (if any)" value={form.docs_other ?? ''} onChangeText={set('docs_other')} placeholder="Specify other documents" />

              <SectionTitle>DECLARATION</SectionTitle>
              <View style={s.declarationBox}>
                <Ionicons name="information-circle-outline" size={16} color={Brand.blueDark} />
                <Text style={s.declarationText}>
                  By submitting this form, I certify that all the above information is correct to the best of my knowledge. I give permission for my child to receive emergency medical treatment if necessary. I understand that submitting this form does not guarantee admission; the school will review applications and notify parents accordingly.
                </Text>
              </View>
            </>
          )}

          {/* ── Navigation buttons ─────────────────────────────────── */}
          <View style={s.navRow}>
            {step > 0 && (
              <TouchableOpacity style={s.btnSecondary} onPress={() => setStep((p) => p - 1)}>
                <Ionicons name="arrow-back" size={16} color={Brand.blueDark} />
                <Text style={s.btnSecondaryText}>Back</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            {step < STEPS.length - 1 ? (
              <TouchableOpacity style={s.btnPrimary} onPress={() => setStep((p) => p + 1)}>
                <Text style={s.btnPrimaryText}>Next</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.btnPrimary, s.btnSubmit, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Ionicons name="send-outline" size={16} color="#fff" />
                }
                <Text style={s.btnPrimaryText}>{submitting ? 'Submitting…' : 'Submit Form'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 4 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Brand.blueLight,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  stepItem: { alignItems: 'center' },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  stepCircleActive: { backgroundColor: Brand.blueDark },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border },
  stepLineActive: { backgroundColor: Brand.blueDark },

  // Section
  sectionHeader: {
    marginTop: 16,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Brand.blueDark,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Brand.blueDark,
    letterSpacing: 0.5,
  },
  subSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 2,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },

  // Field
  fieldWrap: { marginTop: 10 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  inputDisabled: { backgroundColor: Colors.border, color: Colors.textSecondary },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },

  // Row pair
  rowPair: { flexDirection: 'row', gap: 10 },

  // Radio
  radioRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  radioCircle: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioCircleActive: { borderColor: Brand.blueDark },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.blueDark },
  radioLabel: { fontSize: 13, color: Colors.textPrimary },

  // Checkbox
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  checkBox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  checkBoxActive: { backgroundColor: Brand.blueDark, borderColor: Brand.blueDark },
  checkLabel: { flex: 1, fontSize: 13, color: Colors.textPrimary, lineHeight: 18 },

  // Declaration
  declarationBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Brand.blueLight,
    borderRadius: Radius.md,
    padding: 14,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  declarationText: {
    flex: 1, fontSize: 12, color: Colors.textPrimary,
    lineHeight: 18,
  },

  // Nav buttons
  navRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Brand.blueDark,
  },
  btnSecondaryText: { fontSize: 14, fontWeight: '700', color: Brand.blueDark },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Brand.blueDark,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: Radius.md,
  },
  btnSubmit: { backgroundColor: Colors.success },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
