import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, View, Circle, Spinner, Button, Input } from 'tamagui';
import { 
  ChevronLeft, Search, UserPlus, Users, Check, X, 
  ArrowUpRight, ArrowDownLeft, Clock, QrCode
} from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useFriendsStore } from '@/features/friends/model/friends.store';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useAppStore } from '@/shared/lib/stores/app-store';

export default function FriendRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { language, theme } = useAppStore();
  const { 
    requests, 
    loading, 
    fetchRequests, 
    respondRequest,
    cancelRequest 
  } = useFriendsStore();

  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [q, setQ] = useState('');

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filtered = useMemo(() => {
    const list = tab === 'incoming' ? requests.incoming : requests.outgoing;
    if (!q) return list;
    const qq = q.toLowerCase();
    return list.filter((r: any) => {
      const u = tab === 'incoming' ? r.from : r.to;
      return (u?.username || '').toLowerCase().includes(qq) || 
             (u?.uniqueId || '').toLowerCase().includes(qq);
    });
  }, [requests, tab, q]);

  const isDark = theme === 'dark';

  return (
    <YStack f={1} bg={isDark ? '#000000' : '#F8F9FA'}>
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
        <XStack ai="center" jc="space-between" mb="$5">
          <Pressable onPress={() => router.back()}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.2)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={20} fow="900">{t('friends.requests.title', 'Requests')}</Text>
          <Pressable onPress={() => router.push('/tabs/scan-invite?from=friends-requests')}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.2)">
               <QrCode size={24} color="white" />
            </YStack>
          </Pressable>
        </XStack>

        <XStack ai="center" bg="rgba(255,255,255,0.15)" br={16} h={52} px="$4" gap="$3">
          <Search size={20} color="rgba(255,255,255,0.6)" />
          <Input
            f={1}
            placeholder={t('friends.requests.search', 'Search')}
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={q}
            onChangeText={setQ}
            bg="transparent"
            borderWidth={0}
            col="white"
            fos={16}
            fow="600"
          />
        </XStack>
      </LinearGradient>

      {/* Custom Tabs */}
      <XStack p="$4" gap="$3">
        <Pressable 
          style={{ flex: 1 }}
          onPress={() => setTab('incoming')}
        >
          <XStack 
            h={48} 
            br={16} 
            ai="center" 
            jc="center" 
            gap="$2"
            bg={tab === 'incoming' ? '#007AFF' : 'transparent'}
            borderWidth={tab === 'incoming' ? 0 : 1.5}
            borderColor={tab === 'incoming' ? 'transparent' : isDark ? '#2C2C2E' : '$gray4'}
          >
            <ArrowDownLeft size={18} color={tab === 'incoming' ? 'white' : isDark ? '$gray10' : '$gray11'} />
            <Text 
              col={tab === 'incoming' ? 'white' : isDark ? '$gray10' : '$gray11'} 
              fow="800" 
              fos={14}
            >
              {t('friends.requests.incoming', 'Incoming')}
            </Text>
            {requests.incoming.length > 0 && (
              <Circle size={20} bg={tab === 'incoming' ? 'white' : '#007AFF'} ai="center" jc="center">
                <Text col={tab === 'incoming' ? '#007AFF' : 'white'} fos={10} fow="900">
                  {requests.incoming.length}
                </Text>
              </Circle>
            )}
          </XStack>
        </Pressable>

        <Pressable 
          style={{ flex: 1 }}
          onPress={() => setTab('outgoing')}
        >
          <XStack 
            h={48} 
            br={16} 
            ai="center" 
            jc="center" 
            gap="$2"
            bg={tab === 'outgoing' ? '#007AFF' : 'transparent'}
            borderWidth={tab === 'outgoing' ? 0 : 1.5}
            borderColor={tab === 'outgoing' ? 'transparent' : isDark ? '#2C2C2E' : '$gray4'}
          >
            <ArrowUpRight size={18} color={tab === 'outgoing' ? 'white' : isDark ? '$gray10' : '$gray11'} />
            <Text 
              col={tab === 'outgoing' ? 'white' : isDark ? '$gray10' : '$gray11'} 
              fow="800" 
              fos={14}
            >
              {t('friends.requests.outgoing', 'Sent')}
            </Text>
          </XStack>
        </Pressable>
      </XStack>

      <ScrollView f={1} showsVerticalScrollIndicator={false}>
        <YStack p="$4" gap="$4" pb="$20">
          {loading ? (
            <YStack ai="center" py="$10">
              <Spinner size="large" color="#007AFF" />
            </YStack>
          ) : filtered.length === 0 ? (
            <YStack ai="center" py="$20" gap="$4" px="$10">
              <Circle size={100} bg={isDark ? '#1C1C1E' : 'white'} ai="center" jc="center" shadowColor="#000" shadowOpacity={0.05} shadowRadius={20}>
                <Users size={48} color="$gray8" strokeWidth={1.5} />
              </Circle>
              <YStack ai="center" gap="$2">
                <Text col={isDark ? 'white' : '$gray12'} fos={18} fow="800" ta="center">
                  {tab === 'incoming' ? t('friends.requests.none_incoming', 'No incoming requests') : t('friends.requests.none_outgoing', 'No sent requests')}
                </Text>
                <Text col="$gray9" ta="center" fos={14} fow="500">
                  {tab === 'incoming' 
                    ? t('friends.requests.none_incoming_hint', 'No one has sent you a friend request yet') 
                    : t('friends.requests.none_outgoing_hint', "You haven't sent any friend requests yet")}
                </Text>
              </YStack>
              <Button 
                onPress={() => router.push('/tabs/friends/search')}
                bg="#007AFF" 
                br={16} 
                h={52} 
                px="$6"
                pressStyle={{ scale: 0.97 }}
              >
                <Text col="white" fow="800">{t('friends.requests.search', 'Search')}</Text>
              </Button>
            </YStack>
          ) : (
            filtered.map((r: any) => {
              const u = tab === 'incoming' ? r.from : r.to;
              if (!u) return null;

              return (
                <XStack 
                  key={r.id} 
                  bg={isDark ? '#1C1C1E' : 'white'} 
                  br={28} 
                  p="$4" 
                  ai="center" 
                  jc="space-between"
                  shadowColor="#000"
                  shadowOpacity={0.04}
                  shadowRadius={15}
                  elevation={2}
                  borderWidth={1}
                  borderColor={isDark ? '#2C2C2E' : '$gray3'}
                >
                  <XStack ai="center" gap="$3">
                    <UserAvatar 
                      uri={u.avatarUrl} 
                      label={u.username?.charAt(0).toUpperCase()} 
                      size={54} 
                    />
                    <YStack gap="$1">
                      <Text fos={16} fow="900" col={isDark ? 'white' : '$gray12'}>{u.username}</Text>
                      <XStack ai="center" gap="$1.5">
                        <Clock size={12} color="$gray9" />
                        <Text fos={12} col="$gray9" fow="600">
                           {new Date(r.createdAt).toLocaleDateString(language)}
                        </Text>
                      </XStack>
                    </YStack>
                  </XStack>

                  {tab === 'incoming' ? (
                    <XStack gap="$2">
                      <Button 
                        size="$3" 
                        circular 
                        bg="$red9" 
                        onPress={() => respondRequest(u.id, 'rejected')}
                        pressStyle={{ scale: 0.9, opacity: 0.8 }}
                      >
                        <X size={18} color="white" strokeWidth={3} />
                      </Button>
                      <Button 
                        size="$3" 
                        circular 
                        bg="$green9" 
                        onPress={() => respondRequest(u.id, 'accepted')}
                        pressStyle={{ scale: 0.9, opacity: 0.8 }}
                      >
                        <Check size={18} color="white" strokeWidth={3} />
                      </Button>
                    </XStack>
                  ) : (
                    <Button 
                      size="$3" 
                      bg="$gray3" 
                      br={12}
                      onPress={() => cancelRequest(r.id)}
                      pressStyle={{ bg: '$red3' }}
                    >
                      <Text col="$gray11" fos={12} fow="800">{t('common.cancel', 'Cancel')}</Text>
                    </Button>
                  )}
                </XStack>
              );
            })
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
