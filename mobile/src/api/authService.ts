import API from './api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  mobile?: string;
  role: 'student' | 'teaching_staff' | 'non_teaching_staff';
}

// ─── Auth Service ─────────────────────────────────────────────────────────────
export const authService = {
  login: async (payload: LoginPayload) => {
    const res = await API.post('/auth/login', payload);
    return res.data; // { token, user }
  },

  register: async (payload: RegisterPayload) => {
    const res = await API.post('/auth/register', payload);
    return res.data; // { message }
  },

  getMe: async (token: string) => {
    const res = await API.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // { user }
  },

  logout: async (token: string) => {
    const res = await API.post(
      '/auth/logout',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }) => {
    const res = await API.patch('/auth/change-password', payload);
    return res.data; // { message }
  },
};
