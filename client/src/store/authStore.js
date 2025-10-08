import { create } from 'zustand';


export const useAuthStore = create((set) => ({
user: { id: 1, name: 'Admin', role: 'ADMIN' }, // mock
token: null,
setToken: (t) => set({ token: t }),
}));