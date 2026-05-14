import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Pressable, ScrollView, RefreshControl, BackHandler } from 'react-native';
import {
  YStack,
  XStack,
  Paragraph,
  Separator,
  Button,
  Spinner,
  Input,
  Text,
  Circle,
  View
} from 'tamagui';
import { useRouter } from 'expo-router';
import { CircleCheck, CircleX, QrCode, Scan, Search, ChevronLeft, UserPlus, ArrowUpRight, ArrowDownLeft, Clock, AlertCircle } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';

import { useFriendsStore } from '@/features/friends/model/friends.store';
import UserAvatar from '@/shared/ui/UserAvatar';
import { FriendsApi } from '@/features/friends/api/friends.api';
import { useAppStore } from '@/shared/lib/stores/app-store';

function RequestCard({ 
  title, 
  uid, 
  avatarUrl, 
  type, 
  onAccept, 
  onReject, 
  isBusy 
}: { 
  title: string, 
  uid?: string, 
  avatarUrl?: string, 
  type: 'incoming' | 'outgoing',
  onAccept?: () => void,
  onReject?: () => void,
  isBusy?: boolean
}) {
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';
  return (
    <Animated.View entering={FadeInDown.duration(400)} layout={Layout.springify()}>
      <XStack 
        bg={isDark ? '#1C1C1E' : 'white'} 
        br={24} 
        p="$4" 
        ai="center" 
        jc="space-between" 
        mb="$3"
        shadowColor="#000"
        shadowOpacity={isDark ? 0.3 : 0.03}
        shadowRadius={15}
        elevation={2}
      >
        <XStack ai="center" gap="$3">
          <UserAvatar label={title.charAt(0).toUpperCase()} uri={avatarUrl} size={48} />
          <YStack>
            <Text fontSize={16} fontWeight="800" col={isDark ? 'white' : '#1E293B'}>{title}</Text>
            <Text fontSize={13} col="$gray9" fontWeight="600">@{uid}</Text>
          </YStack>
        </XStack>

        {type === 'incoming' ? (
          <XStack gap="$2">
            <Pressable 
              onPress={onReject} 
              disabled={isBusy}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.9 : 1 }]
              })}
            >
              <Circle size={40} bg="#FEF2F2" ai="center" jc="center">
                <CircleX size={20} color="#EF4444" />
              </Circle>
            </Pressable>
            <Pressable 
              onPress={onAccept} 
              disabled={isBusy}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.9 : 1 }]
              })}
            >
              <Circle size={40} bg="#F0FDF4" ai="center" jc="center">
                {isBusy ? <Spinner size="small" color="#22C55E" /> : <CircleCheck size={20} color="#22C55E" />}
              </Circle>
            </Pressable>
          </XStack>
        ) : (
          <View bg="$gray2" px="$3" py="$1.5" br={12}>
            <Text fontSize={12} fontWeight="700" col="$gray10">Kutilmoqda</Text>
          </View>
        )}
      </XStack>
    </Animated.View>
  );
}

