import { ipcRenderer } from "electron";
import { create } from "zustand";
import {
  StateStorage,
  createJSONStorage,
  devtools,
  persist,
} from "zustand/middleware";

export type UpdateStore = {
  update: { age: "old" | "new"; description: string };
  setUpdate: (update: { age: "old" | "new"; description: string }) => void;
};

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await ipcRenderer.invoke("storage:get", name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await ipcRenderer.invoke("storage:set", name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await ipcRenderer.invoke("storage:delete", name);
  },
};

export const useUpdateStore = create<UpdateStore>()(
  devtools(
    persist(
      (set) => ({
        update: {
          age: "new",
          description:
            "Added informative messages about the update status and a button for manual installation of the downloaded version. Added panel with logs up to the last update",
        },
        setUpdate: (update: { age: "old" | "new"; description: string }) =>
          set({ update: { age: update.age, description: update.description } }),
      }),
      {
        name: "update-storage",
        storage: createJSONStorage(() => storage),
      }
    )
  )
);