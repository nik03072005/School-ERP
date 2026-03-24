import API from './api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AdminUser {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  role_id?: { name: string };
  createdAt: string;
}

export interface StudentAdmission {
  _id: string;
  user_id: AdminUser;
  admission_status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  admission_submitted_at?: string;
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

export interface GetUsersResponse {
  count: number;
  users: AdminUser[];
}

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  mobile?: string;
  role: 'student' | 'teaching_staff' | 'non_teaching_staff' | 'admin';
}

export interface AdmissionFormPayload {
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
  admission_status?: 'not_submitted' | 'pending' | 'approved' | 'rejected';
}

// ─── Admin Service ────────────────────────────────────────────────────────────
export const adminService = {
  // ── User account management ──────────────────────────────────────
  getPendingUsers: async (): Promise<GetUsersResponse> => {
    const res = await API.get('/admin/users/pending');
    return res.data;
  },

  getAllUsers: async (params?: { role?: string; status?: string }): Promise<GetUsersResponse> => {
    const res = await API.get('/admin/users', { params });
    return res.data;
  },

  createUser: async (payload: CreateUserPayload): Promise<{ message: string; user: AdminUser }> => {
    const res = await API.post('/admin/users', payload);
    return res.data;
  },

  approveUser: async (id: string): Promise<{ message: string }> => {
    const res = await API.patch(`/admin/users/${id}/approve`);
    return res.data;
  },

  rejectUser: async (id: string): Promise<{ message: string }> => {
    const res = await API.patch(`/admin/users/${id}/reject`);
    return res.data;
  },

  activateUser: async (id: string): Promise<{ message: string }> => {
    const res = await API.patch(`/admin/users/${id}/activate`);
    return res.data;
  },

  deactivateUser: async (id: string): Promise<{ message: string }> => {
    const res = await API.patch(`/admin/users/${id}/deactivate`);
    return res.data;
  },

  // ── Admission management ──────────────────────────────────────────
  getPendingAdmissions: async (): Promise<{ count: number; students: StudentAdmission[] }> => {
    const res = await API.get('/admin/admissions/pending');
    return res.data;
  },

  getStudentAdmission: async (studentId: string): Promise<{ student: StudentAdmission }> => {
    const res = await API.get(`/admin/admissions/${studentId}`);
    return res.data;
  },

  getStudentAdmissionByUser: async (userId: string): Promise<{ student: StudentAdmission }> => {
    const res = await API.get(`/admin/admissions/by-user/${userId}`);
    return res.data;
  },

  upsertStudentAdmission: async (
    studentId: string,
    payload: AdmissionFormPayload
  ): Promise<{ message: string; student: StudentAdmission }> => {
    const res = await API.put(`/admin/admissions/${studentId}`, payload);
    return res.data;
  },

  approveAdmission: async (studentId: string): Promise<{ message: string }> => {
    const res = await API.patch(`/admin/admissions/${studentId}/approve`);
    return res.data;
  },

  rejectAdmission: async (studentId: string): Promise<{ message: string }> => {
    const res = await API.patch(`/admin/admissions/${studentId}/reject`);
    return res.data;
  },
};
