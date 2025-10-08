import { create } from 'zustand';

const initialUsers = [
  { id: 1, name: 'Admin',       email: 'admin@example.com',    role: 'ADMIN',       branchId: 1, active: true },
  { id: 2, name: 'Staff ชลิน',  email: 'staff1@example.com',   role: 'STAFF',       branchId: 2, active: true },
  { id: 3, name: 'Consign ทีม', email: 'consign@example.com',  role: 'CONSIGNMENT', branchId: null, active: true },
  { id: 4, name: 'Quote View',  email: 'quote@example.com',    role: 'QUOTE_VIEWER',branchId: null, active: true },
];

export const useUserStore = create((set, get) => ({
  users: initialUsers,

  updateUser: (id, patch) =>
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    })),

  deleteUser: (id) =>
    set((s) => ({
      users: s.users.filter((u) => u.id !== id),
    })),
}));
