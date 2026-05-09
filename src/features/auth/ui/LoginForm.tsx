import React, { useState } from 'react';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { YStack, XStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Card } from '@/shared/ui/Card';
import ScreenFormContainer from '@/shared/ui/ScreenFormContainer';
import PasswordInput from '@/shared/ui/PasswordInput';
import { login, LoginRequest, getCurrentUser } from '../api';
import { saveToken } from '@/shared/lib/utils/token-storage';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { Mail, Lock } from '@tamagui/lucide-icons';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const { t } = useTranslation();
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  const setAuth = useAppStore((s) => s.setAuth);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values: LoginRequest) => {
    try {
      setIsLoading(true);
      const res = await login(values);
      await saveToken(res.token);

      let profile = res.user;
      try {
        profile = await getCurrentUser(res.token);
      } catch (fetchError) {
        console.warn('Login profile refresh failed:', fetchError);
      }

      setAuth(res.token, profile);
      router.replace('/');
    } catch (error: any) {
      Alert.alert(
        t('common.error', 'Error'),
        error.message || t('auth.loginError', 'An error occurred during login')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenFormContainer>
      <YStack space="$6" pt="$6">
        {/* Header */}
        <YStack alignItems="center" space="$3" pb="$4">
          <Text fontSize={32} fontWeight="900" color="$gray12" textAlign="center" letterSpacing={-0.5}>
            {t('auth.signIn', 'Tizimga kirish')}
          </Text>
          <Text fontSize={16} color="$gray10" textAlign="center" paddingHorizontal="$4" lineHeight={24}>
            {t('auth.signInDesc', 'Xush kelibsiz! Davom etish uchun hisobingizga kiring')}
          </Text>
        </YStack>

        {/* Form Card */}
        <YStack 
          backgroundColor="$background" 
          borderRadius={28}
          padding="$5"
          space="$5"
          shadowColor="#007AFF"
          shadowOffset={{ width: 0, height: 12 }}
          shadowOpacity={0.06}
          shadowRadius={30}
          elevation={12}
          borderWidth={1}
          borderColor="$gray3"
        >
            {/* Email */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <XStack space="$3" alignItems="flex-start">
                  <YStack
                    width={48}
                    height={48}
                    backgroundColor="rgba(0, 122, 255, 0.1)"
                    borderRadius={24}
                    alignItems="center"
                    justifyContent="center"
                    marginTop="$4"
                  >
                    <Mail size={22} color="#007AFF" />
                  </YStack>
                  <YStack flex={1}>
                    <Input
                      label={t('auth.email', 'Email')}
                      placeholder={t('auth.emailPlaceholder', 'Enter your email')}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      error={errors.email?.message}
                      required
                    />
                  </YStack>
                </XStack>
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <XStack space="$3" alignItems="flex-start">
                  <YStack
                    width={48}
                    height={48}
                    backgroundColor="rgba(0, 122, 255, 0.1)"
                    borderRadius={24}
                    alignItems="center"
                    justifyContent="center"
                    marginTop="$4"
                  >
                    <Lock size={22} color="#007AFF" />
                  </YStack>
                  <YStack flex={1}>
                    <PasswordInput
                      label={t('auth.password', 'Password')}
                      placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
                      value={value}
                      onChangeText={onChange}
                      error={errors.password?.message}
                      required
                    />
                  </YStack>
                </XStack>
              )}
            />

            {/* Forgot */}
            <XStack justifyContent="flex-end" mt="$-2">
              <Text fontSize={14} color="#007AFF" fontWeight="600">
                {t('auth.forgotPassword', 'Parolni unutdingizmi?')}
              </Text>
            </XStack>

            {/* Submit */}
            <YStack mt="$2">
              <Button
                title={isLoading ? t('common.loading', 'Yuklanmoqda...') : t('auth.signIn', 'Kirish')}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
                backgroundColor="#007AFF"
                color="white"
                borderRadius={24}
                height={56}
                fontSize={18}
                fontWeight="700"
                shadowColor="#007AFF"
                shadowOffset={{ width: 0, height: 4 }}
                shadowOpacity={0.2}
                shadowRadius={8}
              />
            </YStack>
        </YStack>

        {/* Footer */}
        <YStack alignItems="center" space="$4" mt="$2">
          <XStack alignItems="center" space="$3">
            <YStack flex={1} height={1} backgroundColor="$gray5" />
            <Text fontSize={14} color="$gray9" fontWeight="500">
              {t('auth.noAccount', 'Hisobingiz yo\'qmi?')}
            </Text>
            <YStack flex={1} height={1} backgroundColor="$gray5" />
          </XStack>

          <Link href="/register" asChild>
            <Button 
              title={t('auth.createAccount', 'Hisob yaratish')} 
              variant="outline" 
              borderColor="rgba(0, 122, 255, 0.3)"
              color="#007AFF"
              borderRadius={24}
              height={50}
              width="100%" 
            />
          </Link>
        </YStack>
      </YStack>
    </ScreenFormContainer>
  );
}
