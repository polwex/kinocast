import { create } from "zustand";
import { UserProfile } from "../types/farcaster";
import { ReactNode } from "react";
import { castsByFid, linksByFid, linksByTargetFid } from "../fetch/hub";
import { id_login, logout, readProfile } from "../fetch/kinode";
type ModalOpts = {
  closable?: boolean;
  width?: string;
  height?: string;
};

interface HistoryStore {
  history: string[];
  navigate: (path: string) => void;
  reset: () => void;
}

export const useHistory = create<HistoryStore>((set, get) => ({
  history: [window.location.pathname],
  navigate: (path) =>
    set((state) => {
      const history = [path, ...state.history];
      return { history };
    }),
  reset: () => set({ history: [] }),
}));

export interface GlobalState {
  // ui
  modal: { node: ReactNode; opts: ModalOpts | undefined } | null;
  setModal: (node: ReactNode | null, opts?: ModalOpts) => void;
  unsetModal: () => void;
  followers: number[];
  following: number[];
  mutate: (g: GlobalState) => void;
  sync: () => Promise<void>;
  //
  init: () => Promise<void>;
  login: (fid: number) => Promise<void>;
  logout: () => Promise<void>;
  prof: UserProfile | null;
}
const useGlobalState = create<GlobalState>((set, get) => ({
  sync: async () => {
    let fid = get().prof!.fid;
    let fols = await linksByFid(fid);
    let fows = await linksByTargetFid(fid);
    const following = fols.messages.map((f: any) => f.data.linkBody.targetFid);
    const followers = fows.messages.map((f: any) => f.data.fid);
    set({ followers, following });
  },
  mutate: (g) => {
    set(g);
  },
  following: [],
  followers: [],
  // ui
  modal: null,
  setModal: (node, opts?: ModalOpts) => set({ modal: { node, opts } }),
  unsetModal: () => set({ modal: null }),
  //
  init: async () => {
    // await debug()
    const prof = await readProfile();
    console.log(prof, "prof");
    if ("ok" in prof) set({ prof: prof.ok.profile });
  },
  login: async (fid) => {
    const prof = await id_login(fid.toString());
    set({ prof });
  },
  logout: async () => {
    const res = await logout();
    set({ prof: null });
  },
  prof: null,
}));

export default useGlobalState;
