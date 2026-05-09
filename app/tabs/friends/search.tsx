import { useMemo, useState, useEffect } from 'react';
import { Pressable } from 'react-native';
import {
  YStack,
  XStack,
  Input,
  Button,
  Paragraph,
  ListItem,
  Separator,
  Spinner,
  ScrollView,
  Text,
  Circle,
  View,
} from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Search, ChevronLeft, UserPlus, UserCheck, Clock, User as UserIcon, MessageSquare } from '@tamagui/lucide-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useRouter } from 'expo-router';

import { useFriendsStore } from '@/features/friends/model/friends.store';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { apiClient } from '@/features/auth/api';

function useAutoNotice() {
  const [text, setText] = useState<string | undefined>();
  const [kind, setKind] = useState<'success' | 'error' | undefined>();

  useEffect(() => {
    if (!text) return;
    const timeout = setTimeout(() => {
      setText(undefined);
      setKind(undefined);
    }, 2500);
    return () => clearTimeout(timeout);
  }, [text]);

  return {
    showSuccess: (message: string) => {
      setKind('success');
      setText(message);
    },
    showError: (message: string) => {
      setKind('error');
      setText(message);
    },
    node: text ? (
      <Paragraph col={kind === 'error' ? '$red10' : '$green10'}>{text}</Paragraph>
    ) : null,
  };
}

type UserLite = { uniqueId?: string; username?: string; displayName?: string; id?: number };

