import { useMemo } from 'react';
import { useStore } from '../../../store';

export const useIsDarkMode = () => useStore((state) => state.isDarkMode);
export const useUIState = () => {
  const state = useStore();
  return useMemo(() => ({
    isSidebarOpen: state.isSidebarOpen,
    isModalOpen: state.isModalOpen,
    modalContent: state.modalContent,
  }), [state.isSidebarOpen, state.isModalOpen, state.modalContent]);
};

export const useUIActions = () => {
  const state = useStore();
  return useMemo(() => ({
    toggleDarkMode: state.toggleDarkMode,
    toggleSidebar: state.toggleSidebar,
    openModal: state.openModal,
    closeModal: state.closeModal,
  }), [state]);
}; 