import React, { useMemo, useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, TextInput, Share, Modal, StyleSheet, Alert } from 'react-native';
import { YStack, XStack, Text, Button, Circle, ScrollView, View, Separator, Spinner } from 'tamagui';
import { Check, ChevronLeft, Wallet, Share2, MessageSquare, Send } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useReceiptSessionStore, type FinishPayload } from '@/features/receipt/model/receipt-session.store';
import { useAppStore } from '@/shared/lib/stores/app-store';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useTranslation } from 'react-i18next';
import { apiClient as api } from '@/features/auth/api';

export default function FinishScreen() {
  const { data, groupId: groupIdParam } = useLocalSearchParams<{ data?: string; groupId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const me = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';
  const lastFinishPayload = useReceiptSessionStore((s) => s.lastFinishPayload);
  const closeSession = useReceiptSessionStore((s) => s.closeSession);
  const finalizing = useReceiptSessionStore((s) => s.finalizing);
  const [paidAmounts, setPaidAmounts] = useState<Record<string, string>>({});
  const [commentTarget, setCommentTarget] = useState<{ itemId: string, itemName: string, participantId: string } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (commentTarget) {
      const key = `${commentTarget.itemId}_${commentTarget.participantId}`;
      setCommentText(comments[key] || '');
    } else {
      setCommentText('');
    }
  }, [commentTarget]);

  const handleSaveComment = () => {
    if (!commentTarget) return;
    const { itemId, participantId } = commentTarget;
    const key = `${itemId}_${participantId}`;
    if (commentText.trim()) {
      setComments(prev => ({ ...prev, [key]: commentText.trim() }));
    } else {
      setComments(prev => {
        const cp = { ...prev };
        delete cp[key];
        return cp;
      });
    }
    setCommentTarget(null);
    setCommentText('');
  };

  const payload = useMemo<FinishPayload | null>(() => {
    if (data) {
      try {
        return JSON.parse(decodeURIComponent(data));
      } catch {
        try { return JSON.parse(data); } catch { return null; }
      }
    }
    return lastFinishPayload ?? null;
  }, [data, lastFinishPayload]);

  const currency = payload?.currency || 'UZS';
  const grandTotal = payload?.grandTotal || 0;
  const participantTotals = payload?.totalsByParticipant || [];
  const allocations = payload?.allocations || [];
  const sessionName = payload?.sessionName || t('sessions.finish.default_name', 'Session Result');
  const groupId = groupIdParam ? parseInt(groupIdParam) : undefined;

  const participantNames = useMemo(() => {
    const map = new Map<string, string>();
    participantTotals.forEach(p => {
      map.set(p.uniqueId, p.username || p.uniqueId);
    });
    return map;
  }, [participantTotals]);

  const handleShare = async () => {
    try {
      let text = t('sessions.finish.share_title', { name: sessionName }) + '\n\n';
      text += t('sessions.finish.share_total', { total: grandTotal.toLocaleString(), currency }) + '\n\n';
      text += t('sessions.finish.share_plan', 'Settlement Plan:') + '\n';
      
      participantTotals.forEach(p => {
        const paidStr = paidAmounts[p.uniqueId] || p.amountOwed.toString();
        const paidNum = parseFloat(paidStr) || 0;
        const debt = p.amountOwed - paidNum;
        
        text += `• ${p.username}: ${p.amountOwed.toLocaleString()} ${currency}`;
        if (debt > 0) {
          text += ` (${t('sessions.finish.debt', 'Debt')}: ${debt.toLocaleString()} ${currency})`;
        } else {
          text += ` (${t('sessions.finish.paid', 'Paid')} ✅)`;
        }
        text += `\n`;
      });
      
      text += `\n${t('sessions.finish.share_footer', 'Calculated via Splitter app. 📱')}`;
      
      await Share.share({
        message: text,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <YStack f={1} bg={isDark ? '#000000' : '#F8F9FA'}>
      {/* Header with Blue Gradient */}
      <LinearGradient
        colors={['#007AFF', '#0055FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <XStack ai="center" jc="space-between" mb="$4">
          <Pressable onPress={() => router.back()}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.2)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={18} fow="900">{t('sessions.finish.title', 'Result')}</Text>
          <Pressable onPress={handleShare}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.2)">
              <Share2 size={24} color="white" />
            </YStack>
          </Pressable>
        </XStack>

        <XStack ai="center" jc="space-between" mt="$1" px="$1">
          <YStack gap="$0.5" f={1}>
            <Text col="white" fos={14} fow="700" opacity={0.8} numberOfLines={1}>{sessionName}</Text>
            <XStack ai="baseline" gap="$1.5">
              <Text col="white" fos={28} fow="900">{grandTotal.toLocaleString()}</Text>
              <Text col="white" opacity={0.8} fos={14} fow="700">{currency}</Text>
            </XStack>
          </YStack>
          <Circle size={48} bg="rgba(255,255,255,0.2)" ai="center" jc="center">
            <Check size={24} color="white" strokeWidth={3.5} />
          </Circle>
        </XStack>
      </LinearGradient>

      <ScrollView f={1} p="$5" showsVerticalScrollIndicator={false}>
        <YStack gap="$6" pb="$20">
          
          {/* Settlement Plan Section */}
          <YStack gap="$3">
            <Text fos={14} fow="800" col={isDark ? '#94A3B8' : '$gray9'} textTransform="uppercase" ml="$2">
               {t('sessions.finish.settlement', 'Settlement Plan')}
            </Text>
            <YStack bg={isDark ? '#1C1C1E' : 'white'} br={24} p="$5" gap="$4" shadowColor="#000" shadowOpacity={isDark ? 0.3 : 0.05} shadowRadius={15} elevation={5} borderWidth={isDark ? 1 : 0} borderColor="#2C2C2E">
              {participantTotals.map((p, i) => {
                const owed = p.amountOwed;
                const paidStr = paidAmounts[p.uniqueId] !== undefined ? paidAmounts[p.uniqueId] : owed.toString();
                const paidNum = parseFloat(paidStr) || 0;
                const debt = owed - paidNum;

                return (
                  <React.Fragment key={p.uniqueId}>
                    <YStack gap="$2">
                      <XStack ai="center" jc="space-between" gap="$2">
                        <XStack ai="center" gap="$3" f={1}>
                          <UserAvatar label={p.username.slice(0, 1).toUpperCase()} size={40} />
                          <YStack f={1}>
                            <Text fos={16} fow="800" col={isDark ? 'white' : '$gray12'} numberOfLines={1}>{p.username}</Text>
                            <Text fos={12} col={isDark ? '#94A3B8' : '$gray10'} fow="600" numberOfLines={1}>@{p.uniqueId}</Text>
                          </YStack>
                        </XStack>
                        <YStack ai="flex-end" flexShrink={0}>
                          <Text fos={16} fow="900" col="#007AFF">{owed.toLocaleString()} {currency}</Text>
                          <View bg="rgba(0,122,255,0.1)" px="$2" py="$0.5" br={6} mt="$1">
                            <Text fos={10} fow="800" col="#007AFF" textTransform="uppercase">
                              {t('sessions.finish.total_share', 'Total Share')}
                            </Text>
                          </View>
                        </YStack>
                      </XStack>

                      <XStack ai="center" jc="space-between" mt="$2" gap="$4">
                        <YStack f={1}>
                          <Text fos={11} fow="800" col={isDark ? '#94A3B8' : '$gray9'} mb="$1" textTransform="uppercase">
                            {t('sessions.finish.paid_label', 'Paid')}
                          </Text>
                          <TextInput
                            value={paidStr}
                            onChangeText={(val) => setPaidAmounts(prev => ({ ...prev, [p.uniqueId]: val }))}
                            keyboardType="numeric"
                            style={{
                              backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9',
                              borderRadius: 12,
                              height: 44,
                              paddingHorizontal: 12,
                              fontSize: 15,
                              fontWeight: '700',
                              color: isDark ? 'white' : '#1E293B',
                            }}
                          />
                        </YStack>
                        <YStack ai="flex-end" jc="center" pt="$4">
                           <Text fos={11} fow="800" col={debt > 0 ? '$red10' : '$green10'} textTransform="uppercase">
                             {debt > 0 ? t('sessions.finish.debt', 'Debt') : t('sessions.finish.paid', 'Paid')}
                           </Text>
                           <Text fos={15} fow="900" col={debt > 0 ? '$red10' : '$green10'}>
                             {Math.abs(debt).toLocaleString()} {currency}
                           </Text>
                        </YStack>
                      </XStack>
                    </YStack>
                    {i < participantTotals.length - 1 && <Separator borderColor={isDark ? '#2C2C2E' : '$gray3'} my="$2" />}
                  </React.Fragment>
                );
              })}
            </YStack>
          </YStack>

          {/* Details Breakdown */}
          <YStack gap="$3">
            <Text fos={14} fow="800" col={isDark ? '#94A3B8' : '$gray9'} textTransform="uppercase" ml="$2">
               {t('sessions.finish.breakdown', 'Breakdown')}
            </Text>
            {payload?.totalsByItem?.map((item) => (
              <YStack 
                key={item.itemId} 
                bg={isDark ? '#1C1C1E' : 'white'} 
                br={20} 
                p="$4" 
                gap="$3"
                shadowColor="#000" 
                shadowOpacity={isDark ? 0.2 : 0.03} 
                shadowRadius={10} 
                elevation={2}
                borderWidth={isDark ? 1 : 0}
                borderColor="#2C2C2E"
              >
                <XStack jc="space-between" ai="center" gap="$2">
                  <Text fow="800" fos={15} col={isDark ? 'white' : '$gray12'} f={1} numberOfLines={2}>{item.name}</Text>
                  <Text fow="800" fos={15} col="#007AFF" flexShrink={0}>{item.total.toLocaleString()} {currency}</Text>
                </XStack>
                <XStack flexWrap="wrap" gap="$2">
                  {allocations.filter(a => a.itemId === item.itemId).map(alloc => {
                    const displayName = participantNames.get(alloc.participantId) || alloc.participantId;
                    return (
                      <XStack key={alloc.participantId} ai="center" gap="$2">
                        <XStack bg={isDark ? '#2C2C2E' : '$gray2'} px="$2" py="$1" br={8} ai="center" gap="$1.5">
                          <Circle size={14} bg={isDark ? '#4E4E50' : '$gray4'} />
                          <Text fos={11} fow="700" col={isDark ? '#94A3B8' : '$gray10'} numberOfLines={1}>
                            {displayName}: {alloc.shareAmount.toLocaleString()}
                          </Text>
                        </XStack>
                        <Pressable onPress={() => setCommentTarget({ itemId: item.itemId, itemName: item.name, participantId: alloc.participantId })}>
                          {(() => {
                            const commentKey = `${item.itemId}_${alloc.participantId}`;
                            const hasComment = !!comments[commentKey];
                            return (
                              <YStack p="$1.5" br={8} bg={hasComment ? 'rgba(52,199,89,0.15)' : (isDark ? '#2C2C2E' : '$gray2')}>
                                <MessageSquare size={12} color={hasComment ? '#34C759' : '#007AFF'} />
                              </YStack>
                            );
                          })()}
                        </Pressable>
                      </XStack>
                    );
                  })}
                </XStack>
              </YStack>
            ))}
          </YStack>

        </YStack>
      </ScrollView>

      {/* Footer Actions */}
      <YStack 
        bg={isDark ? '#1C1C1E' : 'white'} 
        p="$5" 
        pb={insets.bottom + 105} 
        borderTopLeftRadius={32} 
        borderTopRightRadius={32}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: -10 }}
        shadowOpacity={isDark ? 0.3 : 0.1}
        shadowRadius={20}
        elevation={20}
      >
        <XStack gap="$3">
          <Button
            f={1}
            onPress={() => router.back()}
            bg={isDark ? '#2C2C2E' : '$gray2'}
            h={56}
            br={16}
          >
            <Text col={isDark ? 'white' : '$gray12'} fos={16} fow="800">{t('common.close', 'Close')}</Text>
          </Button>
          <Button
            f={2}
            onPress={async () => {
              try {
                // Construct the detailed report message
                let report = `📊 *${sessionName}* — ${t('sessions.finish.title', 'Natija')}\n`;
                report += `💰 *${t('navigation.total_bill', 'Umumiy hisob')}:* ${grandTotal.toLocaleString()} ${currency}\n\n`;

                report += `👥 *${t('sessions.finish.settlement', 'To\'lovlar rejasi')}:*\n`;
                participantTotals.forEach(p => {
                  const paidStr = paidAmounts[p.uniqueId] !== undefined ? paidAmounts[p.uniqueId] : p.amountOwed.toString();
                  const paidNum = parseFloat(paidStr) || 0;
                  const debt = p.amountOwed - paidNum;

                  report += `• *${p.username}:* ${p.amountOwed.toLocaleString()} ${currency}`;
                  if (debt > 0) {
                    report += ` (💸 ${t('sessions.finish.debt', 'Qarz')}: ${debt.toLocaleString()} ${currency})`;
                  } else {
                    report += ` (✅ ${t('sessions.finish.paid', 'To\'landi')})`;
                  }
                  report += `\n`;
                });

                let commentSection = '';
                if (payload?.totalsByItem && payload.totalsByItem.length > 0) {
                  report += `\n📝 *${t('navigation.all_items', 'Umumiy mahsulotlar')}:*\n`;
                  payload.totalsByItem.forEach((item) => {
                    report += `• *${item.name}:* ${item.total.toLocaleString()} ${currency}\n`;
                    const itemAllocs = allocations.filter(a => a.itemId === item.itemId);
                    if (itemAllocs.length > 0) {
                      const allocLines = itemAllocs.map(alloc => {
                        const name = participantNames.get(alloc.participantId) || alloc.participantId;
                        const commentKey = `${item.itemId}_${alloc.participantId}`;
                        if (comments[commentKey]) {
                          commentSection += `• *${item.name} (${name}):* _"${comments[commentKey]}"_\n`;
                        }
                        return `${name} (${alloc.shareAmount.toLocaleString()})`;
                      }).join(', ');
                      report += `   ↳ ${allocLines}\n`;
                    }
                  });
                }

                if (commentSection) {
                  report += `\n💬 *${t('sessions.finish.notes_section', 'Izohlar va eslatmalar')}:*\n${commentSection}`;
                }

                report += `\n📱 *Receipt Splitter* ilovasi orqali hisoblandi.`;

                // Determine recipient and send report
                if (groupId && !isNaN(groupId)) {
                  // Send to group chat
                  try {
                    const chatRes = await api.get(`/chats/group/${groupId}`);
                    const chatId = chatRes.data.chatId;
                    await api.post(`/chats/${chatId}/messages`, { content: report });
                  } catch (chatErr: any) {
                    console.warn(`Failed to send report to group chat ${groupId}:`, chatErr);
                    Alert.alert(
                      t('common.error', 'Xatolik'),
                      `Failed to send group report: ${chatErr?.response?.data?.error || chatErr?.message || String(chatErr)}`
                    );
                  }
                } else {
                  // Send to each participant's private chat (excluding myself)
                  const meUid = me?.uniqueId;
                  for (const p of participantTotals) {
                    if (p.uniqueId && meUid && p.uniqueId.toLowerCase() === meUid.toLowerCase()) {
                      continue; // Skip myself
                    }
                    try {
                      const chatRes = await api.post('/chats', { uniqueId: p.uniqueId });
                      const chatId = chatRes.data.id;
                      await api.post(`/chats/${chatId}/messages`, { content: report });
                    } catch (chatErr: any) {
                      console.warn(`Failed to send report to participant ${p.uniqueId}:`, chatErr);
                      Alert.alert(
                        t('common.error', 'Xatolik'),
                        `Failed to send report to ${p.username}: ${chatErr?.response?.data?.error || chatErr?.message || String(chatErr)}`
                      );
                    }
                  }
                }

                await closeSession();
                router.replace('/tabs');
              } catch (e: any) {
                console.error('Confirm payment failed:', e);
                Alert.alert(
                  t('common.error', 'Xatolik'),
                  `Confirm payment failed: ${e?.message || String(e)}`
                );
              }
            }}
            disabled={finalizing}
            bg="#007AFF"
            h={56}
            br={16}
            icon={finalizing ? <Spinner color="white" /> : <Wallet size={20} color="white" />}
          >
            <Text col="white" fos={16} fow="800">
              {finalizing ? '' : t('sessions.finish.confirm_payment', 'Confirm Payment')}
            </Text>
          </Button>
        </XStack>
      </YStack>

      {/* Comment Modal */}
      <Modal
        visible={!!commentTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentTarget(null)}
      >
        <YStack f={1} bg="rgba(0,0,0,0.5)" jc="flex-end">
          {/* Overlay click to dismiss */}
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setCommentTarget(null)} />
          
          <YStack 
            p="$5" 
            bg={isDark ? '#1C1C1E' : 'white'} 
            borderTopLeftRadius={32} 
            borderTopRightRadius={32}
            gap="$4"
            pb={insets.bottom + 20}
            borderWidth={isDark ? 1 : 0}
            borderColor="#2C2C2E"
          >
            <XStack jc="space-between" ai="center">
              <YStack>
                <Text fos={18} fow="900" col={isDark ? 'white' : '$gray12'}>
                  {t('sessions.finish.note_for', { name: commentTarget ? (participantNames.get(commentTarget.participantId) || commentTarget.participantId) : '' })}
                </Text>
                <Text fos={13} col={isDark ? '#94A3B8' : '$gray10'} fow="600">{commentTarget?.itemName}</Text>
              </YStack>
              <Pressable onPress={() => setCommentTarget(null)}>
                <Circle size={32} bg={isDark ? '#2C2C2E' : '$gray2'} ai="center" jc="center">
                  <Text fos={20} col={isDark ? '#94A3B8' : '$gray9'}>×</Text>
                </Circle>
              </Pressable>
            </XStack>

            <TextInput
              autoFocus
              multiline
              placeholder={t('sessions.finish.note_placeholder', 'Eslatma matnini kiriting...')}
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
              value={commentText}
              onChangeText={setCommentText}
              style={{
                backgroundColor: isDark ? '#2C2C2E' : '#F8F9FA',
                borderRadius: 16,
                padding: 16,
                fontSize: 16,
                minHeight: 100,
                textAlignVertical: 'top',
                color: isDark ? 'white' : '#1E293B',
                borderWidth: 1,
                borderColor: isDark ? '#3A3A3C' : '#E2E8F0',
              }}
            />

            <Button
              onPress={handleSaveComment}
              bg="#007AFF"
              h={50}
              br={14}
              icon={<Send size={18} color="white" />}
            >
              <Text col="white" fow="800">{t('common.save', 'Saqlash')}</Text>
            </Button>
          </YStack>
        </YStack>
      </Modal>
    </YStack>
  );
}
