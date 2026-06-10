import * as ImagePicker from 'expo-image-picker';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

const ACTION_SHEET_DISMISS_MS = 400;

function afterActionSheetDismiss(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ACTION_SHEET_DISMISS_MS));
}

async function pickFromLibrary(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Photos', 'Allow photo library access to choose a profile picture.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return result.assets[0].uri;
}

async function pickFromCamera(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Camera', 'Allow camera access to take a profile picture.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return result.assets[0].uri;
}

export function pickProfilePhoto(): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    return pickFromLibrary();
  }

  return new Promise((resolve) => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Choose Photo', 'Take Photo', 'Cancel'],
        cancelButtonIndex: 2,
      },
      (index) => {
        if (index === 0) {
          void afterActionSheetDismiss()
            .then(() => pickFromLibrary())
            .then(resolve);
          return;
        }
        if (index === 1) {
          void afterActionSheetDismiss()
            .then(() => pickFromCamera())
            .then(resolve);
          return;
        }
        resolve(null);
      },
    );
  });
}