import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Dimensions } from 'react-native';
import { YStack, XStack, Text, Button, Circle, ScrollView, Spinner, View, Theme } from 'tamagui';
import { Users as UsersIcon, Check, Plus, Minus, Package as PackageIcon, ChevronLeft, ChevronRight, Info, AlertCircle } from '@tamagui/lucide-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppStore } from '@/shared/lib/stores/app-store';
import { useReceiptSessionStore } from '@/features/receipt/model/receipt-session.store';
import type { ReceiptSplitItem } from '@/features/receipt/model/receipt-session.store';
import { ReceiptApi } from '@/features/receipt/api/receipt.api';
import type { FinalizeReceiptItemPayload, FinalizeTotalsByItem, FinalizeTotalsByParticipant, ReceiptAllocation } from '@/features/receipt/api/receipt.api';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ===== Types =====
type Participant = { uniqueId: string; username: string };
type SplitMode = 'equal' | 'count' | undefined;
type Item = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedTo: string[];
  perPersonCount?: Record<string, number>;
  splitMode?: SplitMode;
  kind?: string;
  totalPrice?: number;
};

// ===== Helpers =====
const ensureMode = (item: Item): Exclude<SplitMode, undefined> =>
  item.splitMode === 'count' ? 'count' : 'equal';

const toLocalItems = (source: ReceiptSplitItem[]): Item[] =>
  source.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.unitPrice,
    quantity: item.quantity,
    assignedTo: [...item.assignedTo],
    perPersonCount: item.perPersonCount ? { ...item.perPersonCount } : {},
    splitMode: item.splitMode ?? (item.quantity > 1 ? 'count' : 'equal'),
    kind: item.kind,
    totalPrice: item.totalPrice,
  }));

const toStoreItems = (source: Item[]): ReceiptSplitItem[] =>
  source.map((item) => {
    const mode = ensureMode(item);
    return {
      id: item.id,
      name: item.name,
      unitPrice: item.price,
      quantity: item.quantity,
      totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice : item.price * item.quantity,
      kind: item.kind,
      splitMode: mode,
      assignedTo: mode === 'equal' ? [...(item.assignedTo || [])] : [],
      perPersonCount: mode === 'count' ? { ...(item.perPersonCount || {}) } : {},
    };
  });