export default function FriendsRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { friends, requests: requestsRaw, loading, error, fetchAll } = useFriendsStore();
  const meUniqueId = useAppStore(s => s.user?.uniqueId);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    const onBack = () => {
      goBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [goBack]);

  useEffect(() => {
    fetchAll();
  }, []);

  const incoming = useMemo(() => requestsRaw?.incoming ?? [], [requestsRaw]);
  const outgoing = useMemo(() => requestsRaw?.outgoing ?? [], [requestsRaw]);

  const handleAction = async (fn: () => Promise<any>, id: number) => {
    setBusyId(id);
    try {
      await fn();
      await fetchAll();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const accept = (fromId: number) => handleAction(() => FriendsApi.accept(meUniqueId!, fromId), fromId);
  const reject = (fromId: number) => handleAction(() => FriendsApi.reject(meUniqueId!, fromId), fromId);

  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';

  return (
    <YStack f={1} bg={isDark ? '#000000' : '#F8FAFC'}>
      {/* Premium Header */}
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : ['#007AFF', '#00C6FF']}
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 30,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
        }}
      >
        <XStack ai="center" jc="space-between" mb="$6">
          <Pressable 
            onPress={goBack}
            style={({ pressed }) => ({
              opacity: pressed ? 0.4 : 1,
              transform: [{ scale: pressed ? 0.85 : 1 }]
            })}
          >
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.15)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={20} fow="900">So'rovlar</Text>
          <View width={44} />
        </XStack>

        {/* Custom Tab Switcher (Capsule Style) */}
        <XStack bg="rgba(255,255,255,0.1)" p="$1" br={30} gap="$1" mt="$2">
          <Pressable 
            onPress={() => setTab('incoming')} 
            style={{ flex: 1 }}
          >
            <View 
              bg={tab === 'incoming' ? (isDark ? '#2C2C2E' : 'white') : 'transparent'} 
              py="$2" 
              br={25} 
              ai="center"
              shadowColor={tab === 'incoming' ? '#000' : 'transparent'}
              shadowOpacity={0.1}
              shadowRadius={10}
            >
              <Text col={tab === 'incoming' ? (isDark ? 'white' : '#0F172A') : 'white'} fow="900" fos={14}>Kiruvchi</Text>
            </View>
          </Pressable>
          <Pressable 
            onPress={() => setTab('outgoing')} 
            style={{ flex: 1 }}
          >
            <View 
              bg={tab === 'outgoing' ? (isDark ? '#2C2C2E' : 'white') : 'transparent'} 
              py="$2" 
              br={25} 
              ai="center"
              shadowColor={tab === 'outgoing' ? '#000' : 'transparent'}
              shadowOpacity={0.1}
              shadowRadius={10}
            >
              <Text col={tab === 'outgoing' ? (isDark ? 'white' : '#0F172A') : 'white'} fow="900" fos={14}>Yuborilgan</Text>
            </View>
          </Pressable>
        </XStack>
      </LinearGradient>

      <ScrollView 
        f={1} 
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor="#007AFF" />}
      >
        {/* Quick Actions */}
        <XStack gap="$3" mb="$6">
          <Pressable 
            onPress={() => router.push({ pathname: '/tabs/friends/search', params: { from: 'friends-requests' } })}
            style={{ flex: 1 }}
          >
            <YStack bg={isDark ? '#1C1C1E' : 'white'} p="$4.5" br={28} ai="center" gap="$2.5" shadowColor="#000" shadowOpacity={isDark ? 0.3 : 0.06} shadowRadius={20} elevation={3}>
              <Circle size={48} bg={isDark ? '#1E293B' : '#E0F2FE'} ai="center" jc="center">
                <Search size={24} color="#0EA5E9" />
              </Circle>
              <Text fos={14} fow="800" col={isDark ? 'white' : '#1E293B'}>Qidirish</Text>
            </YStack>
          </Pressable>
          <Pressable 
            onPress={() => router.push({ pathname: '/tabs/scan-invite', params: { from: 'friends-requests' } })}
            style={{ flex: 1 }}
          >
            <YStack bg={isDark ? '#1C1C1E' : 'white'} p="$4.5" br={28} ai="center" gap="$2.5" shadowColor="#000" shadowOpacity={isDark ? 0.3 : 0.06} shadowRadius={20} elevation={3}>
              <Circle size={48} bg={isDark ? '#1E293B' : '#F0FDF4'} ai="center" jc="center">
                <Scan size={24} color="#22C55E" />
              </Circle>
              <Text fos={14} fow="800" col={isDark ? 'white' : '#1E293B'}>Skanerlash</Text>
            </YStack>
          </Pressable>
        </XStack>

        <YStack gap="$2">
          {tab === 'incoming' ? (
            incoming.length === 0 ? (
              <YStack ai="center" py="$10" gap="$4">
                <Circle size={80} bg={isDark ? '#1C1C1E' : '$gray2'} ai="center" jc="center">
                  <ArrowDownLeft size={32} color="$gray8" />
                </Circle>
                <YStack ai="center" gap="$1">
                  <Text fos={18} fow="800" col={isDark ? 'white' : '#1E293B'}>Kiruvchi so'rovlar yo'q</Text>
                  <Text fos={14} col="$gray9" ta="center">Sizga hali hech kim do'stlik so'rovi yubormadi</Text>
                </YStack>
              </YStack>
            ) : (
              incoming.map((req: any) => (
                <RequestCard
                  key={req.id}
                  type="incoming"
                  title={req.from?.displayName || req.from?.username || 'User'}
                  uid={req.from?.uniqueId}
                  avatarUrl={req.from?.avatarUrl}
                  isBusy={busyId === req.from?.id}
                  onAccept={() => accept(req.from?.id)}
                  onReject={() => reject(req.from?.id)}
                />
              ))
            )
          ) : (
            outgoing.length === 0 ? (
              <YStack ai="center" py="$10" gap="$4">
                <Circle size={80} bg={isDark ? '#1C1C1E' : '$gray2'} ai="center" jc="center">
                  <ArrowUpRight size={32} color="$gray8" />
                </Circle>
                <YStack ai="center" gap="$1">
                  <Text fos={18} fow="800" col={isDark ? 'white' : '$gray12'}>Yuborilgan so'rovlar yo'q</Text>
                  <Text fos={14} col="$gray9" ta="center">Siz hali hech kimga do'stlik so'rovi yubormadingiz</Text>
                </YStack>
              </YStack>
            ) : (
              outgoing.map((req: any) => (
                <RequestCard
                  key={req.id}
                  type="outgoing"
                  title={req.to?.displayName || req.to?.username || 'User'}
                  uid={req.to?.uniqueId}
                  avatarUrl={req.to?.avatarUrl}
                />
              ))
            )
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
