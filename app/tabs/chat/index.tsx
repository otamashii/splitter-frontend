import React, { useEffect, useState, useCallback } from 'react';
import { Pressable, ScrollView, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, View, Circle, Spinner, Separator } from 'tamagui';
import { ChevronLeft, Search, MoreVertical, MessageSquarePlus, CheckCheck, MessageSquare } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import UserAvatar from '@/shared/ui/UserAvatar';
import { apiClient as api } from '@/features/auth/api';
import { useAppStore } from '@/shared/lib/stores/app-store';

function ChatListItem({ chat, currentUserId, onPress }: { chat: any, currentUserId?: number, onPress: () => void }) {
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';
  const otherMember = chat.members?.find((m: any) => m.userId !== currentUserId);
  const title = chat.type === 'GROUP' ? chat.group?.name : (otherMember?.user?.displayName || otherMember?.user?.username || 'Chat');
  const lastMsg = chat.messages?.[0]?.content || 'Xabarlar yo\'q';
  const time = chat.messages?.[0]?.createdAt ? new Date(chat.messages[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({
      opacity: pressed ? 0.7 : 1,
      backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,122,255,0.05)') : 'transparent'
    })}>
      <XStack p="$4" ai="center" gap="$3">
        <View>
          <UserAvatar 
            uri={chat.type === 'GROUP' ? undefined : otherMember?.user?.avatarUrl} 
            label={title.slice(0, 1).toUpperCase()} 
            size={56} 
          />
        </View>
        <YStack f={1} gap="$1">
          <XStack jc="space-between" ai="center">
            <Text fontSize={16} fontWeight="800" col={isDark ? 'white' : '#1E293B'}>{title}</Text>
            <Text fontSize={12} col="$gray9" fontWeight="600">{time}</Text>
          </XStack>
          <XStack ai="center" gap="$2">
            {otherMember?.user?.uniqueId && (
              <Text fontSize={13} col="#007AFF" fontWeight="700">@{otherMember.user.uniqueId}</Text>
            )}
            {lastMsg && lastMsg !== 'Xabarlar yo\'q' && (
              <Text fontSize={13} col="$gray9" fontWeight="500" numberOfLines={1} f={1}>
                • {lastMsg}
              </Text>
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
          <Pressable onPress={() => router.back()}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.1)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={20} fow="900">Chatlar</Text>
          <XStack gap="$2">
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.1)">
               <Search size={20} color="white" />
            </YStack>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.1)">
               <MoreVertical size={20} color="white" />
            </YStack>
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
    </YStack>
  );
}

const S = StyleSheet.create({
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
