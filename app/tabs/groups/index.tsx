import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, View, Circle, Spinner, Separator, Button } from 'tamagui';
import { 
  ChevronLeft, Plus, Users, ChevronRight, 
  Scan, Info, Layers, UserCheck 
} from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useGroupsStore } from '@/features/groups/model/groups.store';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useAppStore } from '@/shared/lib/stores/app-store';

function AvatarStack({ members, totalCount, max = 4 }: { members?: any[], totalCount?: number, max?: number }) {
  const list = members || [];
  const total = totalCount || list.length;
  const shown = list.slice(0, max);
  const extra = Math.max(0, total - shown.length);

  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';

  return (
    <XStack ai="center">
      {shown.map((m, i) => (
        <View key={i} ml={i === 0 ? 0 : -12} shadowColor="#000" shadowOpacity={0.1} shadowRadius={5}>
          <UserAvatar 
            label={(m.username || 'U').slice(0, 1).toUpperCase()} 
            size={34} 
            borderWidth={2} 
            borderColor={isDark ? '#1C1C1E' : 'white'} 
          />
        </View>
      ))}
      {extra > 0 && (
        <Circle size={34} bg={isDark ? '#475569' : '$gray12'} ml={-12} bw={2} bc={isDark ? '#1C1C1E' : 'white'} ai="center" jc="center">
          <Text col="white" fos={10} fow="900">+{extra}</Text>
        </Circle>
      )}
    </XStack>
  );
}

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { groups, counts, loading, fetchGroups } = useGroupsStore();

  useEffect(() => { fetchGroups(); }, []);

  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';

  return (
    <YStack f={1} bg={isDark ? '#000000' : '#F8F9FA'}>
      {/* Ultra-Premium Header */}
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
          <Text col="white" fos={20} fow="900">Guruhlar</Text>
          <XStack gap="$2">
            <Pressable onPress={() => router.push('/tabs/scan-invite')}>
              <YStack p="$2" br={12} bg="rgba(255,255,255,0.1)">
                <Scan size={22} color="white" />
              </YStack>
            </Pressable>
            <Pressable onPress={() => router.push('/tabs/groups/create')}>
              <YStack p="$2" br={12} bg="#007AFF">
                <Plus size={22} color="white" />
              </YStack>
            </Pressable>
          </XStack>
        </XStack>
      </LinearGradient>

      <ScrollView 
        f={1} 
        p="$5" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchGroups} />}
      >
        <YStack gap="$4" pb="$20">
          {loading && !groups.length ? (
            <YStack ai="center" py="$10"><Spinner color="#007AFF" /></YStack>
          ) : groups.map((g) => (
            <Pressable 
              key={g.id} 
              onPress={() => router.push(`/tabs/groups/${g.id}`)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }]
              })}
            >
              <YStack 
                bg={isDark ? '#1C1C1E' : 'white'} 
                br={28} 
                p="$5" 
                gap="$4"
                shadowColor="#000"
                shadowOpacity={isDark ? 0.3 : 0.05}
                shadowRadius={15}
                elevation={5}
                borderWidth={1}
                borderColor={isDark ? '#2C2C2E' : '$gray3'}
              >
                <XStack jc="space-between" ai="center">
                   <YStack gap="$1">
                      <Text fontSize={18} fontWeight="900" col={isDark ? 'white' : '#1E293B'}>{g.name}</Text>
                      <XStack ai="center" gap="$2">
                         <Layers size={14} color="$gray9" />
                         <Text fontSize={12} col="$gray9" fontWeight="600">{counts?.[g.id] || g.members?.length || 0} ta a'zo</Text>
                      </XStack>
                   </YStack>
                   <AvatarStack members={g.members} totalCount={counts?.[g.id]} />
                </XStack>
                
                <Separator borderColor={isDark ? '#2C2C2E' : '$gray2'} />
                
                <XStack jc="space-between" ai="center">
                   <XStack ai="center" gap="$2">
                      <Circle size={8} bg="#10B981" />
                      <Text fontSize={12} col="$gray10" fontWeight="700">Faol guruh</Text>
                   </XStack>
                   <ChevronRight size={18} color="$gray8" />
                </XStack>
              </YStack>
            </Pressable>
          ))}
          {!loading && !groups.length && (
            <YStack ai="center" py="$20" gap="$4">
              <Circle size={80} bg={isDark ? '#1C1C1E' : '$gray2'} ai="center" jc="center">
                <Users size={40} color="$gray8" />
              </Circle>
              <Text col="$gray9" fow="700" fos={16}>Guruhlar hali yo'q</Text>
              <Button onPress={() => router.push('/tabs/groups/create')} bg="#007AFF" br={16} h={48} px="$6">
                <Text col="white" fow="800">Guruh yaratish</Text>
              </Button>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