export default function ItemsSplitScreen() {
  const { participants: participantsParam, receiptId } = useLocalSearchParams<{
    participants?: string;
    receiptId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const me = useAppStore((s) => s.user);
  const session = useReceiptSessionStore((s) => s.session);
  const storeItems = useReceiptSessionStore((s) => s.items);
  const storeParticipants = useReceiptSessionStore((s) => s.participants);
  const setStoreItems = useReceiptSessionStore((s) => s.setItems);
  const storeCurrency = useReceiptSessionStore((s) => s.currency);

  const [items, setLocalItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<{ id: string } | null>(null);
  const finalizeSession = useReceiptSessionStore((s) => s.finalizeSession);
  const finalizingInStore = useReceiptSessionStore((s) => s.finalizing);
  const finalizeError = useReceiptSessionStore((s) => s.finalizeError);

  const participants = useMemo<Participant[]>(() => {
    const source = (storeParticipants?.length ?? 0) > 0 ? storeParticipants : (participantsParam ? JSON.parse(decodeURIComponent(participantsParam)) : []);
    return source.map((p: any) => ({ uniqueId: p.uniqueId, username: p.username || p.uniqueId }));
  }, [storeParticipants, participantsParam]);

  useEffect(() => {
    if (storeItems.length > 0) {
      setLocalItems(toLocalItems(storeItems));
    }
  }, [storeItems]);

  const assignedCount = useMemo(() => items.reduce((acc, it) => {
    const mode = ensureMode(it);
    const assigned = mode === 'count' ? Object.values(it.perPersonCount || {}).reduce((a, b) => a + (b || 0), 0) >= it.quantity : it.assignedTo.length > 0;
    return acc + (assigned ? 1 : 0);
  }, 0), [items]);

  const progress = items.length > 0 ? assignedCount / items.length : 0;

  const handleToggleParticipant = (itemId: string, pId: string) => {
    setLocalItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const mode = ensureMode(it);
      if (mode === 'equal') {
        const has = it.assignedTo.includes(pId);
        return { ...it, assignedTo: has ? it.assignedTo.filter(id => id !== pId) : [...it.assignedTo, pId] };
      } else {
        const current = it.perPersonCount?.[pId] || 0;
        const totalAssigned = Object.values(it.perPersonCount || {}).reduce((a, b) => a + (b || 0), 0);
        if (current > 0) {
          const next = { ...it.perPersonCount };
          delete next[pId];
          return { ...it, perPersonCount: next };
        } else if (totalAssigned < it.quantity) {
          return { ...it, perPersonCount: { ...it.perPersonCount, [pId]: 1 } };
        }
        return it;
      }
    }));
  };

  const handleNext = async () => {
    try {
      setStoreItems(toStoreItems(items));
      await finalizeSession();
      router.push('/tabs/sessions/finish');
    } catch (e) {
      console.error('Finalize failed:', e);
    }
  };

  return (
    <YStack f={1} bg="white">
      {/* Premium Header */}
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
        <XStack ai="center" jc="space-between" mb="$4">
          <Pressable onPress={() => router.back()}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.2)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={18} fow="900">{t('sessions.split.title', 'Taqsimlash')}</Text>
          <View width={40} />
        </XStack>

        {/* Progress Bar */}
        <YStack gap="$2">
          <XStack jc="space-between">
            <Text col="white" fos={12} fow="800" textTransform="uppercase">{t('sessions.split.progress', 'Jarayon')}</Text>
            <Text col="white" fos={12} fow="800">{assignedCount}/{items.length}</Text>
          </XStack>
          <View h={8} bg="rgba(255,255,255,0.2)" br={4} overflow="hidden">
            <View h="100%" w={`${progress * 100}%`} bg="white" br={4} />
          </View>
        </YStack>
      </LinearGradient>

      <ScrollView f={1} p="$5" showsVerticalScrollIndicator={false}>
        <YStack gap="$4" pb="$20">
          {items.map((item) => {
            const mode = ensureMode(item);
            const isAssigned = mode === 'count' ? Object.values(item.perPersonCount || {}).reduce((a, b) => a + (b || 0), 0) > 0 : item.assignedTo.length > 0;
            const isDone = mode === 'count' ? Object.values(item.perPersonCount || {}).reduce((a, b) => a + (b || 0), 0) >= item.quantity : item.assignedTo.length > 0;

            return (
              <YStack 
                key={item.id}
                bg="white" 
                br={24} 
                p="$4" 
                gap="$4"
                shadowColor={isDone ? "#007AFF" : "#000"}
                shadowOffset={{ width: 0, height: 8 }}
                shadowOpacity={isDone ? 0.08 : 0.04}
                shadowRadius={20}
                elevation={6}
                borderWidth={1.5}
                borderColor={isDone ? "rgba(0,122,255,0.2)" : "$gray3"}
              >
                <XStack jc="space-between" ai="center">
                  <YStack f={1} gap="$1">
                    <Text fos={17} fow="800" col="$gray12">{item.name}</Text>
                    <XStack ai="center" gap="$2">
                      <Text fos={13} col="$gray9" fow="600">{item.quantity}x {item.price.toLocaleString()} {storeCurrency}</Text>
                      <View w={4} h={4} br={2} bg="$gray5" />
                      <Text fos={13} col="#007AFF" fow="700">{(item.quantity * item.price).toLocaleString()} {storeCurrency}</Text>
                    </XStack>
                  </YStack>
                  {isDone ? (
                    <Circle size={24} bg="#007AFF" ai="center" jc="center">
                      <Check size={14} color="white" strokeWidth={3} />
                    </Circle>
                  ) : (
                    <Circle size={24} bg="$gray2" ai="center" jc="center" borderWidth={1} borderColor="$gray4">
                      <Plus size={14} color="$gray8" />
                    </Circle>
                  )}
                </XStack>

                <XStack flexWrap="wrap" gap="$2">
                  {participants.map((p) => {
                    const selected = mode === 'equal' ? item.assignedTo.includes(p.uniqueId) : (item.perPersonCount?.[p.uniqueId] || 0) > 0;
                    const count = mode === 'count' ? item.perPersonCount?.[p.uniqueId] || 0 : 0;
                    return (
                      <Pressable key={p.uniqueId} onPress={() => handleToggleParticipant(item.id, p.uniqueId)}>
                        <XStack 
                          bg={selected ? 'rgba(0,122,255,0.1)' : '$gray2'} 
                          br={12} 
                          px="$3" 
                          h={36} 
                          ai="center" 
                          gap="$2"
                          borderWidth={1}
                          borderColor={selected ? '#007AFF' : 'transparent'}
                        >
                          <UserAvatar uri={undefined} label={p.username.slice(0, 1).toUpperCase()} size={20} textSize={10} />
                          <Text col={selected ? '#007AFF' : '$gray11'} fos={13} fow="700">{p.username}</Text>
                          {mode === 'count' && selected && (
                            <Circle size={18} bg="#007AFF" ai="center" jc="center">
                              <Text col="white" fos={10} fow="900">{count}</Text>
                            </Circle>
                          )}
                        </XStack>
                      </Pressable>
                    );
                  })}
                </XStack>

                <XStack jc="space-between" ai="center" pt="$2" borderTopWidth={1} borderColor="$gray2">
                  <XStack ai="center" gap="$2">
                    <Info size={14} color="$gray9" />
                    <Text fos={12} col="$gray9" fow="600">
                      {mode === 'equal' ? t('sessions.split.mode_equal', 'Teng taqsimlash') : t('sessions.split.mode_count', 'Dona boyicha taqsimlash')}
                    </Text>
                  </XStack>
                  <Button 
                    unstyled 
                    onPress={() => {
                        setLocalItems(prev => prev.map(it => it.id === item.id ? { ...it, splitMode: mode === 'equal' ? 'count' : 'equal', assignedTo: [], perPersonCount: {} } : it));
                    }}
                  >
                    <Text col="#007AFF" fos={12} fow="800">{t('sessions.split.change_mode', 'O\'zgartirish')}</Text>
                  </Button>
                </XStack>
              </YStack>
            );
          })}
        </YStack>
      </ScrollView>

      {/* Footer Summary */}
      <YStack 
        bg="white" 
        p="$5" 
        pb={insets.bottom + 105} 
        borderTopLeftRadius={32} 
        borderTopRightRadius={32}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: -10 }}
        shadowOpacity={0.1}
        shadowRadius={20}
        elevation={20}
      >
        <Button
          onPress={handleNext}
          disabled={assignedCount === 0 || finalizingInStore}
          bg={assignedCount === items.length ? "#007AFF" : "#007AFF80"}
          h={56}
          br={16}
          shadowColor="#007AFF"
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={0.2}
          shadowRadius={8}
          pressStyle={{ scale: 0.98 }}
        >
          {finalizingInStore ? (
            <Spinner color="white" />
          ) : (
            <Text col="white" fos={18} fow="800">
              {assignedCount === items.length ? t('common.finish', 'Yakunlash') : `${t('common.next', 'Davom etish')} (${assignedCount}/${items.length})`}
            </Text>
          )}
        </Button>
      </YStack>
    </YStack>
  );
}
