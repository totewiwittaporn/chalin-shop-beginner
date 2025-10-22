// client/src/store/ui/sidebarStore.js
import { create } from "zustand";

export const useSidebarStore = create((set, get) => ({
  // Desktop/Tablet rail + panel
  railWidth: 72,       // ลดขนาดตามข้อ 3
  panelWidth: 260,
  openGroupId: null,
  setOpenGroup: (id) => set({ openGroupId: id }),
  toggleGroup: (id) =>
    set((s) => ({ openGroupId: s.openGroupId === id ? null : id })),
  closePanel: () => set({ openGroupId: null }),
  getContentOffset: () => {
    const { railWidth, panelWidth, openGroupId } = get();
    return railWidth + (openGroupId ? panelWidth : 0);
  },

  // Mobile Drawer
  mobileOpen: false,
  openMobile: () => set({ mobileOpen: true }),
  closeMobile: () => set({ mobileOpen: false }),
  toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
}));
