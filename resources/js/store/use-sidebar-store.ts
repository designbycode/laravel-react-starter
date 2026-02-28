import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SidebarStore {
    isOpen: boolean;
    toggle: () => void;
    setOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>()(
    persist(
        (set, get) => ({
            isOpen: true,
            toggle: () => set({ isOpen: !get().isOpen }),
            setOpen: (open: boolean) => set({ isOpen: open }),
        }),
        {
            name: 'sidebar-storage',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
