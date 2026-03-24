import API from './api';

export interface AdmissionFormData {
  gender?: string;
  date_of_birth?: string;
  class_applying?: string;
  blood_group?: string;
  aadhar_number?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  previous_school?: string;
  transport_required?: boolean;
  pickup_drop_address?: string;
  primary_guardian_name?: string;
  primary_guardian_relationship?: string;
  primary_guardian_phone?: string;
  primary_guardian_email?: string;
  primary_guardian_address?: string;
  secondary_guardian_name?: string;
  secondary_guardian_relationship?: string;
  secondary_guardian_phone?: string;
  secondary_guardian_email?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  has_allergies?: boolean;
  allergies_list?: string;
  has_medical_conditions?: boolean;
  medical_conditions?: string;
  physician_name?: string;
  physician_phone?: string;
  health_insurance_provider?: string;
  policy_number?: string;
  docs_birth_certificate?: boolean;
  docs_vaccination_card?: boolean;
  docs_aadhar_card?: boolean;
  docs_address_proof?: boolean;
  docs_photograph?: boolean;
  docs_other?: string;
}

export const studentService = {
  getMyAdmission: async (): Promise<{ student: any }> => {
    const res = await API.get('/student/admission');
    return res.data;
  },
};
