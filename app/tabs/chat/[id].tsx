import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, XStack, YStack, Circle, Sheet, Spinner, Separator, ScrollView } from 'tamagui';
import { StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Send, MoreVertical, Plus, User, AtSign, Calendar, MessageCircle, ArrowUpRight, MapPin, Image as ImageIcon, FileText, Search as SearchIcon, Trash, Eraser, BellOff, Mic, Play, Pause, Square, Volume2, Users as UsersIcon, MessageSquare } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { apiClient as api } from '@/features/auth/api';
import { FriendsApi } from '@/features/friends/api/friends.api';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import UserAvatar from '@/shared/ui/UserAvatar';
import { LinearGradient } from 'expo-linear-gradient';

interface Message {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  edited?: boolean;
  replyToId?: number | null;
  replyTo?: {
    id: number;
    content: string;
    sender: {
      username: string;
    };
  } | null;
  forwardFrom?: {
    id: number;
    username: string;
  } | null;
  type?: 'TEXT' | 'AUDIO' | 'IMAGE' | 'LOCATION';
  audioUrl?: string | null;
}

const AudioPlayer = ({ url, isDark }: { url: string; isDark: boolean }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const togglePlayback = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        (status: any) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 0);
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
            }
          }
        }
      );
      setSound(newSound);
    }
  };

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <XStack ai="center" gap="$3" py="$2" px="$1" minWidth={180}>
      <Pressable onPress={togglePlayback}>
        <Circle size={40} bg={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} ai="center" jc="center">
          {isPlaying ? <Pause size={20} color={isDark ? 'white' : '#007AFF'} /> : <Play size={20} color={isDark ? 'white' : '#007AFF'} ml={2} />}
        </Circle>
      </Pressable>
      <YStack f={1} gap="$1">
        <View h={3} bg={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'} br={2}>
          <View h="100%" bg={isDark ? 'white' : '#007AFF'} br={2} w={`${(position / (duration || 1)) * 100}%`} />
        </View>
        <XStack jc="space-between">
          <Text fontSize={10} color={isDark ? 'rgba(255,255,255,0.6)' : '$gray10'}>
            {formatTime(position)}
          </Text>
          <Text fontSize={10} color={isDark ? 'rgba(255,255,255,0.6)' : '$gray10'}>
            {formatTime(duration)}
          </Text>
        </XStack>
      </YStack>
    </XStack>
  );
};

