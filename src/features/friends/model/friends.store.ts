// src/features/friends/model/friends.store.ts
import { create } from 'zustand';
import { FriendsApi } from '../api/friends.api';
import { useAppStore } from '@/shared/lib/stores/app-store';

type State = {
  friends: any[];
  requests: {
    incoming: any[];
    outgoing: any[];
  };
  loading: boolean;
  error?: string;
};

type Actions = {
  fetchAll: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  respondRequest: (targetId: number, status: 'accepted' | 'rejected') => Promise<void>;
  cancelRequest: (id: number) => Promise<void>;
  search: (q: string) => Promise<any[]>;
  send: (uniqueId: string) => Promise<void>;
  remove: (uniqueId: string) => Promise<void>;
};

export const useFriendsStore = create<State & Actions>((set, get) => ({
  friends: [],
  requests: { incoming: [], outgoing: [] },
  loading: false,

  async fetchAll() {
    set({ loading: true, error: undefined });
    try {
      const [friendsRaw, requestsRaw] = await Promise.all([
        FriendsApi.list(),
        FriendsApi.requests(),
      ]);
      
      const normalizedFriends = (friendsRaw || []).map((item: any) => {
        const raw = item.raw ?? item;
        const rawUser = raw.user ?? raw;
        const avatarUrl = item.avatarUrl ?? raw.avatarUrl ?? rawUser?.avatarUrl ?? null;
        const uniqueId = item.uniqueId ?? raw.uniqueId ?? rawUser?.uniqueId;
        const username = item.username ?? raw.username ?? rawUser?.username;

        return {
          ...raw,
          user: { ...rawUser, avatarUrl, uniqueId, username },
          avatarUrl,
          uniqueId,
          username,
          raw,
        };
      });

      set({ 
        friends: normalizedFriends, 
        requests: {
          incoming: requestsRaw?.incoming || [],
          outgoing: requestsRaw?.outgoing || [],
        }
      });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to load' });
    } finally {
      set({ loading: false });
    }
  },

  async fetchRequests() {
    set({ loading: true });
    try {
      const requestsRaw = await FriendsApi.requests();
      set({ 
        requests: {
          incoming: requestsRaw?.incoming || [],
          outgoing: requestsRaw?.outgoing || [],
        }
      });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to load requests' });
    } finally {
      set({ loading: false });
    }
  },

  async respondRequest(targetId, status) {
    const me = useAppStore.getState().user;
    if (!me?.uniqueId) return;

    try {
      if (status === 'accepted') {
        await FriendsApi.accept(me.uniqueId, targetId);
      } else {
        await FriendsApi.reject(me.uniqueId, targetId);
      }
      await get().fetchRequests();
    } catch (e) {
      console.error('Failed to respond to request:', e);
    }
  },

  async cancelRequest(id) {
    // Assuming we can use remove with uniqueId or if we have a specific cancel endpoint.
    // For now, let's try to find the request and get the user's uniqueId.
    const req = get().requests.outgoing.find((r: any) => r.id === id);
    const targetUniqueId = req?.to?.uniqueId || req?.receiver?.uniqueId;
    
    if (targetUniqueId) {
      await FriendsApi.remove(targetUniqueId);
      await get().fetchRequests();
    }
  },

  async search(q) {
    return FriendsApi.search(q);
  },

  async send(uniqueId) {
    await FriendsApi.sendRequest(uniqueId);
    await get().fetchAll();
  },

  async remove(uniqueId) {
    await FriendsApi.remove(uniqueId);
    await get().fetchAll();
  },
}));

