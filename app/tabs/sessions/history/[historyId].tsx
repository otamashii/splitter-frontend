import React, { useEffect, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView, Button, Circle, View, Separator } from 'tamagui';
import { ChevronLeft, ReceiptText, Users, Calendar, Wallet, ShoppingBag, ArrowUpRight } from '@tamagui/lucide-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';

import UserAvatar from '@/shared/ui/UserAvatar';
import { useSessionsHistoryStore } from '@/features/sessions/model/history.store';
import { useAppStore } from '@/shared/lib/stores/app-store';
import type {
  SessionHistoryEntry,
  SessionHistoryAllocation,
  SessionHistoryItem,
  SessionHistoryParticipantLight,
} from '@/features/sessions/api/history.api';

const DEFAULT_CURRENCY = 'UZS';
const BULLET = '\u2022';
const DETAIL_LIMIT = 50;

const formatSessionDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

type ParticipantView = {
  participant: SessionHistoryParticipantLight;
  avatarUrl?: string | null;
  amount: number;
  items: {
    id: string;
    title: string;
    price: number;
  }[];
};

const buildParticipantsView = (bill?: SessionHistoryEntry): ParticipantView[] => {
  if (!bill) return [];

  const totalsByParticipant = new Map<string, any>();
  (bill.totals?.byParticipant ?? []).forEach(item => {
    totalsByParticipant.set(item.uniqueId, item);
  });

  const itemsById = new Map<string, SessionHistoryItem>();
  (bill.totals?.byItem ?? []).forEach(item => {
    itemsById.set(item.itemId, item);
  });

  const allocationsByParticipant = new Map<string, SessionHistoryAllocation[]>();
  (bill.allocations ?? []).forEach(alloc => {
    const collection = allocationsByParticipant.get(alloc.participantId) ?? [];
    collection.push(alloc);
    allocationsByParticipant.set(alloc.participantId, collection);
  });

  return (bill.participants ?? []).map(p => {
    const totals = totalsByParticipant.get(p.uniqueId);
    const allocations = allocationsByParticipant.get(p.uniqueId) ?? [];
    const items = allocations.map((allocation, index) => {
      const itemMeta = itemsById.get(allocation.itemId);
      return {
        id: `${allocation.itemId}-${p.uniqueId}-${index}`,
        title: itemMeta?.name || 'Tovar',
        price: allocation.shareAmount,
      };
    });
    return {
      participant: {
        uniqueId: p.uniqueId,
        username: totals?.username || p.username || 'User',
        avatarUrl: p.avatarUrl ?? null,
      },
      avatarUrl: p.avatarUrl ?? null,
      amount: totals?.amountOwed ?? totals?.total ?? 0,
      items,
    };
  });
};