export default function ChatRoomScreen() {
  const { id, title: initialTitle } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme, user: currentUser } = useAppStore();
  const isDark = theme === 'dark';

  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showMessageActions, setShowMessageActions] = useState<Message | null>(null);
  const [showForwardSheet, setShowForwardSheet] = useState<Message | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const recordTimer = useRef<any>(null);

  const flatListRef = useRef<FlatList>(null);

  const otherMember = useMemo(() => {
    if (!chat?.members || !currentUser?.id) return null;
    return chat.members.find((m: any) => String(m.userId) !== String(currentUser.id))?.user;
  }, [chat, currentUser]);

  const displayTitle = chat?.type === 'GROUP' ? chat.group?.name : (otherMember?.username || initialTitle || 'Chat');

  const fetchChatData = async () => {
    try {
      const res = await api.get(`/chats/details/${id}`);
      setChat(res.data);
    } catch (err) {
      console.error('Fetch chat metadata error:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chats/${id}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || id === 'undefined') return;
    fetchChatData();
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => {
      clearInterval(interval);
      if (recordTimer.current) clearInterval(recordTimer.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, [id]);

  const onSend = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setSending(true);

    try {
      if (editingMessage) {
        await api.patch(`/chats/messages/${editingMessage.id}`, { content });
        setEditingMessage(null);
      } else {
        await api.post(`/chats/${id}/messages`, { 
          content, 
          replyToId: replyingTo?.id 
        });
        setReplyingTo(null);
      }
      setText('');
      fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const startEdit = (msg: Message) => {
    setEditingMessage(msg);
    setText(msg.content);
    setReplyingTo(null);
    setShowMessageActions(null);
  };

  const startReply = (msg: Message) => {
    setReplyingTo(msg);
    setEditingMessage(null);
    setShowMessageActions(null);
  };

  const startForward = async (msg: Message) => {
    setShowMessageActions(null);
    setShowForwardSheet(msg);
    setFriendsLoading(true);
    try {
      const list = await FriendsApi.list();
      setFriends(list);
    } catch (e) {
      console.error('Fetch friends failed:', e);
    } finally {
      setFriendsLoading(false);
    }
  };

  const onForward = async (msg: Message, targetUniqueId: string) => {
    try {
      await api.post('/chats/forward', {
        messageId: msg.id,
        targetUniqueId
      });
      setShowForwardSheet(null);
    } catch (e) {
      console.error('Forward failed:', e);
    }
  };

  const sendLocation = async () => {
    setShowAttachmentMenu(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('chat.alerts.locationError'));
        return;
      }

      setSending(true);
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      
      await api.post(`/chats/${id}/messages`, { 
        content: `${t('chat.attachments.myLocation')}\n${mapsUrl}` 
      });
      fetchMessages();
    } catch (e) {
      console.error('Location error:', e);
      Alert.alert(t('common.error'), t('chat.alerts.locationFail'));
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {}
        recordingRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = newRecording;
      setIsRecording(true);
      setRecordDuration(0);
      if (recordTimer.current) clearInterval(recordTimer.current);
      recordTimer.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert(t('common.error'), t('chat.recording.error'));
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    clearInterval(recordTimer.current);
    try {
      const rec = recordingRef.current;
      recordingRef.current = null; 
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      if (uri) {
        uploadAndSendAudio(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const uploadAndSendAudio = async (uri: string) => {
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: `voice_${Date.now()}.m4a`,
        type: 'audio/m4a',
      } as any);

      const uploadRes = await api.post('/uploads/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (uploadRes.data.success) {
        await api.post(`/chats/${id}/messages`, {
          type: 'AUDIO',
          audioUrl: uploadRes.data.url,
          replyToId: replyingTo?.id
        });
        fetchMessages();
      }
    } catch (err) {
      console.error('Upload audio failed', err);
    } finally {
      setSending(false);
    }
  };

  const clearHistory = () => {
    Alert.alert(
      t('chat.alerts.clearTitle'),
      t('chat.alerts.clearMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.confirm'), 
          style: 'destructive',
          onPress: async () => {
            setShowHeaderMenu(false);
            try {
              await api.delete(`/chats/${id}/messages`);
              setMessages([]);
            } catch (e) {
              console.error('Clear history error:', e);
            }
          }
        }
      ]
    );
  };

  const deleteChat = () => {
    Alert.alert(
      t('chat.alerts.deleteTitle'),
      t('chat.alerts.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.confirm'), 
          style: 'destructive',
          onPress: async () => {
            setShowHeaderMenu(false);
            try {
              await api.delete(`/chats/${id}`);
              router.back();
            } catch (e) {
              console.error('Delete chat error:', e);
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === currentUser?.id;
    const time = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[S.messageWrapper, isMe ? S.messageWrapperMe : S.messageWrapperThem]}>
        <Pressable 
          onLongPress={() => setShowMessageActions(item)}
          style={({ pressed }) => [
            S.messageBubble, 
            isMe ? (isDark ? S.bubbleMeDark : S.bubbleMeLight) : (isDark ? S.bubbleThemDark : S.bubbleThemLight),
            isMe ? S.bubbleRadiusMe : S.bubbleRadiusThem,
            pressed && { opacity: 0.8 }
          ]}
        >
          {item.forwardFrom && (
            <XStack ai="center" gap="$1" mb="$1">
              <ArrowUpRight size={12} color={isMe ? 'rgba(255,255,255,0.6)' : '$gray10'} />
              <Text fontSize={11} color={isMe ? 'rgba(255,255,255,0.6)' : '$gray10'} fontStyle="italic">
                {t('chat.forwarded', { username: item.forwardFrom.username })}
              </Text>
            </XStack>
          )}
          {item.replyTo && (
            <YStack 
              bg="rgba(0,0,0,0.05)" 
              br={8} 
              p="$2" 
              mb="$2" 
              borderLeftWidth={3} 
              borderColor="#007AFF"
            >
              <Text fontSize={12} fontWeight="800" color="#007AFF" numberOfLines={1}>
                {item.replyTo.sender.username}
              </Text>
              <Text fontSize={13} color={isMe ? 'rgba(255,255,255,0.8)' : '$gray11'} numberOfLines={1}>
                {item.replyTo.content}
              </Text>
            </YStack>
          )}
          {item.type === 'AUDIO' && item.audioUrl ? (
            <AudioPlayer url={item.audioUrl} isDark={isMe} />
          ) : (
            <Text fontSize={16} color={isMe ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000')} lineHeight={22}>
              {item.content}
            </Text>
          )}
          <XStack ai="center" gap="$1" alignSelf="flex-end" mt="$1">
            {item.edited && (
              <Text fontSize={10} color={isMe ? 'rgba(255,255,255,0.5)' : '#8E8E93'} fontWeight="600">
                {t('chat.edited')}
              </Text>
            )}
            <Text 
              fontSize={11} 
              color={isMe ? 'rgba(255,255,255,0.7)' : '#8E8E93'} 
            >
              {time}
            </Text>
          </XStack>
        </Pressable>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#F2F2F7' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View 
        backgroundColor={isDark ? '#1C1C1E' : '#FFFFFF'} 
        pt={insets.top + 10} 
        pb="$3"
        borderBottomWidth={StyleSheet.hairlineWidth}
        borderColor={isDark ? '#38383A' : '#E5E5EA'}
        zIndex={10}
      >
        <XStack ai="center" jc="space-between" px="$2">
          <XStack ai="center" f={1}>
            <Pressable 
              onPress={() => router.back()} 
              style={({ pressed }) => [
                S.backBtn, 
                { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] }
              ]}
            >
              <ChevronLeft size={28} color={isDark ? '#0A84FF' : '#007AFF'} />
            </Pressable>
            
            <Pressable onPress={() => setShowProfile(true)} style={({ pressed }) => [{ flex: 1, flexDirection: 'row', alignItems: 'center' }, pressed && { opacity: 0.7 }]}>
              <UserAvatar 
                uri={otherMember?.avatarUrl} 
                label={displayTitle.slice(0, 1).toUpperCase()} 
                size={40} 
              />
              <YStack ml="$2.5" f={1}>
                <Text fontSize={17} fontWeight="800" color={isDark ? '#FFFFFF' : '#1A1A1A'} numberOfLines={1}>
                  {displayTitle}
                </Text>
                {chat?.type === 'GROUP' ? (
                  <Text fontSize={12} color="$gray10" fontWeight="600">
                    {chat.members?.length || 0} {t('chat.members', 'a\'zolar')}
                  </Text>
                ) : (
                  otherMember?.uniqueId && (
                    <Text fontSize={12} color="$gray10" fontWeight="600">@{otherMember.uniqueId}</Text>
                  )
                )}
              </YStack>
            </Pressable>
          </XStack>
          
          <Pressable onPress={() => setShowHeaderMenu(true)} style={({ pressed }) => [{ padding: 10 }, pressed && { opacity: 0.6 }]}>
            <Circle size={36} backgroundColor={isDark ? '#2C2C2E' : '#F8F9FA'}>
              <MoreVertical size={20} color={isDark ? '#0A84FF' : '#007AFF'} />
            </Circle>
          </Pressable>
        </XStack>
      </View>

      <View flex={1} backgroundColor={isDark ? '#000000' : '#F8F9FA'}>
        {loading ? (
          <View f={1} ai="center" jc="center">
            <ActivityIndicator color={isDark ? '#0A84FF' : '#007AFF'} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={{ 
              padding: 16, 
              paddingBottom: Platform.OS === 'ios' ? 220 : 200, 
              gap: 4 
            }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
      </View>

      <View 
        backgroundColor={isDark ? '#1C1C1E' : '#FFFFFF'} 
        mx="$4"
        mb={Platform.OS === 'ios' ? insets.bottom + 90 : insets.bottom + 100}
        br={24}
        p="$2"
        shadowColor="#000"
        shadowOpacity={0.12}
        shadowRadius={20}
        elevation={8}
      >
        {(replyingTo || editingMessage) && (
          <XStack ai="center" jc="space-between" px="$3" py="$2" borderBottomWidth={StyleSheet.hairlineWidth} borderColor="$gray3">
            <XStack ai="center" gap="$3" f={1}>
              <View width={3} height={30} bg="#007AFF" br={2} />
              <YStack f={1}>
                <Text fontSize={13} fontWeight="800" color="#007AFF">
                  {editingMessage ? t('chat.editing') : (replyingTo?.senderId === currentUser?.id ? t('chat.replyToSelf') : t('chat.replyingTo'))}
                </Text>
                <Text fontSize={14} color="$gray11" numberOfLines={1}>
                  {editingMessage ? editingMessage.content : replyingTo?.content}
                </Text>
              </YStack>
            </XStack>
            <Pressable onPress={() => { setReplyingTo(null); setEditingMessage(null); if(editingMessage) setText(''); }}>
              <Circle size={24} bg="$gray3" ai="center" jc="center">
                <Text fontSize={16} col="$gray10">×</Text>
              </Circle>
            </Pressable>
          </XStack>
        )}
        <XStack ai="center" gap="$2" p="$1.5">
          <View 
            flex={1} 
            backgroundColor={isDark ? '#2C2C2E' : '#F2F2F7'} 
            borderRadius={24} 
            minHeight={44}
            maxHeight={120}
            jc="center"
            px="$2.5"
            py="$1"
          >
            {isRecording ? (
              <XStack ai="center" jc="space-between" px="$2" f={1}>
                <XStack ai="center" gap="$2">
                  <Circle size={10} bg="#FF3B30" />
                  <Text fontWeight="700" color="#FF3B30">
                    {Math.floor(recordDuration / 60)}:{ (recordDuration % 60).toString().padStart(2, '0') }
                  </Text>
                </XStack>
                <Pressable onPress={() => { setIsRecording(false); clearInterval(recordTimer.current); recordingRef.current = null; }}>
                  <Text color="#007AFF" fontWeight="600">{t('chat.recording.delete')}</Text>
                </Pressable>
              </XStack>
            ) : (
              <XStack ai="center" gap="$2">
                <Pressable 
                  onPress={() => setShowAttachmentMenu(true)}
                  style={({ pressed }) => [S.attachBtn, pressed && { opacity: 0.6 }]}
                >
                  <Plus size={22} color="#007AFF" />
                </Pressable>
                
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder={t('chat.placeholder')}
                  placeholderTextColor="#8E8E93"
                  multiline
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: isDark ? '#FFFFFF' : '#000000',
                    paddingTop: 8,
                    paddingBottom: 8,
                    minHeight: 24,
                  }}
                />
              </XStack>
            )}
          </View>

          {isRecording ? (
             <Pressable onPress={stopRecording} style={({ pressed }) => [S.sendBtn, pressed && { opacity: 0.6, transform: [{ scale: 1.1 }] }]}>
               <Send size={20} color="white" />
             </Pressable>
          ) : text.trim().length > 0 ? (
            <Pressable onPress={onSend} style={({ pressed }) => [S.sendBtn, pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] }]}>
              <Send size={20} color="white" />
            </Pressable>
          ) : (
            <Pressable 
              onPress={startRecording}
              style={({ pressed }) => [S.sendBtn, pressed && { opacity: 0.6, transform: [{ scale: 1.1 }] }]}
            >
              <Mic size={20} color="white" />
            </Pressable>
          )}
        </XStack>
      </View>

      <Sheet
        modal
        open={showProfile}
        onOpenChange={setShowProfile}
        snapPoints={[65]}
        dismissOnSnapToBottom
        animation="medium"
      >
        <Sheet.Overlay bg="rgba(0,0,0,0.5)" />
        <Sheet.Frame br={40} bg={isDark ? '#0F172A' : 'white'} p="$6">
          <Sheet.Handle bg="$gray5" />
          <YStack ai="center" gap="$5" mt="$4">
            <View p="$1" br={50} bg="$blue3">
               {chat?.type === 'GROUP' ? (
                 <Circle size={120} bg="$blue3" ai="center" jc="center">
                   <UsersIcon size={60} color="#007AFF" />
                 </Circle>
               ) : (
                 <UserAvatar uri={otherMember?.avatarUrl} label={displayTitle.slice(0, 1).toUpperCase()} size={120} />
               )}
            </View>
            
            <YStack ai="center" gap="$2">
              <Text fontSize={28} fontWeight="900" col={isDark ? 'white' : '#0F172A'}>{displayTitle}</Text>
              {chat?.type === 'GROUP' ? (
                <View bg="$blue2" px="$3" py="$1" br={12}>
                   <Text fontSize={16} fontWeight="700" col="#007AFF">{t('chat.groupChat', 'Guruh suhbati')}</Text>
                </View>
              ) : (
                <View bg="$blue2" px="$3" py="$1" br={12}>
                   <Text fontSize={16} fontWeight="700" col="#007AFF">@{otherMember?.uniqueId || 'username'}</Text>
                </View>
              )}
            </YStack>

            <Separator w="100%" borderColor="$gray3" />

            <YStack w="100%" gap="$4">
              <XStack ai="center" gap="$4">
                <Circle size={44} bg="$gray2"><UsersIcon size={20} color="$gray10" /></Circle>
                <YStack>
                   <Text fontSize={12} col="$gray9" fontWeight="600">{t('chat.type', 'TUR')}</Text>
                   <Text fontSize={16} fontWeight="700" col={isDark ? 'white' : '#1A1A1A'}>
                     {chat?.type === 'GROUP' ? t('chat.group', 'Guruh') : t('chat.private', 'Shaxsiy')}
                   </Text>
                </YStack>
              </XStack>

              {chat?.type !== 'GROUP' && (
                <XStack ai="center" gap="$4">
                  <Circle size={44} bg="$gray2"><AtSign size={20} color="$gray10" /></Circle>
                  <YStack>
                     <Text fontSize={12} col="$gray9" fontWeight="600">NICKNAME</Text>
                     <Text fontSize={16} fontWeight="700" col={isDark ? 'white' : '#1A1A1A'}>@{otherMember?.uniqueId || t('friends.common.unknownUser')}</Text>
                  </YStack>
                </XStack>
              )}

              <XStack ai="center" gap="$4">
                <Circle size={44} bg="$gray2"><MessageSquare size={20} color="$gray10" /></Circle>
                <YStack>
                   <Text fontSize={12} col="$gray9" fontWeight="600">BIO</Text>
                   <Text fontSize={16} fontWeight="700" col={isDark ? 'white' : '#1A1A1A'}>
                     {chat?.type === 'GROUP' ? t('chat.groupBio', 'Splitter guruhi orqali bog\'lanish') : t('chat.privateBio', 'Splitter ilovasi orqali bog\'lanish')}
                   </Text>
                </YStack>
              </XStack>
            </YStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      <Sheet
        modal
        open={!!showMessageActions}
        onOpenChange={(open) => !open && setShowMessageActions(null)}
        snapPoints={[35]}
        dismissOnSnapToBottom
        animation="medium"
      >
        <Sheet.Overlay bg="rgba(0,0,0,0.5)" />
        <Sheet.Frame p="$4" bg={isDark ? '#1C1C1E' : '#FFFFFF'} borderTopLeftRadius={32} borderTopRightRadius={32}>
          <Sheet.Handle />
          <YStack gap="$2" mt="$4">
            <Pressable 
              onPress={() => showMessageActions && startReply(showMessageActions)}
              style={({ pressed }) => [S.actionItem, pressed && { bg: '$gray3' }]}
            >
              <XStack ai="center" gap="$3">
                <MessageCircle size={22} color="#007AFF" />
                <Text fontSize={17} fontWeight="600" color={isDark ? '#FFFFFF' : '#000000'}>{t('chat.actions.reply')}</Text>
              </XStack>
            </Pressable>

            {showMessageActions?.senderId === currentUser?.id && (
              <Pressable 
                onPress={() => showMessageActions && startEdit(showMessageActions)}
                style={({ pressed }) => [S.actionItem, pressed && { bg: '$gray3' }]}
              >
                <XStack ai="center" gap="$3">
                  <AtSign size={22} color="#007AFF" />
                  <Text fontSize={17} fontWeight="600" color={isDark ? '#FFFFFF' : '#000000'}>{t('chat.actions.edit')}</Text>
                </XStack>
              </Pressable>
            )}

            <Pressable 
              onPress={() => showMessageActions && startForward(showMessageActions)}
              style={({ pressed }) => [S.actionItem, pressed && { bg: '$gray3' }]}
            >
              <XStack ai="center" gap="$3">
                <ArrowUpRight size={22} color="#007AFF" />
                <Text fontSize={17} fontWeight="600" color={isDark ? '#FFFFFF' : '#000000'}>{t('chat.actions.forward')}</Text>
              </XStack>
            </Pressable>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      <Sheet
        modal
        open={!!showForwardSheet}
        onOpenChange={(open) => !open && setShowForwardSheet(null)}
        snapPoints={[60]}
        dismissOnSnapToBottom
        animation="medium"
      >
        <Sheet.Overlay bg="rgba(0,0,0,0.5)" />
        <Sheet.Frame p="$4" bg={isDark ? '#1C1C1E' : '#FFFFFF'} borderTopLeftRadius={32} borderTopRightRadius={32}>
          <Sheet.Handle />
          <YStack gap="$4" mt="$4">
            <Text fontSize={20} fontWeight="900" px="$2">{t('chat.forwardTo')}</Text>
            {friendsLoading ? (
              <Spinner color="#007AFF" py="$10" />
            ) : (
              <ScrollView f={1}>
                <YStack gap="$2">
                  {friends.map((friend) => (
                    <Pressable 
                      key={friend.uniqueId} 
                      onPress={() => showForwardSheet && onForward(showForwardSheet, friend.uniqueId)}
                      style={({ pressed }) => [S.actionItem, pressed && { bg: '$gray3' }]}
                    >
                      <XStack ai="center" gap="$3">
                        <UserAvatar 
                          uri={friend.avatarUrl} 
                          label={friend.username.slice(0, 1).toUpperCase()} 
                          size={40} 
                        />
                        <YStack>
                          <Text fontSize={16} fontWeight="700" color={isDark ? 'white' : '#1A1A1A'}>{friend.username}</Text>
                          <Text fontSize={12} color="$gray10">@{friend.uniqueId}</Text>
                        </YStack>
                      </XStack>
                    </Pressable>
                  ))}
                  {friends.length === 0 && (
                    <Text textAlign="center" col="$gray10" py="$10">{t('chat.noFriends')}</Text>
                  )}
                </YStack>
              </ScrollView>
            )}
          </YStack>
        </Sheet.Frame>
      </Sheet>

      <Sheet
        modal
        open={showAttachmentMenu}
        onOpenChange={setShowAttachmentMenu}
        snapPoints={[30]}
        dismissOnSnapToBottom
        animation="medium"
      >
        <Sheet.Overlay bg="rgba(0,0,0,0.5)" />
        <Sheet.Frame p="$4" bg={isDark ? '#1C1C1E' : '#FFFFFF'} borderTopLeftRadius={32} borderTopRightRadius={32}>
          <Sheet.Handle />
          <YStack gap="$4" mt="$4">
            <XStack jc="space-around" p="$2">
              <YStack ai="center" gap="$2">
                <Pressable onPress={() => { alert(t('chat.attachments.soon')); setShowAttachmentMenu(false); }}>
                  <Circle size={60} bg="#007AFF" ai="center" jc="center">
                    <ImageIcon size={28} color="white" />
                  </Circle>
                </Pressable>
                <Text fontSize={12} fontWeight="600" col={isDark ? 'white' : '#475569'}>{t('chat.attachments.gallery')}</Text>
              </YStack>

              <YStack ai="center" gap="$2">
                <Pressable onPress={sendLocation}>
                  <Circle size={60} bg="#FF9500" ai="center" jc="center">
                    <MapPin size={28} color="white" />
                  </Circle>
                </Pressable>
                <Text fontSize={12} fontWeight="600" col={isDark ? 'white' : '#475569'}>{t('chat.attachments.location')}</Text>
              </YStack>

              <YStack ai="center" gap="$2">
                <Pressable onPress={() => { alert(t('chat.attachments.soon')); setShowAttachmentMenu(false); }}>
                  <Circle size={60} bg="#34C759" ai="center" jc="center">
                    <FileText size={28} color="white" />
                  </Circle>
                </Pressable>
                <Text fontSize={12} fontWeight="600" col={isDark ? 'white' : '#475569'}>{t('chat.attachments.file')}</Text>
              </YStack>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      <Sheet
        modal
        open={showHeaderMenu}
        onOpenChange={setShowHeaderMenu}
        snapPoints={[45]}
        dismissOnSnapToBottom
        animation="medium"
      >
        <Sheet.Overlay bg="rgba(0,0,0,0.5)" />
        <Sheet.Frame p="$4" bg={isDark ? '#1C1C1E' : '#FFFFFF'} borderTopLeftRadius={32} borderTopRightRadius={32}>
          <Sheet.Handle />
          <YStack gap="$2" mt="$4">
            <Pressable 
              onPress={() => { setShowHeaderMenu(false); alert(t('chat.attachments.soon')); }}
              style={({ pressed }) => [S.actionItem, pressed && { bg: '$gray3' }]}
            >
              <XStack ai="center" gap="$3">
                <SearchIcon size={22} color="#007AFF" />
                <Text fontSize={17} fontWeight="600" color={isDark ? '#FFFFFF' : '#000000'}>{t('chat.actions.search')}</Text>
              </XStack>
            </Pressable>

            <Pressable 
              onPress={() => { setShowHeaderMenu(false); alert(t('chat.attachments.soon')); }}
              style={({ pressed }) => [S.actionItem, pressed && { bg: '$gray3' }]}
            >
              <XStack ai="center" gap="$3">
                <BellOff size={22} color="#007AFF" />
                <Text fontSize={17} fontWeight="600" color={isDark ? '#FFFFFF' : '#000000'}>{t('chat.actions.mute')}</Text>
              </XStack>
            </Pressable>

            <Pressable 
              onPress={clearHistory}
              style={({ pressed }) => [S.actionItem, pressed && { bg: '$gray3' }]}
            >
              <XStack ai="center" gap="$3">
                <Eraser size={22} color="#FF9500" />
                <Text fontSize={17} fontWeight="600" color="#FF9500">{t('chat.actions.clear')}</Text>
              </XStack>
            </Pressable>

            <Pressable 
              onPress={deleteChat}
              style={({ pressed }) => [S.actionItem, pressed && { bg: '$gray3' }]}
            >
              <XStack ai="center" gap="$3">
                <Trash size={22} color="#FF3B30" />
                <Text fontSize={17} fontWeight="600" color="#FF3B30">{t('chat.actions.delete')}</Text>
              </XStack>
            </Pressable>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  messageWrapper: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 4,
  },
  messageWrapperMe: {
    justifyContent: 'flex-end',
  },
  messageWrapperThem: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMeLight: {
    backgroundColor: '#007AFF', // iOS Blue
  },
  bubbleMeDark: {
    backgroundColor: '#0A84FF', // iOS Dark Blue
  },
  bubbleThemLight: {
    backgroundColor: '#FFFFFF',
  },
  bubbleThemDark: {
    backgroundColor: '#1C1C1E',
  },
  bubbleRadiusMe: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleRadiusThem: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
  },
  attachBtn: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2, // align with input
  },
  actionItem: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