export default function FriendsSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { search, send, requestsRaw, friends } = useFriendsStore();
  const meUniqueId = useAppStore((s) => s.user?.uniqueId);
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentLocal, setSentLocal] = useState<Set<string>>(new Set());
  const notice = useAutoNotice();

  const outgoingSet = useMemo(() => {
    const set = new Set<string>();
    (requestsRaw?.outgoing ?? []).forEach((request: any) => {
      const uid = request?.to?.uniqueId ?? request?.toUniqueId ?? request?.uniqueId;
      if (uid) set.add(uid);
    });
    return set;
  }, [requestsRaw?.outgoing]);

  const incomingSet = useMemo(() => {
    const set = new Set<string>();
    (requestsRaw?.incoming ?? []).forEach((request: any) => {
      const uid = request?.from?.uniqueId ?? request?.fromUniqueId ?? request?.uniqueId;
      if (uid) set.add(uid);
    });
    return set;
  }, [requestsRaw?.incoming]);

  const friendsSet = useMemo(() => {
    const set = new Set<string>();
    (friends ?? []).forEach((friend: any) => {
      const uid = friend?.user?.uniqueId ?? friend?.uniqueId;
      if (uid) set.add(uid);
    });
    return set;
  }, [friends]);

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await search(query.trim());
      setResults(response || []);
      if (!response || response.length === 0) {
        notice.showSuccess(t('friends.search.noResults', 'No results found'));
      }
    } catch (error: any) {
      notice.showError(error?.message ?? t('friends.search.error', 'Search failed'));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function sendInvite(uniqueId?: string, label?: string) {
    if (!uniqueId) return;
    setSendingId(uniqueId);
    try {
      await send(uniqueId);
      setSentLocal((prev) => new Set(prev).add(uniqueId));
      const target = label ?? uniqueId ?? t('friends.common.unknownUser', 'Unknown user');
      notice.showSuccess(t('friends.search.inviteSent', { target }));
    } catch (error: any) {
      notice.showError(error?.message ?? t('friends.search.inviteFailed', 'Could not send invite'));
    } finally {
      setSendingId(null);
    }
  }

  async function startChat(uniqueId?: string, title?: string) {
    if (!uniqueId) return;
    try {
      const res = await apiClient.post('/chats', { uniqueId });
      router.push({
        pathname: `/tabs/chat/${res.data.id}`,
        params: { title }
      });
    } catch (error) {
      console.error('Failed to start chat from search:', error);
    }
  }

  const onSubmit = () => {
    if (!loading) doSearch();
  };

  const statusLabels = useMemo(
    () => ({
      add: t('friends.status.add', 'Add'),
      you: t('friends.status.you', 'You'),
      friend: t('friends.status.friend', 'Friend'),
      requested: t('friends.status.requested', 'Requested'),
      incoming: t('friends.status.incoming', 'Incoming'),
    }),
    [t]
  );

  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';

  return (
    <YStack f={1} bg={isDark ? '#000000' : '#F8F9FA'} pb={120}>
      {/* Premium Header */}
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : ['#007AFF', '#00C6FF']}
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 40,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
          <YStack ai="center" jc="space-between" mb="$6">
          <Pressable onPress={() => router.back()}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.1)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={20} fow="900">{t('navigation.search', 'Search')}</Text>
          <View width={40} />
        </XStack>

        <XStack 
          bg={isDark ? '#1C1C1E' : 'white'} 
          br={18} 
          px="$3" 
          ai="center" 
          shadowColor="#000"
          shadowOpacity={isDark ? 0.3 : 0.1}
          shadowRadius={10}
          elevation={5}
        >
          <Search size={20} color="#64748B" />
          <Input
            f={1}
            value={query}
            onChangeText={setQuery}
            placeholder={t('friends.search.placeholder', 'Nickname or uniqueId...')}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={onSubmit}
            returnKeyType="search"
            borderWidth={0}
            focusStyle={{ borderWidth: 0 }}
            bg="transparent"
            height={50}
            fos={16}
            col={isDark ? 'white' : '$gray12'}
          />
          <Button 
            size="$3" 
            circular 
            bg="#007AFF" 
            onPress={doSearch} 
            disabled={!query || loading}
            pressStyle={{ scale: 0.92, opacity: 0.8 }}
          >
            {loading ? <Spinner color="white" /> : <Search size={18} color="white" />}
          </Button>
        </XStack>
      </LinearGradient>

      {notice.node && (
        <YStack px="$4" py="$2">
          {notice.node}
        </YStack>
      )}

      <ScrollView f={1} px="$3" pt="$4">
        {loading && results.length === 0 ? (
          <YStack ai="center" py="$10">
            <Spinner size="large" color="#007AFF" />
          </YStack>
        ) : results.length === 0 ? (
          <YStack ai="center" py="$12" opacity={0.5} gap="$4">
            <Circle size={80} bg={isDark ? '#1C1C1E' : '$gray3'} ai="center" jc="center">
               <UserIcon size={40} color={isDark ? '#475569' : '$gray8'} />
            </Circle>
            <YStack ai="center" gap="$1">
               <Text fos={18} fow="800" col={isDark ? 'white' : '$gray11'}>{t('friends.search.findTitle', 'Find a user')}</Text>
               <Text fos={14} fow="600" col="$gray8" ta="center" px="$6">
                  {t('friends.search.hint', 'Search friends by their Unique ID')}
               </Text>
            </YStack>
          </YStack>
        ) : (
          <YStack gap="$3">
            {results.map((user, index) => {
              const uid = user.uniqueId;
              const fallbackTitle = user.displayName || user.username || uid;
              const title = fallbackTitle ?? t('friends.common.unknownUser', 'Unknown user');

              const isMe = !!uid && !!meUniqueId && uid === meUniqueId;
              const isFriend = !!uid && friendsSet.has(uid);
              const isOutgoing = !!uid && (outgoingSet.has(uid) || sentLocal.has(uid));
              const isIncoming = !!uid && incomingSet.has(uid);

              let actionLabel = statusLabels.add;
              let actionIcon = <UserPlus size={16} color="white" />;
              let disabled = false;
              let btnVariant: 'primary' | 'secondary' = 'primary';

              if (isMe) {
                actionLabel = statusLabels.you;
                actionIcon = null;
                disabled = true;
                btnVariant = 'secondary';
              } else if (isFriend) {
                actionLabel = statusLabels.friend;
                actionIcon = <UserCheck size={16} color="#007AFF" />;
                disabled = true;
                btnVariant = 'secondary';
              } else if (isOutgoing) {
                actionLabel = statusLabels.requested;
                actionIcon = <Clock size={16} color="#64748B" />;
                disabled = true;
                btnVariant = 'secondary';
              } else if (isIncoming) {
                actionLabel = statusLabels.incoming;
                actionIcon = <UserPlus size={16} color="#007AFF" />;
                disabled = true;
                btnVariant = 'secondary';
              }

              const isBusy = sendingId === uid;

              return (
                <XStack 
                  key={`${uid ?? 'u'}-${index}`}
                  bg={isDark ? '#1C1C1E' : 'white'} 
                  br={20} 
                  p="$3" 
                  ai="center" 
                  jc="space-between"
                  shadowColor="#000"
                  shadowOpacity={isDark ? 0.3 : 0.03}
                  shadowRadius={10}
                  elevation={2}
                >
                  <XStack ai="center" gap="$3" f={1}>
                    <UserAvatar label={title.slice(0, 1).toUpperCase()} size={48} />
                    <YStack f={1}>
                      <Text fos={15} fow="800" col={isDark ? 'white' : '#1E293B'} numberOfLines={1}>{title}</Text>
                      <Text fos={12} fow="600" col="$gray9" numberOfLines={1}>@{uid}</Text>
                    </YStack>
                  </XStack>

                  <XStack ai="center" gap="$2">
                    <Button
                      size="$3"
                      br="$10"
                      bg={btnVariant === 'primary' ? "#007AFF" : (isDark ? "#2C2C2E" : "$gray3")}
                      onPress={() => sendInvite(uid, title)}
                      disabled={!uid || disabled || isBusy}
                      pressStyle={{ scale: 0.92, opacity: 0.8 }}
                      icon={isBusy ? <Spinner color="white" /> : actionIcon}
                    >
                      <Text col={btnVariant === 'primary' ? "white" : "$gray10"} fow="800" fos={13}>
                        {isBusy ? '' : actionLabel}
                      </Text>
                    </Button>

                    <Button
                      size="$3"
                      circular
                      bg="rgba(0,122,255,0.1)"
                      onPress={() => startChat(uid, title)}
                      pressStyle={{ scale: 0.92, opacity: 0.8 }}
                    >
                      <MessageSquare size={18} color="#007AFF" />
                    </Button>
                  </XStack>
                </XStack>
              );
            })}
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
}
