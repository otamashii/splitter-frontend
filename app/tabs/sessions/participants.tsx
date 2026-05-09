import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import {
  YStack, XStack, Button, Spinner, Text, Input, ScrollView, Circle, View
} from 'tamagui';
import { Users as UsersIcon, Check, ChevronLeft, Search, UserCheck } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFriendsStore } from '@/features/friends/model/friends.store';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { useGroupsStore } from '@/features/groups/model/groups.store';
import { useReceiptSessionStore } from '@/features/receipt/model/receipt-session.store';
import { useTranslation } from 'react-i18next';

type LiteUser = { uniqueId: string; username: string; avatarUrl?: string | null };

export default function SessionParticipantsScreen() {
  const { receiptId } = useLocalSearchParams<{ receiptId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // stores
  const me = useAppStore(s => s.user);
  const { friends, loading: friendsLoading, error: friendsError, fetchAll: fetchFriends } = useFriendsStore();
  const { groups, counts, fetchGroups, openGroup } = useGroupsStore();

  const session = useReceiptSessionStore((s) => s.session);
  const setReceiptParticipants = useReceiptSessionStore((s) => s.setParticipants);

  // -------- state --------
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<Record<number, LiteUser[]>>({});
  const [groupLoading, setGroupLoading] = useState<Record<number, boolean>>({});
  const [autoFromGroup, setAutoFromGroup] = useState<Record<string, number | undefined>>({});
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalResults, setGlobalResults] = useState<LiteUser[]>([]);
  
  const autoRef = useRef(autoFromGroup);
  useEffect(() => { autoRef.current = autoFromGroup; }, [autoFromGroup]);

  // -------- boot --------
  useEffect(() => { fetchFriends(); }, [fetchFriends]);
  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const meUid = useMemo(() => (me?.uniqueId || me?.username || (typeof me?.id === 'number' ? `id:${me.id}` : '')) as string, [me]);
  const meName = useMemo(() => (me?.username || 'You') as string, [me]);

  useEffect(() => {
    if (!meUid) return;
    setSelected(prev => ({ ...prev, [meUid]: true }));
  }, [meUid]);

  const dedupByUniqueId = (arr: LiteUser[]) => {
    const seen = new Set<string>();
    const out: LiteUser[] = [];
    for (const u of arr) {
      if (!u.uniqueId || seen.has(u.uniqueId)) continue;
      seen.add(u.uniqueId);
      out.push(u);
    }
    return out;
  };

  const basePeople: LiteUser[] = useMemo(() => {
    const res: LiteUser[] = [];
    if (meUid) res.push({ uniqueId: meUid, username: meName, avatarUrl: me?.avatarUrl });
    (friends ?? []).forEach((f: any) => {
      const uid = f?.user?.uniqueId ?? f?.uniqueId;
      if (!uid) return;
      const uname = f?.user?.username ?? f?.username ?? uid;
      res.push({ uniqueId: uid, username: uname, avatarUrl: f?.user?.avatarUrl });
    });
    return res;
  }, [friends, meUid, meName, me?.avatarUrl]);

  async function loadGroupMembers(gid: number): Promise<LiteUser[]> {
    if (groupMembers[gid]) return groupMembers[gid];
    setGroupLoading(m => ({ ...m, [gid]: true }));
    try {
      await openGroup(gid);
      const st = (useGroupsStore as any)?.getState?.();
      const raw = st?.current?.members ?? [];
      const mapped: LiteUser[] = raw
        .map((m: any) => ({
          uniqueId: m?.uniqueId ?? '',
          username: m?.username ?? (m?.uniqueId ?? ''),
          avatarUrl: m?.avatarUrl,
        }))
        .filter((m: LiteUser) => !!m.uniqueId);
      setGroupMembers(mm => ({ ...mm, [gid]: mapped }));
      return mapped;
    } finally {
      setGroupLoading(m => ({ ...m, [gid]: false }));
    }
  }

  function stripAutoOfGroup(next: Record<string, boolean>, gid: number) {
    const auto = autoRef.current;
    Object.entries(auto).forEach(([uid, g]) => {
      if (g === gid) delete next[uid];
    });
  }

  function deactivateGroup(gid: number) {
    setActiveGroupId(null);
    setSelected(prev => {
      const next = { ...prev };
      stripAutoOfGroup(next, gid);
      if (meUid) next[meUid] = true;
      return next;
    });
    setAutoFromGroup(prev => {
      const cp: Record<string, number | undefined> = {};
      Object.entries(prev).forEach(([uid, g]) => { if (g !== gid) cp[uid] = g; });
      return cp;
    });
  }

  async function activateGroup(gid: number) {
    if (activeGroupId === gid) { deactivateGroup(gid); return; }
    if (typeof activeGroupId === 'number') {
      setSelected(prev => {
        const next = { ...prev };
        stripAutoOfGroup(next, activeGroupId);
        if (meUid) next[meUid] = true;
        return next;
      });
      setAutoFromGroup(prev => {
        const cp: Record<string, number | undefined> = {};
        Object.entries(prev).forEach(([uid, g]) => { if (g !== activeGroupId) cp[uid] = g; });
        return cp;
      });
    }
    setActiveGroupId(gid);
    if (groupMembers[gid]) {
      const members = groupMembers[gid]!;
      setSelected(prev => {
        const next = { ...prev };
        const added: Record<string, number> = {};
        members.forEach(m => {
          if (!next[m.uniqueId]) { next[m.uniqueId] = true; added[m.uniqueId] = gid; }
        });
        if (meUid) next[meUid] = true;
        setAutoFromGroup(prevAuto => ({ ...prevAuto, ...added }));
        return next;
      });
      return;
    }
    const members = await loadGroupMembers(gid);
    setSelected(prev => {
      const next = { ...prev };
      const added: Record<string, number> = {};
      members.forEach(m => {
        if (!next[m.uniqueId]) { next[m.uniqueId] = true; added[m.uniqueId] = gid; }
      });
      if (meUid) next[meUid] = true;
      setAutoFromGroup(prevAuto => ({ ...prevAuto, ...added }));
      return next;
    });
  }

  const unionPeople: LiteUser[] = useMemo(() => {
    const fromGroup = activeGroupId ? (groupMembers[activeGroupId] || []) : [];
    // Combine base people, group members, and any global search results
    return dedupByUniqueId([...basePeople, ...fromGroup, ...globalResults]);
  }, [basePeople, activeGroupId, groupMembers, globalResults]);

  // Global search effect
  const { search: searchGlobal } = useFriendsStore();
  useEffect(() => {
    if (!q || q.length < 3) {
      setGlobalResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setGlobalSearchLoading(true);
      try {
        const results = await searchGlobal(q);
        const mapped = (results || []).map((u: any) => ({
          uniqueId: u.uniqueId || '',
          username: u.username || u.uniqueId || '',
          avatarUrl: u.avatarUrl
        })).filter((u: any) => u.uniqueId);
        setGlobalResults(mapped);
      } catch (e) {
        console.warn('Global search failed:', e);
      } finally {
        setGlobalSearchLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [q, searchGlobal]);

  const filtered = useMemo(() => {
    if (!q) return unionPeople;
    const qq = q.toLowerCase();
    return unionPeople.filter(p =>
      p.username.toLowerCase().includes(qq) || p.uniqueId.toLowerCase().includes(qq)
    );
  }, [unionPeople, q]);

  const toggleUser = (uid: string) => {
    setSelected(s => ({ ...s, [uid]: !s[uid] }));
    setAutoFromGroup(prev => {
      if (prev[uid] !== undefined) {
        const cp = { ...prev };
        delete cp[uid];
        return cp;
      }
      return prev;
    });
  };

  const selectedList = Object.keys(selected).filter(k => selected[k]);
  const canNext = selectedList.length >= 2;

  const goNext = () => {
    const participants = unionPeople
      .filter(p => selected[p.uniqueId])
      .map(p => ({ uniqueId: p.uniqueId, username: p.username }));

    setReceiptParticipants(participants);
    const sessionId = session?.sessionId ? String(session.sessionId) : undefined;
    const effectiveReceiptId = receiptId ?? sessionId;
    router.push({
      pathname: '/tabs/sessions/items-split',
      params: { 
        receiptId: effectiveReceiptId,
        participants: JSON.stringify(participants)
      }
    });
  };

  return (
    <YStack f={1} bg="white">
      {/* Header with Blue Gradient */}
      <LinearGradient
        colors={['#007AFF', '#0055FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 25,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <XStack ai="center" jc="space-between">
          <Pressable onPress={() => router.back()}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.2)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={20} fow="900">{t('sessions.participants.title', 'Ishtirokchilar')}</Text>
          <View width={40} />
        </XStack>

        <YStack mt="$5" gap="$3">
          <XStack ai="center" bg="rgba(255,255,255,0.15)" br={16} h={52} px="$4" gap="$3">
            <Search size={20} color="rgba(255,255,255,0.6)" />
            <Input
              f={1}
              placeholder={t('sessions.participants.search', 'Ism yoki @username...')}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={q}
              onChangeText={setQ}
              bg="transparent"
              borderWidth={0}
              col="white"
              fos={16}
              fow="600"
            />
            {globalSearchLoading && <Spinner size="small" color="white" />}
          </XStack>
        </YStack>
      </LinearGradient>

      <ScrollView f={1} p="$5" showsVerticalScrollIndicator={false}>
        {/* Groups Horizontal List */}
        <YStack gap="$3" mb="$6">
          <Text fos={14} fow="800" col="$gray9" textTransform="uppercase">{t('sessions.participants.groups', 'Guruhlar')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2">
              {(groups ?? []).map((g: any) => {
                const active = activeGroupId === g.id;
                const loading = !!groupLoading[g.id];
                return (
                  <Pressable key={g.id} onPress={() => activateGroup(g.id)}>
                    <XStack 
                      bg={active ? '#007AFF' : '$gray2'} 
                      br={16} 
                      px="$4" 
                      h={40} 
                      ai="center" 
                      gap="$2"
                      borderWidth={1}
                      borderColor={active ? '#007AFF' : '$gray3'}
                    >
                      <UsersIcon size={16} color={active ? 'white' : '#007AFF'} />
                      <Text col={active ? 'white' : '$gray12'} fow="700">{g.name}</Text>
                      {loading && <Spinner size="small" color="white" />}
                    </XStack>
                  </Pressable>
                );
              })}
            </XStack>
          </ScrollView>
        </YStack>

        <YStack gap="$3" mb="$10">
          <XStack jc="space-between" ai="baseline">
            <Text fos={14} fow="800" col="$gray9" textTransform="uppercase">{t('sessions.participants.people', 'Odamlar')}</Text>
            <Text fos={12} fow="700" col="#007AFF">{selectedList.length} {t('sessions.participants.selected', 'tanlandi')}</Text>
          </XStack>

          {filtered.map((p) => {
            const on = !!selected[p.uniqueId];
            return (
              <YStack 
                key={p.uniqueId} 
                onPress={() => toggleUser(p.uniqueId)}
                ai="center" 
                jc="space-between" 
                p="$3.5" 
                br={24} 
                bg="white"
                borderWidth={2}
                borderColor={on ? '#007AFF' : '$gray3'}
                shadowColor={on ? '#007AFF' : '#000'}
                shadowOffset={{ width: 0, height: 6 }}
                shadowOpacity={on ? 0.15 : 0.03}
                shadowRadius={12}
                elevation={on ? 6 : 2}
                mb="$3"
                pressStyle={{ scale: 0.98, bg: on ? 'rgba(0,122,255,0.05)' : '$gray1' }}
              >
                <XStack ai="center" jc="space-between" f={1} w="100%">
                  <XStack ai="center" gap="$3.5">
                    <YStack>
                       <UserAvatar uri={p.avatarUrl ?? undefined} label={(p.username || "U").slice(0, 1).toUpperCase()} size={48} />
                       {on && (
                         <Circle pos="absolute" bottom={-2} right={-2} size={18} bg="#007AFF" bw={2} boc="white" ai="center" jc="center">
                            <Check size={10} color="white" strokeWidth={4} />
                         </Circle>
                       )}
                    </YStack>
                    <YStack>
                      <Text fontSize={17} fontWeight="900" color={on ? '#007AFF' : '$gray12'}>{p.username}</Text>
                      <Text fontSize={13} color="$gray10" fontWeight="600">@{p.uniqueId.toLowerCase()}</Text>
                    </YStack>
                  </XStack>
                  <Circle 
                    size={28} 
                    borderWidth={2.5} 
                    borderColor={on ? '#007AFF' : '$gray4'} 
                    bg={on ? '#007AFF' : 'transparent'}
                    ai="center" 
                    jc="center"
                  >
                    {on && <Check size={14} color="white" strokeWidth={4} />}
                  </Circle>
                </XStack>
              </YStack>
            );
          })}
        </YStack>
      </ScrollView>

      {/* Footer Sticky Button */}
      <YStack 
        bg="white" 
        p="$5" 
        pb={insets.bottom + 105} 
        borderTopLeftRadius={32} 
        borderTopRightRadius={32}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: -10 }}
        shadowOpacity={0.08}
        shadowRadius={20}
        elevation={20}
      >
        <Button
          onPress={goNext}
          disabled={!canNext}
          bg={canNext ? "#007AFF" : "$gray8"}
          h={56}
          br={16}
          shadowColor="#007AFF"
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={0.2}
          shadowRadius={8}
          pressStyle={{ scale: 0.98 }}
        >
          <XStack ai="center" gap="$2">
            <UserCheck size={20} color="white" />
            <Text col="white" fos={18} fow="800">{t('common.next', 'Davom etish')}</Text>
          </XStack>
        </Button>
      </YStack>
    </YStack>
  );
}
