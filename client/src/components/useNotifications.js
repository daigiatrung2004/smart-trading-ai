import { useEffect } from 'react';

const NotificationService = {
  audio: new Audio('/notification.mp3'),
  
  requestPermission: async () => {
	if (!("Notification" in window)) {
	  console.log("This browser does not support desktop notifications");
	  return;
	}
	
	if (Notification.permission !== "granted") {
	  try {
		await Notification.requestPermission();
	  } catch (error) {
		console.error("Error requesting notification permission:", error);
	  }
	}
  },

  showNotification: (signal) => {
	if (Notification.permission === "granted") {
	  const direction = signal.direction.toUpperCase();
	  const emoji = signal.direction === 'long' ? '?' : '?';
	  
	  const notification = new Notification("Trading Signal Alert!", {
		body: `${emoji} New ${direction} Signal Detected\nPrice: ${signal.price}\nStop Loss: ${signal.stopLoss}\nTarget 1: ${signal.targets[0]}`,
		icon: "/favicon.ico",
		badge: "/favicon.ico",
		tag: "trading-signal",
		renotify: true,
		requireInteraction: true
	  });

	  // Play notification sound
	  NotificationService.audio.play().catch(console.error);
	  
	  notification.onclick = () => {
		window.focus();
		notification.close();
	  };
	}
  }
};

const useNotifications = (signal) => {
  useEffect(() => {
	NotificationService.requestPermission();
  }, []);

  useEffect(() => {
	if (signal) {
	  NotificationService.showNotification(signal);
	}
  }, [signal]);
};

export default useNotifications;
