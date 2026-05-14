import React, { useEffect, useState, useCallback } from 'react';
import { Pressable, ScrollView, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, View, Circle, Spinner, Separator, Sheet } from 'tamagui';
import { ChevronLeft, Search, MoreVertical, MessageSquarePlus, CheckCheck, MessageSquare, Users, UserPlus, Settings, Check } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import UserAvatar from '@/shared/ui/UserAvatar';
import { apiClient as api } from '@/features/auth/api';
import { useAppStore } from '@/shared/lib/stores/app-store';

function ChatListItem({ chat, currentUserId, onPress }: { chat: any, currentUserId?: number, onPress: () => void }) {
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';
  const isGroup = chat.type === 'GROUP';
  const otherMember = chat.members?.find((m: any) => m.userId !== currentUserId);
  const title = isGroup ? chat.group?.name : (otherMember?.user?.displayName || otherMember?.user?.username || 'Chat');
  const lastMsg = chat.messages?.[0]?.content || 'Xabarlar yo\'q';
  const time = chat.messages?.[0]?.createdAt ? new Date(chat.messages[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({
      opacity: pressed ? 0.7 : 1,
      backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,122,255,0.05)') : 'transparent'
    })}>
      <XStack p="$4" ai="center" gap="$3">
        <View>
          {isGroup ? (
            <Circle size={56} bg="$blue3" ai="center" jc="center">
              <Users size={28} color="#007AFF" />
            </Circle>
          ) : (
            <UserAvatar 
              uri={otherMember?.user?.avatarUrl} 
              label={title.slice(0, 1).toUpperCase()} 
              size={56} 
            />
          )}
        </View>
        <YStack f={1} gap="$1">
          <XStack jc="space-between" ai="center">
            <XStack ai="center" gap="$2" f={1}>
              <Text fontSize={16} fontWeight="800" col={isDark ? 'white' : '#1E293B'} numberOfLines={1} f={1}>{title}</Text>
              {isGroup && (
                <View bg="rgba(0,122,255,0.1)" px="$2" py="$0.5" br={6}>
                  <Text fontSize={10} fontWeight="800" col="#007AFF" textTransform="uppercase">Guruh</Text>
                </View>
              )}
            </XStack>
            <Text fontSize={12} col="$gray9" fontWeight="600">{time}</Text>
          </XStack>
          <XStack ai="center" gap="$2">
            {!isGroup && otherMember?.user?.uniqueId && (
              <Text fontSize={13} col="#007AFF" fontWeight="700">@{otherMember.user.uniqueId}</Text>
            )}
            {isGroup && chat.messages?.[0]?.sender?.username && (
              <Text fontSize={13} col="$gray10" fontWeight="700" numberOfLines={1}>{chat.messages[0].sender.username}:</Text>
            )}
            {lastMsg && lastMsg !== 'Xabarlar yo\'q' && (
              <Text fontSize={13} col="$gray9" fontWeight="500" numberOfLines={1} f={1}>
                {lastMsg}
              </Text>
            )}
            {lastMsg === 'Xabarlar yo\'q' && (
              <Text fontSize={13} col="$gray8" fontStyle="italic" f={1}>{lastMsg}</Text>
            )}
          </XStack>
        </YStack>
      </XStack>
    </Pressable>
  );
}

