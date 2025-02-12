import { StateCreator } from 'zustand';
import { StoreState } from '../types';

export interface UISlice {
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
}

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set) => ({
  isDarkMode: false,
  isSidebarOpen: false,
  isModalOpen: false,
  modalContent: null,

  toggleDarkMode: () => {
    set((state) => {
      const isDarkMode = !state.isDarkMode;
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { isDarkMode };
    });
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  openModal: (content: React.ReactNode) => {
    set({ isModalOpen: true, modalContent: content });
  },

  closeModal: () => {
    set({ isModalOpen: false, modalContent: null });
  },
});
