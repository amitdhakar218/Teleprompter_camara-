export type Language = 'hi' | 'en';

export type RecordingStatus = 'idle' | 'countdown' | 'recording' | 'paused' | 'reviewing';

export interface PrompterSettings {
  fontSize: number;          // 18 - 56 px
  lineHeight: number;        // 1.4 - 2.4
  textColor: string;         // hex color
  scrollSpeed: number;       // 1 - 10 (or 50 - 300 WPM)
  textWidth: number;         // 40% - 100%
  textAlign: 'left' | 'center' | 'right';
  mirrorHorizontal: boolean; // For beam-splitter teleprompter glass
  showEyeGuide: boolean;     // Eye-contact alignment guide
  countdownSeconds: number;  // 3, 5, or 0
  highContrastShadow: boolean;
}

export interface ScriptItem {
  id: string;
  title: string;
  content: string;
  category: 'youtube' | 'news' | 'business' | 'motivation' | 'custom';
  language: 'hi' | 'en';
  updatedAt: string;
}

export interface AndroidFile {
  path: string;
  name: string;
  language: 'kotlin' | 'xml' | 'groovy' | 'yaml' | 'markdown';
  description: string;
  descriptionHi: string;
  content: string;
}

export interface RecordedVideo {
  blob: Blob;
  url: string;
  durationSeconds: number;
  fileSizeBytes: number;
  timestamp: string;
}
