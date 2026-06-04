import * as Notifications from 'expo-notifications';

let configured = false;

export function configureReadingNotifications(): void {
  if (configured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  configured = true;
}