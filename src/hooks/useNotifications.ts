import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  isLoading: boolean;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
}

const VAPID_PUBLIC_KEY_CACHE_KEY = 'mosaic_vapid_public_key';

async function getVapidPublicKey(): Promise<string | null> {
  // Check cache first
  const cached = sessionStorage.getItem(VAPID_PUBLIC_KEY_CACHE_KEY);
  if (cached) return cached;

  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/push-notify`,
      { method: 'GET' }
    );
    if (!res.ok) return null;
    const { publicKey } = await res.json();
    if (publicKey) sessionStorage.setItem(VAPID_PUBLIC_KEY_CACHE_KEY, publicKey);
    return publicKey || null;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    isSupported ? Notification.permission : 'unsupported'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check existing subscription on mount
  useEffect(() => {
    if (!isSupported || !user) return;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
        setPermission(Notification.permission);
      } catch {
        setIsSubscribed(false);
      }
    })();
  }, [isSupported, user]);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;
    setIsLoading(true);

    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      // Get VAPID public key
      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        console.error('Could not retrieve VAPID public key');
        return false;
      }

      // Subscribe to push
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });
      }

      // Save subscription to database
      const subJson = subscription.toJSON();
      const { error } = await supabase.from('notification_subscriptions').upsert([{
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subJson.keys?.p256dh || '',
        auth: subJson.keys?.auth || '',
      }], { onConflict: 'user_id,endpoint' });

      if (error) {
        console.error('Failed to save subscription:', error.message);
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Enable notifications error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  const disableNotifications = useCallback(async () => {
    if (!isSupported || !user) return;
    setIsLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();

      if (subscription) {
        // Remove from database
        await supabase
          .from('notification_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);

        // Unsubscribe
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error('Disable notifications error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  return { isSupported, permission, isSubscribed, isLoading, enableNotifications, disableNotifications };
}
