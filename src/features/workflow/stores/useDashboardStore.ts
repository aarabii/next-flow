import { create } from "zustand";
import { DashboardState } from "../types/store.type";

export const useDashboardStore = create<DashboardState>((set) => ({
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  uploadingIds: {},
  setUploadingId: (id, uploading) =>
    set((state) => ({
      uploadingIds: { ...state.uploadingIds, [id]: uploading },
    })),
}));
