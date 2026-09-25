import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PrompterSettings, RecordingStatus } from '../types';
import { Eye, RotateCcw, Play, Pause } from 'lucide-react';

interface TeleprompterOverlayProps {
  script: string;
  settings: PrompterSettings;
  recordingStatus: RecordingStatus;
  isRehearsing: boolean;
  onToggleRehearsal: () => void;
  onResetScroll: () => void;
  resetSignal: number;
  language: 'hi' | 'en';
}

export const TeleprompterOverlay: React.FC<TeleprompterOverlayProps> = ({
  script,
  settings,
  recordingStatus,
  isRehearsing,
  onToggleRehearsal,
  onResetScroll,
  resetSignal,
  language
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const animIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const [isManualDragging, setIsManualDragging] = useState<boolean>(false);

  // Active scrolling condition: either recording & not paused, or rehearsing
  const isScrollingActive = (recordingStatus === 'recording') || isRehearsing;

  // Auto-scroll loop using requestAnimationFrame with delta-time calculation
  const scrollStep = useCallback((currentTime: number) => {
    if (lastTimeRef.current == null) {
      lastTimeRef.current = currentTime;
    }
    const deltaTime = (currentTime - lastTimeRef.current) / 1000;
    lastTimeRef.current = currentTime;

    if (containerRef.current && isScrollingActive && !isManualDragging) {
      // scrollSpeed translates from 1 to 10 scale into pixels per second (e.g. 15px/s to 120px/s)
      const pxPerSec = settings.scrollSpeed * 14;
      const increment = pxPerSec * deltaTime;

      containerRef.current.scrollTop += increment;

      // Stop if reached the very end
      const maxScroll = containerRef.current.scrollHeight - containerRef.current.clientHeight;
      if (containerRef.current.scrollTop >= maxScroll) {
        // reached bottom
      }
    }

    if (isScrollingActive) {
      animIdRef.current = requestAnimationFrame(scrollStep);
    }
  }, [isScrollingActive, isManualDragging, settings.scrollSpeed]);

  useEffect(() => {
    if (isScrollingActive) {
      lastTimeRef.current = null;
      animIdRef.current = requestAnimationFrame(scrollStep);
    } else {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
      lastTimeRef.current = null;
    }

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
    };
  }, [isScrollingActive, scrollStep]);

  // Handle external reset signal
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [resetSignal]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-between">
      {/* Eye Contact Guide Line (Subtle line at upper 15% height where phone/webcam lens is located) */}
      {settings.showEyeGuide && (
        <div className="w-full flex flex-col items-center pt-24 pb-2 relative pointer-events-none">
          <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-rose-500/70 to-transparent shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-guide-pulse" />
          <div className="flex items-center gap-1 mt-1 text-[10px] text-white/50 tracking-wider uppercase font-medium">
            <Eye className="w-3 h-3" />
            <span>{language === 'hi' ? 'कैमरा आई-कांटेक्ट लेवल' : 'Eye Contact Guide'}</span>
          </div>
        </div>
      )}

      {/* Transparent Teleprompter Scrollport (No Background Box, 100% transparent) */}
      <div
        ref={containerRef}
        onWheel={() => {
          // Allow natural user scroll wheel anytime
        }}
        onTouchStart={() => setIsManualDragging(true)}
        onTouchEnd={() => setIsManualDragging(false)}
        onMouseDown={() => setIsManualDragging(true)}
        onMouseUp={() => setIsManualDragging(false)}
        className="w-full h-full overflow-y-auto pointer-events-auto no-scrollbar scroll-smooth px-6 md:px-12 flex flex-col items-center"
        style={{
          transform: settings.mirrorHorizontal ? 'scaleX(-1)' : 'none',
        }}
      >
        {/* Top spacer so the first sentence aligns with presenter's eyes */}
        <div className="w-full h-36 md:h-48 shrink-0" />

        {/* The Text Content - Crystal clear, zero background container */}
        <div
          ref={textRef}
          className={`font-semibold tracking-normal text-shadow-heavy select-none transition-all duration-75 cursor-grab active:cursor-grabbing ${
            settings.textAlign === 'center'
              ? 'text-center'
              : settings.textAlign === 'right'
              ? 'text-right'
              : 'text-left'
          }`}
          style={{
            maxWidth: `${settings.textWidth}%`,
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            color: settings.textColor,
          }}
        >
          {script.split('\n').map((paragraph, idx) => {
            if (!paragraph.trim()) {
              return <div key={idx} className="h-6" />;
            }
            return (
              <p key={idx} className="mb-4">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Bottom spacer so user can read until the very last sentence */}
        <div className="w-full h-[60vh] shrink-0 flex items-center justify-center">
          <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-xs text-white/60">
            {language === 'hi' ? '— स्क्रिप्ट समाप्त (End of Script) —' : '— End of Script —'}
          </div>
        </div>
      </div>

      {/* Floating Quick Action Mini HUD (Reset to Top & Rehearsal Play/Pause) */}
      <div className="absolute right-4 bottom-28 pointer-events-auto flex flex-col gap-2 z-20">
        <button
          onClick={onResetScroll}
          title={language === 'hi' ? 'स्क्रिप्ट को ऊपर से शुरू करें' : 'Reset Scroll to Top'}
          className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-transform active:scale-95 shadow-lg cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {recordingStatus === 'idle' && (
          <button
            onClick={onToggleRehearsal}
            title={
              isRehearsing
                ? (language === 'hi' ? 'रिहर्सल पॉज़ करें' : 'Pause Rehearsal')
                : (language === 'hi' ? 'बिना रिकॉर्डिंग रिहर्सल करें' : 'Start Rehearsal')
            }
            className={`w-10 h-10 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-95 shadow-lg cursor-pointer ${
              isRehearsing
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-black/60 hover:bg-black/80 text-white'
            }`}
          >
            {isRehearsing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
        )}
      </div>
    </div>
  );
};
