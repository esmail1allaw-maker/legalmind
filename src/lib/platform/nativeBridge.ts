import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Clipboard } from '@capacitor/clipboard';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNativeApp } from './index';

export async function takePhoto(): Promise<File | null> {
  if (!isNativeApp()) return null;
  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt
    });
    if (!photo.path && !photo.webPath) return null;
    const response = await fetch(photo.webPath ?? photo.path!);
    const blob = await response.blob();
    const ext = photo.format === 'png' ? 'png' : 'jpg';
    return new File([blob], `photo-${Date.now()}.${ext}`, { type: blob.type || `image/${ext}` });
  } catch {
    return null;
  }
}

export async function shareText(title: string, text: string, url?: string): Promise<boolean> {
  try {
    if (isNativeApp()) {
      await Share.share({ title, text, url, dialogTitle: title });
      return true;
    }
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return true;
    }
    await Clipboard.write({ string: url ? `${text}\n${url}` : text });
    return true;
  } catch {
    return false;
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (isNativeApp()) {
      await Clipboard.write({ string: text });
      return true;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function downloadBlobNative(filename: string, blob: Blob): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const base64 = await blobToBase64(blob);
    const saved = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Documents,
      recursive: true
    });
    await Share.share({
      title: 'تنزيل الملف',
      text: filename,
      url: saved.uri,
      dialogTitle: 'حفظ أو مشاركة الملف'
    });
    return true;
  } catch {
    return false;
  }
}

export async function openApkDownload(url: string): Promise<void> {
  if (isNativeApp()) {
    window.open(url, '_system');
    return;
  }
  const link = document.createElement('a');
  link.href = url;
  link.download = '';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
