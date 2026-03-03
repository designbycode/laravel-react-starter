import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Store per-page preferences per route path. The key is a route pathname
// without query string. Value is the selected per_page number.
interface PaginationPrefsState {
    perPageByPath: Record<string, number>;
    // Get per-page for a given path, falling back to defaultValue if not set
    getPerPage: (path: string, defaultValue?: number) => number;
    // Set per-page for a given path
    setPerPage: (path: string, perPage: number) => void;
    // Clear a specific path preference
    clearPerPage: (path: string) => void;
}

export const usePaginationStore = create<PaginationPrefsState>()(
    persist(
        (set, get) => ({
            perPageByPath: {},
            getPerPage: (path: string, defaultValue = 25) => {
                const key = normalizePath(path);
                const v = get().perPageByPath[key];
                return typeof v === 'number' && v > 0 ? v : defaultValue;
            },
            setPerPage: (path: string, perPage: number) =>
                set((state) => ({
                    perPageByPath: {
                        ...state.perPageByPath,
                        [normalizePath(path)]: perPage,
                    },
                })),
            clearPerPage: (path: string) =>
                set((state) => {
                    const key = normalizePath(path);
                    const next = { ...state.perPageByPath };
                    delete next[key];
                    return { perPageByPath: next };
                }),
        }),
        {
            name: 'pagination-prefs-storage',
            storage: createJSONStorage(() => localStorage),
            // Versioning/migration can be added if shape changes later
        },
    ),
);

function normalizePath(path: string): string {
    try {
        // If a full URL is given, strip query string and hash.
        const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        return url.pathname.replace(/\/$/, '') || '/';
    } catch {
        // If not a full URL, treat it as a path and just strip trailing slash.
        return (path.split('?')[0] || '/').replace(/\/$/, '') || '/';
    }
}
