const PUSH_SW_PATH = '/push-sw.js';

export const isPushSupported = () => (
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window
);

export const getPushPermission = () => (
  typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
);

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const registerPushServiceWorker = async () => {
  if (!isPushSupported()) return null;
  return navigator.serviceWorker.register(PUSH_SW_PATH);
};

export const getOrCreateSubscription = async (publicKey) => {
  if (!isPushSupported()) return null;
  const registration = await registerPushServiceWorker();
  if (!registration) return null;

  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
};

export const getActiveSubscription = async () => {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
};

export const unsubscribePush = async () => {
  const subscription = await getActiveSubscription();
  if (!subscription) return null;
  await subscription.unsubscribe();
  return subscription;
};
