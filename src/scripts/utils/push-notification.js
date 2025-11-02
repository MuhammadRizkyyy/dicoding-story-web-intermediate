import CONFIG from "../config";

const VAPID_PUBLIC_KEY =
  "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

class PushNotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
  }

  async init() {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return false;
    }

    if (!("PushManager" in window)) {
      console.warn("Push notifications not supported");
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      return true;
    } catch (error) {
      console.error("Error initializing push notifications:", error);
      return false;
    }
  }

  async requestPermission() {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  async getSubscription() {
    if (!this.registration) {
      await this.init();
    }

    this.subscription = await this.registration.pushManager.getSubscription();
    return this.subscription;
  }

  async subscribe(token) {
    try {
      const isInitialized = await this.init();
      if (!isInitialized) {
        throw new Error("Push notifications not supported");
      }

      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error("Notification permission denied");
      }

      // Check if already subscribed
      let subscription = await this.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // Send subscription to server
      const response = await this.sendSubscriptionToServer(subscription, token);

      this.subscription = subscription;
      this.saveSubscriptionStatus(true);

      return { success: true, subscription, response };
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      throw error;
    }
  }

  async unsubscribe(token) {
    try {
      const subscription = await this.getSubscription();

      if (!subscription) {
        return { success: true, message: "No active subscription" };
      }

      // Unsubscribe from server
      await this.removeSubscriptionFromServer(subscription, token);

      // Unsubscribe from browser
      await subscription.unsubscribe();

      this.subscription = null;
      this.saveSubscriptionStatus(false);

      return { success: true, message: "Unsubscribed successfully" };
    } catch (error) {
      console.error("Error unsubscribing:", error);
      throw error;
    }
  }

  async sendSubscriptionToServer(subscription, token) {
    const subscriptionData = JSON.parse(JSON.stringify(subscription));

    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subscriptionData.endpoint,
        keys: subscriptionData.keys,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send subscription to server");
    }

    return await response.json();
  }

  async removeSubscriptionFromServer(subscription, token) {
    const subscriptionData = JSON.parse(JSON.stringify(subscription));

    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subscriptionData.endpoint,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to remove subscription from server");
    }

    return await response.json();
  }

  async isSubscribed() {
    const subscription = await this.getSubscription();
    return !!subscription;
  }

  saveSubscriptionStatus(isSubscribed) {
    localStorage.setItem(
      "push_notification_enabled",
      isSubscribed ? "true" : "false"
    );
  }

  getSubscriptionStatus() {
    return localStorage.getItem("push_notification_enabled") === "true";
  }

  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  async testNotification() {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      const notification = new Notification("Test Notification", {
        body: "Push notification berhasil diaktifkan!",
        icon: "/images/icon-192x192.png",
        badge: "/images/icon-72x72.png",
        tag: "test-notification",
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }
}

export default new PushNotificationService();
