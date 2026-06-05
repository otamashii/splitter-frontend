import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView, Button, Circle, View, Separator, Spinner } from 'tamagui';
import { ChevronLeft, ReceiptText, Users, Calendar, Wallet, ShoppingBag, ArrowUpRight, Download } from '@tamagui/lucide-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, Alert, Share } from 'react-native';
import { useTranslation } from 'react-i18next';

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

const formatSessionDate = (value?: string, locale: string = 'en') => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, {
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
  const { t } = useTranslation();
  const { theme, language } = useAppStore();
  const isDark = theme === 'dark';
  const [downloading, setDownloading] = useState(false);
  
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

  // Build PDF receipt and share
  const handleDownload = async () => {
    if (!bill) return;
    setDownloading(true);
    try {
      const dateStr = new Date(bill.finalizedAt || bill.createdAt)
        .toLocaleDateString(language, { day: '2-digit', month: 'long', year: 'numeric' });

      const sep = '─'.repeat(42);
      const line = (label: string, value: string, width = 42) => {
        const dots = '.'.repeat(Math.max(1, width - label.length - value.length));
        return `${label}${dots}${value}`;
      };

      const receiptLines: string[] = [
        `╔══════════════════════════════════════════╗`,
        `║      ${t('navigation.report.header', 'SPLITTER — RECEIPT')}              ║`,
        `╚══════════════════════════════════════════╝`,
        '',
        line(t('navigation.report.name', 'Session name:'), bill.sessionName || 'Hisob'),
        line(t('navigation.report.date', 'Date:'), dateStr),
        line(t('navigation.report.participants', 'Participants:'), `${bill.participantUniqueIds?.length || 0}`),
        '',
        sep,
        t('navigation.report.items', 'ITEMS:'),
        sep,
        ...(bill.totals?.byItem ?? []).map(item =>
          line(`  ${item.name}`, fmt(item.total))
        ),
        sep,
        line(t('navigation.report.total', 'TOTAL:'), fmt(bill.grandTotal)),
        sep,
        '',
        t('navigation.report.by_participants', 'BY PARTICIPANTS:'),
        sep,
        ...participants.map(p => [
          line(`  ${p.participant.username}:`, fmt(p.amount)),
          ...p.items.map(it => `      • ${it.title}: ${fmt(it.price)}`),
        ]).flat(),
        sep,
        '',
        `${t('navigation.report.footer', 'Generated via Splitter App')} — ${new Date().toLocaleString(language)}`,
      ];

      await Share.share({
        message: receiptLines.join('\n'),
        title: `${bill.sessionName || 'Hisob'} — ${t('navigation.historyDetails', 'Details')}`,
      });
    } catch (e: any) {
      if (e?.message !== 'User did not share') {
        Alert.alert(t('common.error', 'Error'), e?.message || t('profile.alerts.downloadFailed', 'Download failed'));
      }
    } finally {
      setDownloading(false);
    }
  };

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
        <Text fontSize={18} fontWeight="800" col="$gray10">{t('navigation.not_found', 'Information not found')}</Text>
        <Button 
          bg="#007AFF" 
          col="white" 
          br={16} 
          onPress={() => router.back()}
          icon={ChevronLeft}
        >
          {t('navigation.back', 'Go back')}
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
              <Text col="white" fontSize={18} fontWeight="900">{t('navigation.historyDetails', 'Details')}</Text>
              <View w={44} />
            </XStack>

            <YStack ai="center" gap="$2">
              <Text col="white" opacity={0.8} fontSize={14} fontWeight="700" textTransform="uppercase">{t('navigation.total_bill', 'Total Bill')}</Text>
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
               <Text fontSize={10} col="$gray9" fontWeight="700">{t('navigation.participants_count', 'PARTICIPANTS')}</Text>
            </YStack>
            <YStack f={1} bg={isDark ? '#1C1C1E' : 'white'} br={24} p="$4" shadowColor="#000" shadowOpacity={0.1} shadowRadius={20} elevation={10} ai="center" gap="$1">
               <Circle size={32} bg="rgba(139,92,246,0.1)" ai="center" jc="center">
                 <Calendar size={16} color="#8B5CF6" />
               </Circle>
               <Text fontSize={10} fontWeight="900" col={isDark ? 'white' : '#1E293B'} ta="center">{formatSessionDate(bill.finalizedAt || bill.createdAt, language).split(' ')[0]}</Text>
               <Text fontSize={10} col="$gray9" fontWeight="700">{t('navigation.date', 'DATE')}</Text>
            </YStack>
          </XStack>
        </YStack>

        <YStack p="$6" gap="$8">
          {/* Settlement Section (NEW) */}
          <YStack gap="$4">
            <XStack ai="center" gap="$2">
               <ArrowUpRight size={20} color={isDark ? 'white' : '#1E293B'} />
               <Text fontSize={18} fontWeight="900" col={isDark ? 'white' : '#1E293B'}>{t('navigation.settlement', 'Settlement')}</Text>
            </XStack>
            
            <YStack bg={isDark ? '#1C1C1E' : 'white'} br={32} p="$5" gap="$4" borderLeftWidth={4} borderLeftColor="#007AFF">
               <XStack ai="center" gap="$3">
                  <View w={12} h={12} br={6} bg="#10B981" />
                  <Text fontSize={14} fontWeight="700" col={isDark ? 'white' : '#1E293B'}>
                    {t('navigation.payer', 'Payer')}: {bill.isCreator ? t('navigation.you', 'You') : (bill.participants?.find(p => p.uniqueId === bill.payload?.participants?.[0]?.uniqueId)?.username || t('navigation.other_participant', 'Other'))}
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
                             {p.participant.username} {bill.isCreator ? t('navigation.owes_you', 'owes you') : t('navigation.owes_payer', 'owes payer')}
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
               <Text fontSize={18} fontWeight="900" col={isDark ? 'white' : '#1E293B'}>{t('navigation.participants_breakdown', 'Breakdown')}</Text>
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
                  <XStack jc="space-between" ai="center" gap="$2">
                    <XStack ai="center" gap="$3" style={{ flex: 1 }}>
                       <UserAvatar uri={avatarUrl ?? undefined} label={participant.username[0]} size={40} />
                       <YStack style={{ flex: 1 }}>
                         <Text fontSize={15} fontWeight="800" col={isDark ? 'white' : '#1E293B'} numberOfLines={1}>{participant.username}</Text>
                         <Text fontSize={11} col="$gray9" fontWeight="600">{t('navigation.items_count', { count: items.length })}</Text>
                       </YStack>
                    </XStack>
                    <Text fontSize={16} fontWeight="900" col="#007AFF" style={{ flexShrink: 0 }}>{fmt(amount)}</Text>
                  </XStack>
                  
                  <Separator opacity={0.1} />
                  
                  <YStack gap="$2">
                    {items.map(item => (
                      <XStack key={item.id} jc="space-between" ai="center" gap="$2">
                        <Text fontSize={13} col={isDark ? '$gray11' : '$gray10'} fontWeight="600" numberOfLines={2} style={{ flex: 1 }}>{item.title}</Text>
                        <Text fontSize={13} col={isDark ? 'white' : '#1E293B'} fontWeight="700" style={{ flexShrink: 0 }}>{fmt(item.price)}</Text>
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
               <Text fontSize={18} fontWeight="900" col={isDark ? 'white' : '#1E293B'}>{t('navigation.all_items', 'All Items')}</Text>
            </XStack>
            
            <YStack bg={isDark ? '#1C1C1E' : 'white'} br={32} p="$5" gap="$4">
               {bill.totals?.byItem?.map(item => (
                  <XStack key={item.itemId} jc="space-between" ai="center" gap="$3">
                    <YStack gap="$0.5" style={{ flex: 1 }}>
                      <Text fontSize={14} fontWeight="800" col={isDark ? 'white' : '#1E293B'} numberOfLines={2}>{item.name}</Text>
                      <Text fontSize={11} col="$gray9" fontWeight="600">{t('navigation.item_id', 'Item ID')}: {item.itemId.slice(0, 8)}</Text>
                    </YStack>
                    <Text fontSize={14} fontWeight="900" col={isDark ? 'white' : '#1E293B'} style={{ flexShrink: 0 }}>{fmt(item.total)}</Text>
                  </XStack>
               ))}
               
               <Separator borderStyle="dashed" opacity={0.2} mt="$2" />
               
               <XStack jc="space-between" ai="center" pt="$2">
                  <Text fontSize={16} fontWeight="900" col={isDark ? 'white' : '#1E293B'}>{t('navigation.grand_total', 'TOTAL')}</Text>
                  <Text fontSize={18} fontWeight="900" col="#007AFF">{fmt(bill.grandTotal)}</Text>
               </XStack>
            </YStack>
          </YStack>

          {/* Export Action */}
          <Pressable
            onPress={handleDownload}
            disabled={downloading}
            style={({ pressed }) => ({
              opacity: pressed || downloading ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <XStack
              bg={isDark ? '#1C1C2E' : '#EEF4FF'}
              h={60}
              br={20}
              ai="center"
              jc="center"
              gap="$3"
              borderWidth={1}
              borderColor={isDark ? 'rgba(0,122,255,0.3)' : 'rgba(0,122,255,0.2)'}
            >
              {downloading
                ? <Spinner color="#007AFF" />
                : <Download size={20} color="#007AFF" />}
              <Text fontSize={15} fontWeight="800" col="#007AFF">
                {downloading ? t('navigation.loading', 'Loading...') : t('navigation.download_report', 'Download Report')}
              </Text>
            </XStack>
          </Pressable>
        </YStack>
      </ScrollView>
    </View>
  );
}
