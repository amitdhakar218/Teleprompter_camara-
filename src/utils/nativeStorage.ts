// Native Android Bridge & Web Storage Utility

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function isAndroidNativeApp(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as any).AndroidBridge !== 'undefined' &&
    typeof (window as any).AndroidBridge.saveVideoToStorage === 'function'
  );
}

export interface SaveResult {
  success: boolean;
  message: string;
  isNative: boolean;
}

/**
 * Saves video directly to Android phone storage (MediaStore Movies/Teleprompter)
 * or triggers browser download if in web browser.
 */
export async function saveVideoToPhoneStorage(
  blob: Blob,
  timestamp: string
): Promise<SaveResult> {
  const isMp4 = blob.type.includes('mp4');
  const ext = isMp4 ? 'mp4' : 'mp4'; // Standardized for phone gallery detection
  const filename = `Camera_Video_${timestamp}.${ext}`;
  const mimeType = isMp4 ? 'video/mp4' : (blob.type || 'video/mp4');

  // 1. Android Native Bridge (When running as Android APK)
  if (isAndroidNativeApp()) {
    try {
      const base64Data = await blobToBase64(blob);
      const res = (window as any).AndroidBridge.saveVideoToStorage(
        base64Data,
        filename,
        mimeType
      );
      if (res && res.startsWith('SUCCESS')) {
        return {
          success: true,
          message: 'वीडियो आपके फ़ोन की गैलरी और Movies फ़ोल्डर में सुरक्षित रूप से सेव हो गई!',
          isNative: true,
        };
      }
    } catch (e: any) {
      console.warn('Native Android save error:', e);
    }
  }

  // 2. Web Browser Fallback (Downloads folder via Blob URL)
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);

    return {
      success: true,
      message: 'वीडियो आपके मोबाइल के Downloads फ़ोल्डर में डाउनलोड हो रही है!',
      isNative: false,
    };
  } catch (err: any) {
    console.error('Browser download failed:', err);
    return {
      success: false,
      message: 'वीडियो सेव करने में विफल: ' + (err?.message || 'अज्ञात त्रुटि'),
      isNative: false,
    };
  }
}

/**
 * Shares video using Android Intent chooser or Web Share API
 */
export async function shareVideoToApps(
  blob: Blob,
  timestamp: string
): Promise<SaveResult> {
  const isMp4 = blob.type.includes('mp4');
  const ext = isMp4 ? 'mp4' : 'mp4';
  const filename = `Camera_Video_${timestamp}.${ext}`;
  const mimeType = isMp4 ? 'video/mp4' : (blob.type || 'video/mp4');

  // 1. Android Native Chooser (When running in APK)
  if (isAndroidNativeApp() && typeof (window as any).AndroidBridge.shareVideo === 'function') {
    try {
      const base64Data = await blobToBase64(blob);
      const res = (window as any).AndroidBridge.shareVideo(base64Data, filename, mimeType);
      if (res && res.startsWith('SUCCESS')) {
        return {
          success: true,
          message: 'शेयरिंग मेन्यू खुल गया है!',
          isNative: true,
        };
      }
    } catch (e) {
      console.warn('Native share error:', e);
    }
  }

  // 2. Web Share API
  if (navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: mimeType });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Camera Recording',
          text: 'Camera video recording',
        });
        return {
          success: true,
          message: 'वीडियो शेयर हो गई!',
          isNative: false,
        };
      }
    } catch (e) {
      console.warn('Web share cancelled or error:', e);
    }
  }

  // Fallback to direct download
  return saveVideoToPhoneStorage(blob, timestamp);
}
