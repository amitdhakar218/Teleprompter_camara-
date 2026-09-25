import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraView } from './components/CameraView';
import { TeleprompterOverlay } from './components/TeleprompterOverlay';
import { StudioControls } from './components/StudioControls';
import { ScriptModal } from './components/ScriptModal';
import { SettingsModal } from './components/SettingsModal';
import { VideoPreviewModal } from './components/VideoPreviewModal';
import { AndroidProjectViewer } from './components/AndroidProjectViewer';
import { DEFAULT_SCRIPTS } from './data/defaultScripts';
import { 
  RecordingStatus, 
  PrompterSettings, 
  ScriptItem, 
  RecordedVideo, 
  Language 
} from './types';
import { 
  Languages, 
  Maximize, 
  Minimize, 
  Code, 
  Video, 
  Sliders, 
  FileText,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const DEFAULT_SETTINGS: PrompterSettings = {
  fontSize: 28,
  lineHeight: 1.6,
  textColor: '#FFFFFF',
  scrollSpeed: 3.5,
  textWidth: 75,
  textAlign: 'center',
  mirrorHorizontal: false,
  showEyeGuide: true,
  countdownSeconds: 3,
  highContrastShadow: true,
};

export default function App() {
  const [language, setLanguage] = useState<Language>('hi');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Prompter settings and script state
  const [prompterSettings, setPrompterSettings] = useState<PrompterSettings>(() => {
    try {
      const stored = localStorage.getItem('teleprompter_custom_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed, mirrorHorizontal: false };
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });
  const [currentScript, setCurrentScript] = useState<string>(DEFAULT_SCRIPTS[0].content);
  const [savedScripts, setSavedScripts] = useState<ScriptItem[]>(() => {
    try {
      const stored = localStorage.getItem('teleprompter_custom_scripts');
      if (stored) {
        return [...DEFAULT_SCRIPTS, ...JSON.parse(stored)];
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_SCRIPTS;
  });

  // Recording engine state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [countdownValue, setCountdownValue] = useState<number>(0);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordedVideo, setRecordedVideo] = useState<RecordedVideo | null>(null);
  const [isRehearsing, setIsRehearsing] = useState<boolean>(false);
  const [resetSignal, setResetSignal] = useState<number>(0);

  // Modals state
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isVideoPreviewOpen, setIsVideoPreviewOpen] = useState<boolean>(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);

  // References for MediaRecorder and timers
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // Update prompter settings
  const handleUpdateSettings = (partial: Partial<PrompterSettings>) => {
    setPrompterSettings((prev) => ({ ...prev, ...partial }));
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Switch camera front/back
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Start Actual MediaRecorder
  const beginActualRecording = useCallback(() => {
    if (!stream) return;

    try {
      recordedChunksRef.current = [];

      // Determine best supported mimeType
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      let selectedMime = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(
        stream,
        selectedMime ? { mimeType: selectedMime } : undefined
      );

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, {
          type: selectedMime || 'video/webm',
        });
        const videoUrl = URL.createObjectURL(fullBlob);
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1)
          .toString()
          .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now
          .getHours()
          .toString()
          .padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now
          .getSeconds()
          .toString()
          .padStart(2, '0')}`;

        setRecordedVideo({
          blob: fullBlob,
          url: videoUrl,
          durationSeconds: recordingDuration,
          fileSizeBytes: fullBlob.size,
          timestamp,
        });

        setIsVideoPreviewOpen(true);
        setRecordingStatus('idle');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(500); // 500ms chunk slices

      setRecordingStatus('recording');
      setIsRehearsing(false);
      recordingStartTimeRef.current = Date.now();

      // Start duration timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting MediaRecorder:', err);
      setRecordingStatus('idle');
    }
  }, [stream, recordingDuration]);

  // Start Recording Trigger (with optional countdown)
  const handleStartRecording = () => {
    if (!stream) {
      alert(
        language === 'hi'
          ? 'कैमरा लोड हो रहा है, कृपया प्रतीक्षा करें।'
          : 'Camera is still initializing, please wait.'
      );
      return;
    }

    setRecordingDuration(0);

    if (prompterSettings.countdownSeconds > 0) {
      setRecordingStatus('countdown');
      setCountdownValue(prompterSettings.countdownSeconds);

      let current = prompterSettings.countdownSeconds;
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      countdownIntervalRef.current = window.setInterval(() => {
        current -= 1;
        if (current <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setCountdownValue(0);
          beginActualRecording();
        } else {
          setCountdownValue(current);
        }
      }, 1000);
    } else {
      beginActualRecording();
    }
  };

  // Pause / Resume Recording
  const handlePauseResumeRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recordingStatus === 'recording') {
      recorder.pause();
      setRecordingStatus('paused');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    } else if (recordingStatus === 'paused') {
      recorder.resume();
      setRecordingStatus('recording');
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      setRecordingStatus('idle');
    }
  };

  // Save new custom script
  const handleSaveNewScript = (newScriptData: Omit<ScriptItem, 'id' | 'updatedAt'>) => {
    const newScript: ScriptItem = {
      ...newScriptData,
      id: `custom-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    const updated = [...savedScripts, newScript];
    setSavedScripts(updated);

    // Save only custom scripts to localStorage
    const customOnly = updated.filter((s) => s.category === 'custom');
    try {
      localStorage.setItem('teleprompter_custom_scripts', JSON.stringify(customOnly));
    } catch (e) {
      // storage quota
    }
  };

  // Delete script
  const handleDeleteScript = (id: string) => {
    const updated = savedScripts.filter((s) => s.id !== id);
    setSavedScripts(updated);
    const customOnly = updated.filter((s) => s.category === 'custom');
    try {
      localStorage.setItem('teleprompter_custom_scripts', JSON.stringify(customOnly));
    } catch (e) {
      // storage quota
    }
  };

  // Retake video
  const handleRetakeVideo = () => {
    if (recordedVideo?.url) {
      URL.revokeObjectURL(recordedVideo.url);
    }
    setRecordedVideo(null);
    setIsVideoPreviewOpen(false);
    setResetSignal((prev) => prev + 1);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (recordedVideo?.url) URL.revokeObjectURL(recordedVideo.url);
    };
  }, [recordedVideo]);

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      {/* 
        TOP BAR CONTRACT:
        Zone 1: Single text element wordmark
        Zone 2: 4-6 text navigation links
        Zone 3: 1-2 primary actions (Language & Fullscreen)
      */}
      <header className="absolute top-0 left-0 right-0 z-30 px-4 md:px-6 py-3 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2">
          <span className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            Teleprompter Studio <span className="text-xs font-normal text-rose-400 hidden sm:inline">| अमित धाकड़</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          <button
            onClick={() => setIsScriptModalOpen(true)}
            className="hover:text-white transition-colors cursor-pointer"
          >
            {language === 'hi' ? 'स्क्रिप्ट' : 'Scripts'}
          </button>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="hover:text-white transition-colors cursor-pointer"
          >
            {language === 'hi' ? 'डिस्प्ले' : 'Settings'}
          </button>
          <button
            onClick={() => setIsAndroidModalOpen(true)}
            className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'Android APK कोड' : 'Android Kotlin APK'}</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Language Toggle & Fullscreen) */}
        <div className="flex items-center gap-2">
          {/* Android Code CTA button on mobile view */}
          <button
            onClick={() => setIsAndroidModalOpen(true)}
            className="md:hidden px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
            <span>APK</span>
          </button>

          {/* Hindi / English Toggle */}
          <button
            onClick={() => setLanguage((prev) => (prev === 'hi' ? 'en' : 'hi'))}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs font-medium text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
            title="भाषा बदलें (Switch Language)"
          >
            <Languages className="w-3.5 h-3.5 text-rose-400" />
            <span>{language === 'hi' ? 'English' : 'हिंदी'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors cursor-pointer border border-white/10"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Viewport: Live Camera Feed */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <CameraView
          facingMode={facingMode}
          onFacingModeToggle={handleToggleFacingMode}
          recordingStatus={recordingStatus}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          onStreamReady={setStream}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted((prev) => !prev)}
          language={language}
        />

        {/* Teleprompter Text Overlay (Completely transparent background, zero watermark on video) */}
        <TeleprompterOverlay
          script={currentScript}
          settings={prompterSettings}
          recordingStatus={recordingStatus}
          isRehearsing={isRehearsing}
          onToggleRehearsal={() => setIsRehearsing((prev) => !prev)}
          onResetScroll={() => setResetSignal((prev) => prev + 1)}
          resetSignal={resetSignal}
          language={language}
        />

        {/* 3-Second Action Countdown Overlay */}
        {recordingStatus === 'countdown' && (
          <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-28 h-28 rounded-full border-4 border-rose-500/80 flex items-center justify-center animate-bounce shadow-[0_0_50px_rgba(244,63,94,0.8)]">
              <span className="text-6xl font-black text-white font-mono">
                {countdownValue}
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold tracking-wider uppercase text-rose-300">
              {language === 'hi' ? 'तैयार हो जाइए...' : 'Get Ready...'}
            </p>
          </div>
        )}
      </main>

      {/* Bottom Floating Control Deck */}
      <StudioControls
        recordingStatus={recordingStatus}
        recordingDuration={recordingDuration}
        onStartRecording={handleStartRecording}
        onPauseResumeRecording={handlePauseResumeRecording}
        onStopRecording={handleStopRecording}
        prompterSettings={prompterSettings}
        onUpdatePrompterSettings={handleUpdateSettings}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        onOpenScriptModal={() => setIsScriptModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        language={language}
      />

      {/* Script Manager Modal */}
      <ScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        currentScript={currentScript}
        onSelectScriptText={(newText) => {
          setCurrentScript(newText);
          setResetSignal((prev) => prev + 1);
        }}
        savedScripts={savedScripts}
        onSaveNewScript={handleSaveNewScript}
        onDeleteScript={handleDeleteScript}
        language={language}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={prompterSettings}
        onUpdateSettings={handleUpdateSettings}
        language={language}
      />

      {/* Video Preview & Save to Device Modal */}
      <VideoPreviewModal
        isOpen={isVideoPreviewOpen}
        onClose={() => setIsVideoPreviewOpen(false)}
        video={recordedVideo}
        onRetake={handleRetakeVideo}
        language={language}
      />

      {/* Android Studio Kotlin Codebase & GitHub Actions APK Builder */}
      <AndroidProjectViewer
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        language={language}
      />
    </div>
  );
}
