import API from './api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

// ─── Auth Service ─────────────────────────────────────────────────────────────
export const authService = {
  login: async (payload: LoginPayload) => {
    const res = await API.post('/auth/login', payload);
    return res.data; // { token, user }
  },

  forgotPassword: async (payload: { email: string; newPassword: string }) => {
    const res = await API.post('/auth/forgot-password', payload);
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
