import { Platform, Alert, AlertButton } from 'react-native';

export interface AlertConfig {
  title: string;
  message: string;
  buttons?: AlertButton[];
}

/**
 * Cross-platform alert utility that works on both web and native platforms
 * Uses Alert.alert on native (iOS/Android) and window.confirm/prompt on web
 */
export const showAlert = (config: AlertConfig): void => {
  const { title, message, buttons = [] } = config;

  if (Platform.OS === 'web') {
    // Handle web with window.confirm/alert
    if (buttons.length === 0) {
      // No buttons - just show a simple alert
      window.alert(`${title}\n\n${message}`);
    } else if (buttons.length === 1) {
      // Single button - use alert and trigger the button callback
      window.alert(`${title}\n\n${message}`);
      // Execute the button press callback asynchronously to avoid blocking
      buttons[0].onPress?.();
    } else if (buttons.length === 2) {
      // Two buttons (typical Cancel/OK or Cancel/Join scenario)
      const confirmed = window.confirm(`${title}\n\n${message}`);
      // Execute the appropriate button press callback asynchronously
      if (confirmed) {
        // User clicked OK - trigger the second button (usually the action button)
        Promise.resolve().then(() => buttons[1].onPress?.());
      } else {
        // User clicked Cancel - trigger the first button (usually cancel)
        Promise.resolve().then(() => buttons[0].onPress?.());
      }
    } else {
      // Multiple buttons - show first button as cancel, second as primary action
      const confirmed = window.confirm(`${title}\n\n${message}`);
      Promise.resolve().then(() => {
        if (confirmed) {
          buttons[1].onPress?.();
        } else {
          buttons[0].onPress?.();
        }
      });
    }
  } else {
    // Use native Alert on iOS/Android
    Alert.alert(title, message, buttons);
  }
};

/**
 * Convenience function for simple confirmation dialogs
 */
export const showConfirmAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  showAlert({
    title,
    message,
    buttons: [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'OK', onPress: onConfirm }
    ]
  });
};

