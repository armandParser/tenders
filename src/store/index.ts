import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface State {
    hiddenTenders: Set<string>;
    savedTenders: Set<string>;
    readTenders: Set<string>;
    addHiddenTender: (tender: string) => void;
    removeHiddenTender: (tender: string) => void;
    addSavedTender: (tender: string) => void;
    removeSavedTender: (tender: string) => void;
    addReadTender: (tender: string) => void;
}

export const useStore = create<State>()(
    persist(
        (set) => ({
            readTenders: new Set(),
            hiddenTenders: new Set(),
            savedTenders: new Set(),
            addHiddenTender: (tender: string) => set((state: State) => ({ hiddenTenders: new Set(state.hiddenTenders).add(tender) })),
            removeHiddenTender: (tender: string) => set((state: State) => {
                const newSet = new Set(state.hiddenTenders);
                newSet.delete(tender);
                return { hiddenTenders: newSet };
            }),
            addSavedTender: (tender: string) => set((state: State) => ({ savedTenders: new Set(state.savedTenders).add(tender) })),
            removeSavedTender: (tender: string) => set((state: State) => {
                const newSet = new Set(state.savedTenders);
                newSet.delete(tender);
                return { savedTenders: newSet };
            }),
            addReadTender: (tender: string) => set((state: State) => ({ readTenders: new Set(state.readTenders).add(tender) })),
        }),
        {
            name: 'storage-tenders',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                hiddenTenders: Array.from(state.hiddenTenders),
                savedTenders: Array.from(state.savedTenders),
                readTenders: Array.from(state.readTenders),
            }),
            merge: (persistedState: any, currentState: State) => {
                return {
                    ...currentState,
                    hiddenTenders: new Set(persistedState.hiddenTenders || []),
                    savedTenders: new Set(persistedState.savedTenders || []),
                    readTenders: new Set(persistedState.readTenders || []),
                };
            },
        },
    ),
)