export default function ChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAppStore();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const { t } = useTranslation();

  const markAllRead = async () => {
    setShowMenu(false);
    alert(t('chat.alerts.markAllReadSuccess', 'Hamma xabarlar o\'qildi'));
  };

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get('/chats');
      setChats(res.data);
    } catch (err) {
      console.error('Fetch chats error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [fetchChats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';

  return (
    <YStack f={1} bg={isDark ? '#000000' : 'white'}>
      {/* Premium Dark Header */}
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : ['#007AFF', '#00C6FF']}
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 25,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <XStack ai="center" jc="space-between" mb="$5">
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => ({
              opacity: pressed ? 0.4 : 1,
              transform: [{ scale: pressed ? 0.85 : 1 }]
            })}
          >
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.15)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={20} fow="900">Chatlar</Text>
          <XStack gap="$2">
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.1)">
               <Search size={20} color="white" />
            </YStack>
            <Pressable onPress={() => setShowMenu(true)}>
              <YStack p="$2" br={12} bg="rgba(255,255,255,0.1)">
                 <MoreVertical size={20} color="white" />
              </YStack>
            </Pressable>
          </XStack>
        </XStack>
      </LinearGradient>

      <ScrollView 
        f={1} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
      >
        <YStack pb="$20">
          {loading ? (
            <YStack ai="center" py="$10">
              <ActivityIndicator color="#007AFF" />
            </YStack>
          ) : chats.length === 0 ? (
            <YStack ai="center" py="$20" gap="$4">
              <Circle size={80} bg="$gray2" ai="center" jc="center">
                <MessageSquare size={40} color="$gray8" />
              </Circle>
              <YStack ai="center" gap="$1">
                <Text fos={18} fow="800" col={isDark ? 'white' : '#1E293B'}>Chatlar yo'q</Text>
                <Text fos={14} col="$gray9">Do'stlaringizga xabar yuborishni boshlang</Text>
              </YStack>
            </YStack>
          ) : (
            chats.map((chat: any, i) => (
              <React.Fragment key={chat.id}>
                <ChatListItem 
                  chat={chat} 
                  currentUserId={user?.id}
                  onPress={() => router.push({
                    pathname: `/tabs/chat/${chat.id}`,
                    params: { 
                      title: chat.type === 'GROUP' ? chat.group?.name : chat.members?.find((m: any) => m.userId !== user?.id)?.user?.displayName || 'Chat'
                    }
                  })} 
                />
                {i < chats.length - 1 && <Separator ml={80} borderColor={isDark ? '#2C2C2E' : '$gray3'} />}
              </React.Fragment>
            ))
          )}
        </YStack>
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable 
        style={({ pressed }) => [
          S.fab,
          { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
        ]}
        onPress={() => router.push('/tabs/friends')}
      >
        <LinearGradient
          colors={['#007AFF', '#0055FF']}
          style={S.fabGradient}
        >
          <MessageSquarePlus size={28} color="white" />
        </LinearGradient>
      </Pressable>

      <Sheet
        modal
        open={showMenu}
        onOpenChange={setShowMenu}
        snapPoints={[35]}
        dismissOnSnapToBottom
        animation="medium"
      >
        <Sheet.Overlay bg="rgba(0,0,0,0.5)" />
        <Sheet.Frame p="$4" bg={isDark ? '#1C1C1E' : '#FFFFFF'} borderTopLeftRadius={32} borderTopRightRadius={32}>
          <Sheet.Handle />
          <YStack gap="$2" mt="$4">
            <Pressable 
              onPress={markAllRead}
              style={({ pressed }) => [S.menuItem, pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
            >
              <XStack ai="center" gap="$3" p="$3" br={12}>
                <CheckCheck size={22} color="#007AFF" />
                <Text fontSize={17} fontWeight="600" color={isDark ? '#FFFFFF' : '#000000'}>{t('chat.actions.markAllRead', 'Hamma o\'qilgan')}</Text>
              </XStack>
            </Pressable>

            <Pressable 
              onPress={() => { setShowMenu(false); router.push('/tabs/groups/create'); }}
              style={({ pressed }) => [S.menuItem, pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
            >
              <XStack ai="center" gap="$3" p="$3" br={12}>
                <Users size={22} color="#007AFF" />
                <Text fontSize={17} fontWeight="600" color={isDark ? '#FFFFFF' : '#000000'}>{t('chat.actions.newGroup', 'Yangi guruh')}</Text>
              </XStack>
            </Pressable>

            <Pressable 
              onPress={() => { setShowMenu(false); router.push('/tabs/profile'); }}
              style={({ pressed }) => [S.menuItem, pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
            >
              <XStack ai="center" gap="$3" p="$3" br={12}>
                <Settings size={22} color="#007AFF" />
                <Text fontSize={17} fontWeight="600" color={isDark ? '#FFFFFF' : '#000000'}>{t('chat.actions.settings', 'Sozlamalar')}</Text>
              </XStack>
            </Pressable>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}

const S = StyleSheet.create({
  menuItem: {
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 100,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
