import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View, Dimensions, Pressable, BackHandler } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Text, Spinner, Circle, View as TView, Button } from 'tamagui';
import { ChevronLeft, UserPlus, AlertTriangle, Zap, ZapOff, CheckCircle2, QrCode, Image as ImageIcon, User as UserIcon, X, Share2, Copy } from '@tamagui/lucide-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing,
  withSpring
} from 'react-native-reanimated';
import Svg, { Defs, Rect, Mask } from 'react-native-svg';

import UserAvatar from '@/shared/ui/UserAvatar';
import { useAppStore } from '@/shared/lib/stores/app-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FRAME_SIZE = 280;
const FRAME_RADIUS = 32;
const FRAME_Y = (SCREEN_HEIGHT - FRAME_SIZE) / 2 - 100;
const FRAME_X = (SCREEN_WIDTH - FRAME_SIZE) / 2;

type FromParam = 'friends-requests' | 'groups-index' | undefined;

interface UserData {
  avatar?: string | null;
  name?: string | null;
  username?: string | null;
  bio?: string | null;
}

export default function ScanInviteScreen() {
  const [perm, requestPerm] = useCameraPermissions();
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showMyQr, setShowMyQr] = useState(false);
  
  const [currentQr, setCurrentQr] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const lock = useRef(false);
  
  const isFocused = useIsFocused();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: FromParam }>();
  const { t } = useTranslation();
  const user = useAppStore(s => s.user);

  // Animations
  const scanLineY = useSharedValue(0);
  const modalY = useSharedValue(400);
  const pulse = useSharedValue(1);
  const qrCardScale = useSharedValue(0.8);
  const qrCardOpacity = useSharedValue(0);

  useEffect(() => {
    if (isFocused && !perm?.granted) requestPerm();
    if (!isFocused) {
      setStatus('idle');
      setCurrentQr(null);
      lock.current = false;
      modalY.value = 400;
      setShowMyQr(false);
    }
  }, [isFocused, perm?.granted, requestPerm]);

  useEffect(() => {
    if (showMyQr) {
      qrCardScale.value = withSpring(1, { damping: 15 });
      qrCardOpacity.value = withTiming(1, { duration: 300 });
    } else {
      qrCardScale.value = withTiming(0.8, { duration: 200 });
      qrCardOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [showMyQr]);

  useEffect(() => {
    if (isFocused && status === 'idle') {
      scanLineY.value = 0;
      scanLineY.value = withRepeat(
        withSequence(
          withTiming(FRAME_SIZE - 2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [isFocused, status]);

  useEffect(() => {
    if (status === 'ok') {
      modalY.value = withSpring(0, { damping: 15, stiffness: 100 });
    } else {
      modalY.value = withTiming(400, { duration: 300 });
    }
  }, [status]);

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

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (status !== 'idle' || showMyQr) return;
    setCurrentQr(data);
    setStatus('loading');
    
    setTimeout(() => {
      setUserData({
        name: 'Sardorbek',
        username: 'sardor_dev',
        bio: 'Mobile Developer | Splitter User'
      });
      setStatus('ok');
    }, 1500);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      handleBarCodeScanned({ data: 'GALLERY_QR' });
    }
  };

  const handleShare = async () => {
    const inviteLink = `https://splitter.uz/invite/${user?.uniqueId}`;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(inviteLink);
    } else {
      await Clipboard.setStringAsync(inviteLink);
      alert(t('scan.myQr.copied', 'Link copied!'));
    }
  };

  const handleAddFriend = () => {
    goBack();
  };

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalY.value }]
  }));

  const animatedFrameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: status === 'idle' ? 1 : 0.5
  }));

  const animatedQrCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: qrCardScale.value }],
    opacity: qrCardOpacity.value
  }));

  const animatedScanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }]
  }));

  if (!perm) return <View style={S.root}><Spinner /></View>;
  if (!perm.granted) {
    return (
      <View style={S.root}>
        <YStack f={1} ai="center" jc="center" p="$5" gap="$4">
          <AlertTriangle size={64} color="#FFD60A" />
          <Text col="white" ta="center" fos={18} fow="700">{t('scan.permissions.title', 'Camera permission required')}</Text>
          <Text col="$gray10" ta="center">{t('scan.permissions.message', 'Please grant camera permission to scan QR codes')}</Text>
          <Pressable onPress={requestPerm} style={({ pressed }) => [S.scanButton, pressed && { opacity: 0.8 }]}>
             <Text col="white" fow="800" ta="center">{t('scan.permissions.button', 'Grant permission')}</Text>
          </Pressable>
        </YStack>
      </View>
    );
  }

  return (
    <View style={S.root}>
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          enableTorch={flash}
        />
      )}

      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%">
          <Defs>
            <Mask id="mask" x="0" y="0" height="100%" width="100%">
              <Rect height="100%" width="100%" fill="#fff" />
              <Rect
                x={FRAME_X}
                y={FRAME_Y}
                width={FRAME_SIZE}
                height={FRAME_SIZE}
                rx={FRAME_RADIUS}
                fill="#000"
              />
            </Mask>
          </Defs>
          <Rect
            height="100%"
            width="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#mask)"
          />
        </Svg>
      </View>

      <Animated.View style={[S.frameContainer, { top: FRAME_Y, left: FRAME_X }, animatedFrameStyle]}>
        <View style={[S.corner, S.topLeft]} />
        <View style={[S.corner, S.topRight]} />
        <View style={[S.corner, S.bottomLeft]} />
        <View style={[S.corner, S.bottomRight]} />
        
        {status === 'idle' && (
          <Animated.View style={[S.scanLine, animatedScanLineStyle]} />
        )}
        
        {status === 'loading' && (
          <View style={S.qrDetectedOverlay}>
            <ActivityIndicator size="large" color="#0A84FF" />
          </View>
        )}
      </Animated.View>

      {status === 'idle' && !showMyQr && (
        <View style={[S.tipAbs, { top: FRAME_Y + FRAME_SIZE + 30 }]}>
           <BlurView intensity={20} tint="dark" style={S.tipBadge}>
              <Text col="white" fos={13} fow="700" ta="center" style={S.textShadow}>
                {t('scan.scanner.tip', 'Scan your friend\'s code')}
              </Text>
           </BlurView>
        </View>
      )}

      <View style={[S.headerAbs, { paddingTop: insets.top + 10 }]}>
        <XStack ai="center" jc="space-between" px="$4">
          <Pressable onPress={goBack} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] })}>
            <BlurView intensity={40} tint="dark" style={S.glassButton}>
              <ChevronLeft size={28} color="white" />
            </BlurView>
          </Pressable>
          <Text col="white" fow="900" fos={20} style={S.textShadow}>{t('scan.scanner.title', 'Scanner')}</Text>
          <Pressable onPress={() => setFlash(!flash)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] })}>
            <BlurView intensity={40} tint="dark" style={S.glassButton}>
              {flash ? <Zap size={22} color="#FFD60A" /> : <ZapOff size={22} color="white" />}
            </BlurView>
          </Pressable>
        </XStack>
      </View>

      <View style={[S.bottomControlsAbs, { bottom: insets.bottom + 125 }]}>
         <XStack ai="center" jc="center" gap="$8">
            <YStack ai="center" gap="$2">
              <Pressable onPress={pickImage} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] })}>
                <BlurView intensity={60} tint="dark" style={S.roundButton}>
                  <ImageIcon size={26} color="white" />
                </BlurView>
              </Pressable>
              <Text col="white" fos={11} fow="800" opacity={0.8}>{t('scan.scanner.gallery', 'Gallery')}</Text>
            </YStack>

            <YStack ai="center" gap="$2">
              <Pressable onPress={() => setShowMyQr(true)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] })}>
                <BlurView intensity={60} tint="dark" style={S.roundButton}>
                  <QrCode size={26} color="white" />
                </BlurView>
              </Pressable>
              <Text col="white" fos={11} fow="800" opacity={0.8}>{t('scan.scanner.myQr', 'My QR')}</Text>
            </YStack>
         </XStack>
      </View>

      {showMyQr && (
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowMyQr(false)}>
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
          
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', padding: 30 }, animatedQrCardStyle]}>
             <YStack width="100%" maxWidth={340}>
                <LinearGradient
                  colors={['#1E293B', '#0F172A']}
                  start={[0, 0]}
                  end={[1, 1]}
                  style={S.qrPremiumCard}
                >
                   <XStack jc="space-between" ai="center" mb="$6">
                      <XStack ai="center" gap="$3">
                         <Circle size={40} bg="rgba(255,255,255,0.1)" ai="center" jc="center">
                            <UserIcon size={20} color="white" />
                         </Circle>
                         <YStack>
                            <Text col="white" fos={18} fow="900">{user?.displayName || user?.username}</Text>
                            <Text col="#94a3b8" fos={12} fow="700">@{user?.uniqueId}</Text>
                         </YStack>
                      </XStack>
                      <Pressable onPress={() => setShowMyQr(false)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                         <Circle size={32} bg="rgba(255,255,255,0.05)" ai="center" jc="center">
                            <X size={18} color="white" />
                         </Circle>
                      </Pressable>
                   </XStack>

                   <YStack bg="white" p="$5" br={32} ai="center" mb="$6" shadowColor="#000" shadowOpacity={0.3} shadowRadius={20}>
                      <QrCode size={220} color="#0F172A" />
                      <TView pos="absolute" top="42%" bg="white" p="$2" br={12} shadowColor="#000" shadowOpacity={0.1} shadowRadius={5}>
                         <Text fow="900" fos={10} col="#007AFF">SPLITTER</Text>
                      </TView>
                   </YStack>

                   <XStack gap="$3">
                      <Button 
                        f={1} 
                        bg="rgba(255,255,255,0.08)" 
                        br="$6" 
                        pressStyle={{ bg: 'rgba(255,255,255,0.15)', scale: 0.98 }}
                        icon={<Share2 size={18} color="white" />}
                        onPress={handleShare}
                      >
                         <Text col="white" fow="700">{t('scan.myQr.share', 'Share')}</Text>
                      </Button>
                      <Button 
                        f={1} 
                        bg="rgba(255,255,255,0.08)" 
                        br="$6" 
                        pressStyle={{ bg: 'rgba(255,255,255,0.15)', scale: 0.98 }}
                        icon={<Copy size={18} color="white" />}
                        onPress={() => {
                          Clipboard.setStringAsync(`https://splitter.uz/invite/${user?.uniqueId}`);
                          alert(t('scan.myQr.copied', 'Link copied!'));
                        }}
                      >
                         <Text col="white" fow="700">{t('scan.myQr.copy', 'Copy')}</Text>
                      </Button>
                   </XStack>
                   
                   <Text ta="center" col="#94a3b8" fos={11} mt="$4" fow="600">
                      {t('scan.myQr.hint', 'Your friend can scan this code to add you')}
                   </Text>
                </LinearGradient>
             </YStack>
          </Animated.View>
        </View>
      )}

      <View style={S.modalContainerAbs}>
        <YStack p="$5" pb={insets.bottom + 20}>
          {status === 'ok' && userData && (
            <Animated.View style={animatedModalStyle}>
              <BlurView intensity={95} tint="dark" style={S.glassCard}>
                <YStack ai="center" gap="$5">
                  <View style={S.successIconWrap}>
                    <CheckCircle2 size={36} color="#34C759" />
                  </View>
                  
                  <YStack ai="center" gap="$2">
                    <UserAvatar label={(userData.name || 'U').charAt(0)} size={90} />
                    <YStack ai="center">
                       <Text col="white" fos={26} fow="900" ta="center">{userData.name}</Text>
                       <Text col="#007AFF" fos={18} fow="700" ta="center">@{userData.username}</Text>
                    </YStack>
                  </YStack>

                  {userData.bio && (
                    <Text col="#cbd5e1" ta="center" fos={15} px="$5" fow="500">{userData.bio}</Text>
                  )}

                  <Button
                    size="$5"
                    bg="#007AFF"
                    br="$10"
                    width="100%"
                    pressStyle={{ scale: 0.97, opacity: 0.9 }}
                    onPress={handleAddFriend}
                    icon={<UserPlus size={24} color="white" />}
                  >
                    <Text col="white" fos={18} fow="900">{t('scan.result.addFriend', 'Add to friends')}</Text>
                  </Button>
                </YStack>
              </BlurView>
            </Animated.View>
          )}

          {status === 'error' && (
            <BlurView intensity={80} tint="dark" style={S.errorCard}>
              <XStack ai="center" gap="$3">
                <AlertTriangle size={24} color="white" />
                <Text col="white" fos={15} fow="700" flexShrink={1}>{t('scan.result.error', 'QR code not found or invalid')}</Text>
              </XStack>
            </BlurView>
          )}
        </YStack>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  headerAbs: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  modalContainerAbs: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 },
  tipAbs: { position: 'absolute', left: 0, right: 0, zIndex: 5, alignItems: 'center' },
  bottomControlsAbs: { position: 'absolute', left: 0, right: 0, zIndex: 50 },
  
  tipBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  frameContainer: {
    position: 'absolute',
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    zIndex: 5,
  },
  corner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: '#0A84FF',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 6, borderLeftWidth: 6, borderTopLeftRadius: FRAME_RADIUS },
  topRight: { top: 0, right: 0, borderTopWidth: 6, borderRightWidth: 6, borderTopRightRadius: FRAME_RADIUS },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 6, borderLeftWidth: 6, borderBottomLeftRadius: FRAME_RADIUS },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 6, borderRightWidth: 6, borderBottomRightRadius: FRAME_RADIUS },

  scanLine: {
    position: 'absolute',
    top: 0,
    left: 25,
    right: 25,
    height: 4,
    backgroundColor: '#0A84FF',
    borderRadius: 2,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  qrDetectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderRadius: FRAME_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },

  glassButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  roundButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  qrPremiumCard: {
    padding: 30,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  glassCard: {
    paddingHorizontal: 24,
    paddingVertical: 35,
    borderRadius: 45,
    overflow: 'hidden',
    width: '100%',
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  errorCard: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    width: '100%',
    backgroundColor: 'rgba(255,59,48,0.9)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  textShadow: {
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 20,
    paddingHorizontal: 35,
    borderRadius: 25,
    width: '100%',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  successIconWrap: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  }
});