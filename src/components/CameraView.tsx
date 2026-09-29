import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, ZoomIn, ZoomOut, Mic, VolumeX, AlertCircle } from 'lucide-react';
import { RecordingStatus } from '../types';

interface CameraViewProps {
  facingMode: 'user' | 'environment';
  onFacingModeToggle: () => void;
  recordingStatus: RecordingStatus;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onStreamReady: (stream: MediaStream | null) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  aspectRatio: '9:16' | '16:9' | '1:1';
  resolution: '720p' | '1080p' | '4k';
  mirrorVideo: boolean;
  language: 'hi' | 'en';
}

export const CameraView: React.FC<CameraViewProps> = ({
  facingMode,
  onFacingModeToggle,
  zoomLevel,
  onZoomChange,
  onStreamReady,
  isMuted,
  onToggleMute,
  resolution,
  mirrorVideo,
  language
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [hasHardwareZoom, setHasHardwareZoom] = useState<boolean>(false);
  const [capabilities, setCapabilities] = useState<{ min: number; max: number; step: number }>({ min: 1, max: 3, step: 0.1 });
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(true);

  // Fast, instant camera initialization without blocking
  const startCamera = useCallback(async () => {
    try {
      setIsCameraLoading(true);
      setErrorMsg(null);

      // Clean up previous active stream
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn('Track stop error', e);
          }
        });
        activeStreamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg(
          language === 'hi'
            ? 'आपके ब्राउज़र में कैमरा API उपलब्ध नहीं है।'
            : 'Camera API not supported in this browser.'
        );
        onStreamReady(null);
        setIsCameraLoading(false);
        return;
      }

      // Natural sensor resolution constraints
      let targetWidth = 1920;
      let targetHeight = 1080;
      if (resolution === '720p') {
        targetWidth = 1280;
        targetHeight = 720;
      } else if (resolution === '4k') {
        targetWidth = 3840;
        targetHeight = 2160;
      }

      let mediaStream: MediaStream | null = null;

      // Fast Attempt 1: Natural camera feed with standard facingMode
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: targetWidth },
            height: { ideal: targetHeight },
            frameRate: { ideal: 30, max: 60 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (err1) {
        console.warn('Standard getUserMedia failed, trying fast fallback:', err1);
        try {
          // Fast Attempt 2: Basic video with audio
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode } },
            audio: true
          });
        } catch (err2) {
          // Fast Attempt 3: Pure video fallback
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      if (!mediaStream) {
        throw new Error('Unable to access camera');
      }

      activeStreamRef.current = mediaStream;
      onStreamReady(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      // Check for hardware optical/sensor zoom
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const caps = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
        if (caps.zoom) {
          setHasHardwareZoom(true);
          setCapabilities({
            min: caps.zoom.min || 1,
            max: caps.zoom.max || 3,
            step: caps.zoom.step || 0.1
          });
        } else {
          setHasHardwareZoom(false);
        }
      }

      // Audio mic level analyzer
      try {
        const audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length > 0) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;

            const source = audioCtx.createMediaStreamSource(mediaStream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateAudioMeter = () => {
              if (analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
              }
              animFrameRef.current = requestAnimationFrame(updateAudioMeter);
            };
            updateAudioMeter();
          }
        }
      } catch (e) {
        console.warn('Audio meter init error', e);
      }

      setIsCameraLoading(false);
    } catch (err: any) {
      console.error('Camera startup error:', err);
      let message = language === 'hi' 
        ? 'कैमरा शुरू नहीं हो सका। कृपया कैमरा और माइक की अनुमति दें।'
        : 'Could not access camera. Please allow camera permissions.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = language === 'hi'
          ? 'कैमरा परमिशन अस्वीकृत है। कृपया सेटिंग्स या URL बार में कैमरा अनुमति दें।'
          : 'Camera permission denied. Please allow camera in settings.';
      }
      setErrorMsg(message);
      onStreamReady(null);
      setIsCameraLoading(false);
    }
  }, [facingMode, resolution, language, onStreamReady]);

  useEffect(() => {
    startCamera();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => t.stop());
        activeStreamRef.current = null;
      }
    };
  }, [facingMode, resolution, startCamera]);

  // Apply hardware sensor zoom if available
  useEffect(() => {
    if (activeStreamRef.current && hasHardwareZoom) {
      const videoTrack = activeStreamRef.current.getVideoTracks()[0];
      if (videoTrack && typeof (videoTrack as any).applyConstraints === 'function') {
        try {
          const hwZoom = Math.min(Math.max(zoomLevel, capabilities.min || 1), capabilities.max || 3);
          (videoTrack as any).applyConstraints({
            advanced: [{ zoom: hwZoom }]
          }).catch(() => {});
        } catch (e) {}
      }
    }
  }, [zoomLevel, hasHardwareZoom, capabilities]);

  // Toggle Mute on audio track
  useEffect(() => {
    if (activeStreamRef.current) {
      const audioTracks = activeStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Mirror horizontally ONLY for front selfie camera
  const shouldMirror = facingMode === 'user' && mirrorVideo;

  // Visual Zoom:
  // Base zoom is 1.0x (100% natural, NO scale transform).
  // Zooming in gently scales up from 1.0x to 3.0x.
  // Video NEVER scales below 1.0x (it will NEVER shrink into a tiny box).
  const clampedZoom = Math.max(1.0, zoomLevel);
  const digitalScale = !hasHardwareZoom && clampedZoom > 1.0 ? clampedZoom : 1.0;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none flex items-center justify-center">
      {/* 
        NATURAL CAMERA VIEWPORT:
        Always fills the screen smoothly like a real phone camera app.
        No artificial aspect-ratio box shrinking, no huge black bars, no face cut-off.
      */}
      <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transition-transform duration-100 will-change-transform"
          style={{
            transform: `${shouldMirror ? 'scaleX(-1)' : 'scaleX(1)'} ${digitalScale > 1.0 ? `scale(${digitalScale})` : ''}`,
            transformOrigin: 'center center'
          }}
        />

        {/* Small natural quality watermark badge */}
        <div className="absolute bottom-3 left-3 pointer-events-none px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/70">
          {resolution.toUpperCase()} · {clampedZoom.toFixed(1)}x
        </div>
      </div>

      {/* Loading Spinner */}
      {isCameraLoading && (
        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center z-30 pointer-events-none">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mb-2" />
          <span className="text-xs text-slate-300 font-medium">
            {language === 'hi' ? 'कैमरा लोड हो रहा है...' : 'Starting camera...'}
          </span>
        </div>
      )}

      {/* Permission or Access Error Banner */}
      {errorMsg && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-40">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-3 border border-rose-500/20">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">
            {language === 'hi' ? 'कैमरा शुरू नहीं हुआ' : 'Camera Unavailable'}
          </h3>
          <p className="text-xs text-slate-300 max-w-sm mb-5 leading-relaxed">{errorMsg}</p>
          <button
            onClick={startCamera}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-900/30 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
          </button>
        </div>
      )}

      {/* Top Left: Audio Mic Level Bar & Camera Switch */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        {/* Audio Mic Level Bar */}
        <div 
          onClick={onToggleMute}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white cursor-pointer hover:bg-black/80 transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <div className="w-10 h-1.5 bg-white/20 rounded-full overflow-hidden flex items-center">
            <div 
              className={`h-full transition-all duration-75 ${
                isMuted ? 'w-0' : audioLevel > 70 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: isMuted ? '0%' : `${audioLevel}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums font-mono opacity-80">
            {isMuted ? 'Muted' : `${audioLevel}%`}
          </span>
        </div>

        {/* Current Camera Mode Switch Indicator */}
        <button
          onClick={onFacingModeToggle}
          title={language === 'hi' ? 'कैमरा बदलें (Front / Back)' : 'Switch Front/Back Camera'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-medium text-xs">
            {facingMode === 'user' 
              ? (language === 'hi' ? 'सेल्फी' : 'Front') 
              : (language === 'hi' ? 'बैक' : 'Rear')}
          </span>
        </button>
      </div>

      {/* Top Right: Clean Minimal Normal Camera Zoom HUD */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1.5">
        <div className="flex items-center bg-black/75 backdrop-blur-md border border-white/15 rounded-full px-1.5 py-1 text-xs text-white font-mono shadow-xl">
          <button
            onClick={() => onZoomChange(Math.max(1.0, +(clampedZoom - 0.1).toFixed(1)))}
            disabled={clampedZoom <= 1.0}
            className="p-1 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer active:scale-90 transition-transform"
            title="Zoom Out (-0.1)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => {
              // Tapping toggles between 1.0x (Normal) and 2.0x (Zoom) like native camera
              onZoomChange(Math.abs(clampedZoom - 1.0) < 0.15 ? 2.0 : 1.0);
            }}
            className="px-2 font-bold tabular-nums min-w-[36px] text-center text-rose-400 hover:text-rose-300 cursor-pointer text-xs"
            title="Tap to toggle 1x / 2x"
          >
            {clampedZoom.toFixed(1)}x
          </button>

          <button
            onClick={() => onZoomChange(Math.min(3.0, +(clampedZoom + 0.1).toFixed(1)))}
            disabled={clampedZoom >= 3.0}
            className="p-1 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer active:scale-90 transition-transform"
            title="Zoom In (+0.1)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Minimal 1x and 2x pills */}
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-0.5 text-[11px] text-white font-mono shadow-md">
          {[1.0, 2.0].map((preset) => (
            <button
              key={preset}
              onClick={() => onZoomChange(preset)}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer font-bold ${
                Math.abs(clampedZoom - preset) < 0.15
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={`${preset}x Zoom`}
            >
              {preset}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
