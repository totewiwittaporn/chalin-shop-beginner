import { create } from 'zustand';

export const ROLES = ['ADMIN', 'STAFF', 'CONSIGNMENT', 'QUOTE_VIEWER'];

function getInitialRole() {
  try {
    const url = new URL(window.location.href);
    const q = (url.searchParams.get('role') || '').toUpperCase();
    const ls = (localStorage.getItem('role') || '').toUpperCase();
    const r = q || ls || 'ADMIN';
    return ROLES.includes(r) ? r : 'ADMIN';
  } catch {
    return 'ADMIN';
  }
}

export const useAuthStore = create((set, get) => ({
  user: { id: 1, name: 'Demo User', role: getInitialRole(), branchId: 1 }, // mock
  setRole: (role) => {
    const r = (role || '').toUpperCase();
    if (!ROLES.includes(r)) return;
    localStorage.setItem('role', r);
    set((s) => ({ user: { ...s.user, role: r } }));
  },
  setUser: (user) => set({ user }),
}));
