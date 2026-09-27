// Native Android Bridge & Web Storage Utility

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      if (res.includes(',')) {
        resolve(res.substring(res.indexOf(',') + 1));
      } else {
        resolve(res);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function isAndroidNativeApp(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as any).AndroidBridge !== 'undefined' &&
    (typeof (window as any).AndroidBridge.initSaveVideo === 'function' ||
      typeof (window as any).AndroidBridge.saveVideoToStorage === 'function')
  );
}

export interface SaveResult {
  success: boolean;
  message: string;
  isNative: boolean;
  path?: string;
}

/**
 * Saves video directly to Android phone storage (MediaStore Movies/Teleprompter)
 * with robust 512KB chunking to prevent memory overload on long videos,
 * or triggers browser download if in web browser.
 */
export async function saveVideoToPhoneStorage(
  blob: Blob,
  timestamp: string,
  onProgress?: (percent: number) => void
): Promise<SaveResult> {
  // Determine true extension & MIME (avoiding fake MP4 container naming)
  const isMp4 = blob.type.includes('mp4');
  const ext = isMp4 ? 'mp4' : 'webm';
  const filename = `Camera_Video_${timestamp}.${ext}`;
  const mimeType = isMp4 ? 'video/mp4' : (blob.type || 'video/webm');

  // 1. Android Native Bridge (When running as Android APK)
  if (isAndroidNativeApp()) {
    const bridge = (window as any).AndroidBridge;

    // Check if chunked save is supported (production-grade)
    if (typeof bridge.initSaveVideo === 'function') {
      try {
        const initRes = bridge.initSaveVideo(filename, mimeType);
        if (initRes !== 'INIT_OK') {
          throw new Error('Failed to initialize storage: ' + initRes);
        }

        const CHUNK_SIZE = 512 * 1024; // 512 KB slices
        const totalSize = blob.size;
        let offset = 0;

        while (offset < totalSize) {
          const slice = blob.slice(offset, Math.min(offset + CHUNK_SIZE, totalSize));
          const chunkBase64 = await blobToBase64(slice);
          const ok = bridge.writeVideoChunk(chunkBase64);
          if (!ok) {
            bridge.cancelSaveVideo();
            throw new Error('Failed to write video chunk at ' + offset);
          }
          offset += slice.size;
          if (onProgress) {
            onProgress(Math.min(99, Math.round((offset / totalSize) * 100)));
          }
        }

        const finishRes = bridge.finishSaveVideo();
        if (finishRes && finishRes.startsWith('SUCCESS')) {
          if (onProgress) onProgress(100);
          return {
            success: true,
            message: 'वीडियो आपके फ़ोन की गैलरी और Movies फ़ोल्डर में सुरक्षित रूप से सेव हो गई!',
            isNative: true,
            path: finishRes.replace('SUCCESS: ', ''),
          };
        } else {
          throw new Error(finishRes);
        }
      } catch (err: any) {
        console.warn('Chunked native save failed, trying fallback:', err);
        if (bridge.cancelSaveVideo) bridge.cancelSaveVideo();
      }
    }

    // Fallback single-call for smaller clips
    try {
      const fullBase64 = await blobToBase64(blob);
      const res = bridge.saveVideoToStorage(fullBase64, filename, mimeType);
      if (res && res.startsWith('SUCCESS')) {
        return {
          success: true,
          message: 'वीडियो आपके फ़ोन की गैलरी और Movies फ़ोल्डर में सेव हो गई!',
          isNative: true,
          path: res.replace('SUCCESS: ', ''),
        };
      }
    } catch (e: any) {
      console.warn('Single-call native save error:', e);
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

    if (onProgress) onProgress(100);
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
  const ext = isMp4 ? 'mp4' : 'webm';
  const filename = `Camera_Video_${timestamp}.${ext}`;
  const mimeType = isMp4 ? 'video/mp4' : (blob.type || 'video/webm');

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
