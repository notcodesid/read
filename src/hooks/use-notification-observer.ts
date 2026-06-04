import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

function openArticleFromNotification(notification: Notifications.Notification) {
  const data = notification.request.content.data;
  const url = typeof data?.url === 'string' ? data.url : undefined;
  const articleId = typeof data?.articleId === 'string' ? data.articleId : undefined;

  if (url?.startsWith('/read/')) {
    router.push(url);
    return;
  }

  if (articleId) {
    router.push(`/read/${articleId}`);
  }
}

export function useNotificationObserver() {
  useEffect(() => {
    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) {
      openArticleFromNotification(last.notification);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openArticleFromNotification(response.notification);
    });

    return () => subscription.remove();
  }, []);
}