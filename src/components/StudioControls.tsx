import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  FileText, 
  Settings, 
  Code, 
  Sliders,
  Volume2
} from 'lucide-react';
import { RecordingStatus, PrompterSettings } from '../types';

interface StudioControlsProps {
  recordingStatus: RecordingStatus;
  recordingDuration: number;
  onStartRecording: () => void;
  onPauseResumeRecording: () => void;
  onStopRecording: () => void;
  prompterSettings: PrompterSettings;
  onUpdatePrompterSettings: (partial: Partial<PrompterSettings>) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onOpenScriptModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAndroidModal: () => void;
  language: 'hi' | 'en';
}

export const StudioControls: React.FC<StudioControlsProps> = ({
  recordingStatus,
  recordingDuration,
  onStartRecording,
  onPauseResumeRecording,
  onStopRecording,
  prompterSettings,
  onUpdatePrompterSettings,
  zoomLevel,
  onZoomChange,
  onOpenScriptModal,
  onOpenSettingsModal,
  onOpenAndroidModal,
  language,
}) => {
  // Format recording duration (seconds -> MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const isRecordingOrPaused = recordingStatus === 'recording' || recordingStatus === 'paused';

  return (
    <div className="w-full flex flex-col items-center justify-end p-4 md:p-6 pointer-events-auto z-20">
      {/* Top Floating Control Capsule: Speed + Zoom + Status */}
      <div className="w-full max-w-xl bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4 shadow-2xl mb-3 flex flex-col gap-3">
        {/* Row 1: Speed Slider & Zoom Quick Selectors */}
        <div className="flex items-center justify-between gap-4 text-xs">
          {/* Prompter Speed Control */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-slate-300 font-medium whitespace-nowrap shrink-0 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              {language === 'hi' ? 'स्क्रॉल गति (Speed):' : 'Scroll Speed:'}
            </span>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={prompterSettings.scrollSpeed}
              onChange={(e) =>
                onUpdatePrompterSettings({ scrollSpeed: parseFloat(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <span className="text-white font-mono font-semibold tabular-nums min-w-[32px] text-right">
              {prompterSettings.scrollSpeed.toFixed(1)}x
            </span>
          </div>

          <div className="h-4 w-px bg-white/10 shrink-0" />

          {/* Quick Zoom Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {[1, 1.5, 2, 3].map((level) => (
              <button
                key={level}
                onClick={() => onZoomChange(level)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  Math.abs(zoomLevel - level) < 0.1
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-white/5 hover:bg-white/15 text-slate-300'
                }`}
              >
                {level}x
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Recording Timer Bar (if active) */}
        {isRecordingOrPaused && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/50 border border-white/5">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  recordingStatus === 'recording'
                    ? 'bg-rose-500 animate-ping'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-xs font-medium uppercase tracking-wide text-slate-200">
                {recordingStatus === 'recording'
                  ? (language === 'hi' ? 'लाइव रिकॉर्डिंग' : 'Recording Live')
                  : (language === 'hi' ? 'रिकॉर्डिंग पॉज़ है' : 'Recording Paused')}
              </span>
            </div>

            <div className="text-sm font-mono font-bold text-white tracking-wider tabular-nums">
              {formatTime(recordingDuration)}
            </div>

            <div className="text-[11px] text-slate-400">
              {language === 'hi' ? 'ओरिजिनल 1080p (नो वॉटरमार्क)' : 'No Watermark Clean'}
            </div>
          </div>
        )}
      </div>

      {/* Main Bottom Deck: Scripts / Record & Pause / Settings / Android Project */}
      <div className="w-full max-w-xl flex items-center justify-between gap-3 px-2">
        {/* Left Side: Script Editor Trigger */}
        <button
          onClick={onOpenScriptModal}
          disabled={recordingStatus === 'recording'}
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-white disabled:opacity-40 transition-colors p-2 rounded-xl hover:bg-white/5 cursor-pointer"
          title={language === 'hi' ? 'स्क्रिप्ट बदलें / नया टेक्स्ट डालें' : 'Edit Script / Paste Text'}
        >
          <div className="w-10 h-10 rounded-full bg-slate-800/90 border border-white/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-slate-200" />
          </div>
          <span className="text-[11px] font-medium tracking-tight">
            {language === 'hi' ? 'स्क्रिप्ट' : 'Script'}
          </span>
        </button>

        {/* Center: Record / Pause / Stop Group */}
        <div className="flex items-center gap-4">
          {/* Pause / Resume Button (Visible during recording) */}
          {isRecordingOrPaused && (
            <button
              onClick={onPauseResumeRecording}
              className={`w-12 h-12 rounded-full border border-white/20 flex items-center justify-center transition-all active:scale-95 shadow-lg cursor-pointer ${
                recordingStatus === 'paused'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
              }`}
              title={
                recordingStatus === 'paused'
                  ? (language === 'hi' ? 'रिकॉर्डिंग जारी रखें (Resume)' : 'Resume Recording')
                  : (language === 'hi' ? 'रिकॉर्डिंग पॉज़ करें (Pause)' : 'Pause Recording')
              }
            >
              {recordingStatus === 'paused' ? (
                <Play className="w-5 h-5 ml-0.5 fill-current" />
              ) : (
                <Pause className="w-5 h-5 fill-current" />
              )}
            </button>
          )}

          {/* Primary Action Button: Start Record or Stop Record */}
          {!isRecordingOrPaused ? (
            <button
              onClick={onStartRecording}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center p-1.5 shadow-[0_0_25px_rgba(225,29,72,0.6)] hover:shadow-[0_0_35px_rgba(225,29,72,0.8)] active:scale-95 transition-all cursor-pointer border-4 border-slate-900 group"
              title={language === 'hi' ? 'रिकॉर्डिंग शुरू करें' : 'Start Recording'}
            >
              <div className="w-full h-full rounded-full bg-rose-600 flex items-center justify-center">
                <span className="w-6 h-6 rounded-full bg-white transition-transform group-hover:scale-110" />
              </div>
            </button>
          ) : (
            <button
              onClick={onStopRecording}
              className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center p-2 shadow-2xl active:scale-95 transition-all cursor-pointer border-4 border-rose-500/80 group"
              title={language === 'hi' ? 'रिकॉर्डिंग रोकें और सेव करें' : 'Stop & Save Video'}
            >
              <Square className="w-6 h-6 fill-rose-500 text-rose-500 transition-transform group-hover:scale-95" />
            </button>
          )}
        </div>

        {/* Right Side: Settings & Android Code */}
        <div className="flex items-center gap-1">
          {/* Prompter Visual Settings */}
          <button
            onClick={onOpenSettingsModal}
            className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5 cursor-pointer"
            title={language === 'hi' ? 'टेक्स्ट का रंग, आकार व डिस्प्ले सेटिंग्स' : 'Text size, color, display settings'}
          >
            <div className="w-10 h-10 rounded-full bg-slate-800/90 border border-white/10 flex items-center justify-center">
              <Settings className="w-4 h-4 text-slate-200" />
            </div>
            <span className="text-[11px] font-medium tracking-tight">
              {language === 'hi' ? 'सेटिंग्स' : 'Display'}
            </span>
          </button>

          {/* Android Kotlin Code & APK Workflow Viewer */}
          <button
            onClick={onOpenAndroidModal}
            className="flex flex-col items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors p-2 rounded-xl hover:bg-white/5 cursor-pointer"
            title={language === 'hi' ? 'Android Studio प्रोजेक्ट कोड व GitHub Actions APK बिल्डर' : 'Android Kotlin code & GitHub Actions APK builder'}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center">
              <Code className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[11px] font-medium tracking-tight text-emerald-300">
              {language === 'hi' ? 'Android कोड' : 'Android APK'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