export default function HistoryDetailsScreen() {
  const { historyId } = useLocalSearchParams<{ historyId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';
  
  const sessions = useSessionsHistoryStore(state => state.sessions);
  const loading = useSessionsHistoryStore(state => state.loading);
  const initialized = useSessionsHistoryStore(state => state.initialized);
  const currentLimit = useSessionsHistoryStore(state => state.limit);
  const fetchHistory = useSessionsHistoryStore(state => state.fetchHistory);

  const bill = useMemo(() => {
    if (!historyId) return undefined;
    const id = Number(historyId);
    return sessions.find(session => session.sessionId === id);
  }, [historyId, sessions]);

  useEffect(() => {
    if (loading) return;
    if (!initialized || (!bill && (currentLimit ?? 0) < DETAIL_LIMIT)) {
      fetchHistory(DETAIL_LIMIT).catch(() => { });
    }
  }, [initialized, loading, currentLimit, fetchHistory, bill]);

  const participants = useMemo(() => buildParticipantsView(bill), [bill]);
  const currency = bill?.currency || bill?.totals?.currency || DEFAULT_CURRENCY;

  const fmt = (val: number) => val.toLocaleString() + ' ' + currency;

  if (!bill && loading) {
    return (
      <YStack f={1} bg={isDark ? '#000000' : '#F8F9FA'} ai="center" jc="center">
        <Spinner size="large" color="#007AFF" />
      </YStack>
    );
  }

  if (!bill) {
    return (
      <YStack f={1} bg={isDark ? '#000000' : '#F8F9FA'} ai="center" jc="center" p="$6" gap="$4">
        <ReceiptText size={64} color="$gray6" />
        <Text fontSize={18} fontWeight="800" col="$gray10">Ma'lumot topilmadi</Text>
        <Button 
          bg="#007AFF" 
          col="white" 
          br={16} 
          onPress={() => router.back()}
          icon={ChevronLeft}
        >
          Ortga qaytish
        </Button>
      </YStack>
    );
  }

  return (
    <View f={1} bg={isDark ? '#000000' : '#F8F9FA'}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Premium Header */}
        <YStack>
          <LinearGradient
            colors={isDark ? ['#1E293B', '#0F172A'] : ['#007AFF', '#00C6FF']}
            style={{
              paddingTop: insets.top + 10,
              paddingBottom: 60,
              paddingHorizontal: 24,
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
            }}
          >
            <XStack ai="center" jc="space-between" mb="$6">
              <Pressable onPress={() => router.back()}>
                <Circle size={44} bg="rgba(255,255,255,0.2)" ai="center" jc="center">
                  <ChevronLeft size={24} color="white" />
                </Circle>
              </Pressable>
              <Text col="white" fontSize={18} fontWeight="900">Tafsilotlar</Text>
              <View w={44} />
            </XStack>

            <YStack ai="center" gap="$2">
              <Text col="white" opacity={0.8} fontSize={14} fontWeight="700" textTransform="uppercase">Umumiy hisob</Text>
              <Text col="white" fontSize={42} fontWeight="900">{fmt(bill.grandTotal)}</Text>
              <XStack ai="center" gap="$2" bg="rgba(255,255,255,0.15)" px="$3" py="$1" br={20}>
                <ReceiptText size={14} color="white" />
                <Text col="white" fontSize={12} fontWeight="800">{bill.sessionName}</Text>
              </XStack>
            </YStack>
          </LinearGradient>

          {/* Info Cards */}
          <XStack px="$6" mt="$-10" gap="$3">
            <YStack f={1} bg={isDark ? '#1C1C1E' : 'white'} br={24} p="$4" shadowColor="#000" shadowOpacity={0.1} shadowRadius={20} elevation={10} ai="center" gap="$1">
               <Circle size={32} bg="rgba(0,122,255,0.1)" ai="center" jc="center">
                 <Users size={16} color="#007AFF" />
               </Circle>
               <Text fontSize={16} fontWeight="900" col={isDark ? 'white' : '#1E293B'}>{bill.participantUniqueIds?.length}</Text>
               <Text fontSize={10} col="$gray9" fontWeight="700">ISHTIROKCHI</Text>
            </YStack>
            <YStack f={1} bg={isDark ? '#1C1C1E' : 'white'} br={24} p="$4" shadowColor="#000" shadowOpacity={0.1} shadowRadius={20} elevation={10} ai="center" gap="$1">
               <Circle size={32} bg="rgba(139,92,246,0.1)" ai="center" jc="center">
                 <Calendar size={16} color="#8B5CF6" />
               </Circle>
               <Text fontSize={10} fontWeight="900" col={isDark ? 'white' : '#1E293B'} ta="center">{formatSessionDate(bill.finalizedAt || bill.createdAt).split(' ')[0]}</Text>
               <Text fontSize={10} col="$gray9" fontWeight="700">SANA</Text>
            </YStack>
          </XStack>
        </YStack>

        <YStack p="$6" gap="$8">
          {/* Settlement Section (NEW) */}
          <YStack gap="$4">
            <XStack ai="center" gap="$2">
               <ArrowUpRight size={20} color={isDark ? 'white' : '#1E293B'} />
               <Text fontSize={18} fontWeight="900" col={isDark ? 'white' : '#1E293B'}>Hisob-kitob (Qarzlar)</Text>
            </XStack>
            
            <YStack bg={isDark ? '#1C1C1E' : 'white'} br={32} p="$5" gap="$4" borderLeftWidth={4} borderLeftColor="#007AFF">
               <XStack ai="center" gap="$3">
                  <View w={12} h={12} br={6} bg="#10B981" />
                  <Text fontSize={14} fontWeight="700" col={isDark ? 'white' : '#1E293B'}>
                    To'lovchi: {bill.isCreator ? "Siz" : (bill.participants?.find(p => p.uniqueId === bill.payload?.participants?.[0]?.uniqueId)?.username || "Boshqa ishtirokchi")}
                  </Text>
               </XStack>
               
               <Separator opacity={0.1} />
               
               <YStack gap="$3">
                  {participants.filter(p => p.amount > 0 && (bill.isCreator ? p.participant.uniqueId !== bill.payload?.participants?.[0]?.uniqueId : true)).map((p) => {
                    const isMe = p.participant.uniqueId === bill.payload?.participants?.[0]?.uniqueId; // Simplified creator check
                    if (bill.isCreator && p.participant.uniqueId === (bill.participants?.[0]?.uniqueId || '')) return null; // Skip self if I paid
                    
                    return (
                      <XStack key={p.participant.uniqueId} jc="space-between" ai="center">
                        <XStack ai="center" gap="$2">
                           <UserAvatar uri={p.avatarUrl ?? undefined} label={p.participant.username[0]} size={24} />
                           <Text fontSize={13} col={isDark ? '$gray11' : '$gray10'} fontWeight="600">
                             {p.participant.username} {bill.isCreator ? "sizga qarzdor" : "to'lovchiga qarzdor"}
                           </Text>
                        </XStack>
                        <Text fontSize={14} fontWeight="900" col="#FF3B30">{fmt(p.amount)}</Text>
                      </XStack>
                    );
                  })}
               </YStack>
            </YStack>
          </YStack>

          {/* Participants Breakdown */}
          <YStack gap="$4">
            <XStack ai="center" gap="$2">
               <Wallet size={20} color={isDark ? 'white' : '#1E293B'} />
               <Text fontSize={18} fontWeight="900" col={isDark ? 'white' : '#1E293B'}>Ishtirokchilar bo'yicha</Text>
            </XStack>
            
            <YStack gap="$4">
              {participants.map(({ participant, avatarUrl, amount, items }) => (
                <YStack 
                  key={participant.uniqueId} 
                  bg={isDark ? '#1C1C1E' : 'white'} 
                  br={24} 
                  p="$4" 
                  gap="$3"
                  shadowColor="#000"
                  shadowOpacity={0.03}
                  shadowRadius={10}
                >
                  <XStack jc="space-between" ai="center">
                    <XStack ai="center" gap="$3">
                       <UserAvatar uri={avatarUrl ?? undefined} label={participant.username[0]} size={40} />
                       <YStack>
                         <Text fontSize={15} fontWeight="800" col={isDark ? 'white' : '#1E293B'}>{participant.username}</Text>
                         <Text fontSize={11} col="$gray9" fontWeight="600">{items.length} ta mahsulot</Text>
                       </YStack>
                    </XStack>
                    <Text fontSize={16} fontWeight="900" col="#007AFF">{fmt(amount)}</Text>
                  </XStack>
                  
                  <Separator opacity={0.1} />
                  
                  <YStack gap="$2">
                    {items.map(item => (
                      <XStack key={item.id} jc="space-between">
                        <Text fontSize={13} col={isDark ? '$gray11' : '$gray10'} fontWeight="600">{item.title}</Text>
                        <Text fontSize={13} col={isDark ? 'white' : '#1E293B'} fontWeight="700">{fmt(item.price)}</Text>
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              ))}
            </YStack>
          </YStack>

          {/* Full Receipt Overview */}
          <YStack gap="$4">
            <XStack ai="center" gap="$2">
               <ShoppingBag size={20} color={isDark ? 'white' : '#1E293B'} />
               <Text fontSize={18} fontWeight="900" col={isDark ? 'white' : '#1E293B'}>Umumiy mahsulotlar</Text>
            </XStack>
            
            <YStack bg={isDark ? '#1C1C1E' : 'white'} br={32} p="$5" gap="$4">
               {bill.totals?.byItem?.map(item => (
                 <XStack key={item.itemId} jc="space-between" ai="center">
                   <YStack gap="$0.5">
                     <Text fontSize={14} fontWeight="800" col={isDark ? 'white' : '#1E293B'}>{item.name}</Text>
                     <Text fontSize={11} col="$gray9" fontWeight="600">Tovar ID: {item.itemId.slice(0, 8)}</Text>
                   </YStack>
                   <Text fontSize={14} fontWeight="900" col={isDark ? 'white' : '#1E293B'}>{fmt(item.total)}</Text>
                 </XStack>
               ))}
               
               <Separator borderStyle="dashed" opacity={0.2} mt="$2" />
               
               <XStack jc="space-between" ai="center" pt="$2">
                  <Text fontSize={16} fontWeight="900" col={isDark ? 'white' : '#1E293B'}>JAMI</Text>
                  <Text fontSize={18} fontWeight="900" col="#007AFF">{fmt(bill.grandTotal)}</Text>
               </XStack>
            </YStack>
          </YStack>

          {/* Export Action */}
          <Button 
            bg={isDark ? '#2C2C2E' : '#E2E8F0'} 
            h={60} 
            br={20} 
            iconAfter={<ArrowUpRight size={20} color={isDark ? 'white' : '#1E293B'} />}
            onPress={() => {}}
          >
            <Text fontSize={15} fontWeight="800" col={isDark ? 'white' : '#1E293B'}>Hisobotni yuklab olish</Text>
          </Button>
        </YStack>
      </ScrollView>
    </View>
  );
}
