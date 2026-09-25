import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, ZoomIn, ZoomOut, Mic, Volume2, VolumeX, AlertCircle } from 'lucide-react';
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
  recordingStatus,
  zoomLevel,
  onZoomChange,
  onStreamReady,
  isMuted,
  onToggleMute,
  aspectRatio,
  resolution,
  mirrorVideo,
  language
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [hasHardwareZoom, setHasHardwareZoom] = useState<boolean>(false);
  const [capabilities, setCapabilities] = useState<{ min: number; max: number; step: number }>({ min: 1, max: 5, step: 0.1 });

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    try {
      setErrorMsg(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // First check if mediaDevices is supported (in some in-app webviews or insecure origins it may be undefined)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg(
          language === 'hi'
            ? 'आपके ब्राउज़र में कैमरा API उपलब्ध नहीं है। कृपया Chrome/Firefox में सुरक्षित HTTPS URL खोलें।'
            : 'Camera API not supported in this browser. Please use Chrome/Firefox over HTTPS.'
        );
        onStreamReady(null);
        return;
      }

      let mediaStream: MediaStream;

      // Try video + audio first, if mic fails fallback to video only
      // Determine width/height according to resolution and aspect ratio
      let targetWidth = 1920;
      let targetHeight = 1080;
      if (resolution === '720p') {
        targetWidth = 1280;
        targetHeight = 720;
      } else if (resolution === '4k') {
        targetWidth = 3840;
        targetHeight = 2160;
      }

      // If vertical 9:16, invert width and height
      if (aspectRatio === '9:16') {
        const tmp = targetWidth;
        targetWidth = targetHeight;
        targetHeight = tmp;
      } else if (aspectRatio === '1:1') {
        targetWidth = Math.min(targetWidth, targetHeight);
        targetHeight = targetWidth;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: targetWidth },
            height: { ideal: targetHeight },
          },
          audio: true
        };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (audioVideoErr: any) {
        console.warn('Audio+Video failed, trying video only:', audioVideoErr);
        // Fallback to video only in case microphone permission was blocked
        const videoOnlyConstraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: targetWidth },
            height: { ideal: targetHeight },
          },
          audio: false
        };
        mediaStream = await navigator.mediaDevices.getUserMedia(videoOnlyConstraints);
      }

      setStream(mediaStream);
      onStreamReady(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      // Check hardware zoom capabilities
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const caps = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
        if (caps.zoom) {
          setHasHardwareZoom(true);
          setCapabilities({
            min: caps.zoom.min || 1,
            max: caps.zoom.max || 5,
            step: caps.zoom.step || 0.1
          });
        } else {
          setHasHardwareZoom(false);
        }
      }

      // Audio meter analyzer
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

    } catch (err: any) {
      console.error('Camera access error:', err);
      let message = language === 'hi' 
        ? 'कैमरा या माइक्रोफोन परमिशन की अनुमति दें ताकि लाइव वीडियो दिखे।'
        : 'Please allow camera and microphone permissions.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = language === 'hi'
          ? 'कैमरा परमिशन अस्वीकृत है। कृपया ब्राउज़र के URL बार में ताला (Lock 🔒) या सेटिंग्स आइकन दबाकर कैमरा की अनुमति Allow करें।'
          : 'Camera permission was denied. Tap the Lock icon 🔒 in browser to allow camera.';
      }
      setErrorMsg(message);
      onStreamReady(null);
    }
  }, [facingMode, resolution, aspectRatio, language, onStreamReady]);

  useEffect(() => {
    startCamera();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode]);

  // Apply hardware zoom if supported
  useEffect(() => {
    if (stream && hasHardwareZoom) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && typeof (videoTrack as any).applyConstraints === 'function') {
        try {
          (videoTrack as any).applyConstraints({
            advanced: [{ zoom: zoomLevel }]
          }).catch(() => {});
        } catch (e) {
          // Hardware zoom constraint failed, fallback to CSS scale
        }
      }
    }
  }, [zoomLevel, stream, hasHardwareZoom]);

  // Toggle Mute on audio track
  useEffect(() => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, stream]);

  // Determine aspect ratio class
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-full max-w-full rounded-2xl shadow-2xl';
      case '1:1':
        return 'aspect-square max-h-full max-w-full rounded-2xl shadow-2xl';
      case '16:9':
      default:
        return 'w-full h-full';
    }
  };

  // Compute whether to horizontally flip image like a real mirror (sheesha)
  // When front camera (user) is active and mirrorVideo is enabled, mirror it so lifting left hand appears on left side just like looking into a real mirror
  const shouldMirror = facingMode === 'user' && mirrorVideo;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none flex items-center justify-center p-0">
      {/* Video Framing Box for 9:16 or 1:1 or 16:9 */}
      <div className={`relative overflow-hidden bg-black flex items-center justify-center ${getAspectRatioClasses()}`}>
        {/* Real Video Element (Full body visible, no forced cropped zoom) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transition-transform duration-150"
          style={{
            transform: `${shouldMirror ? 'scaleX(-1)' : 'none'} scale(${
              !hasHardwareZoom ? zoomLevel : 1
            })`,
            transformOrigin: 'center center'
          }}
        />

        {/* Framing watermark label */}
        <div className="absolute bottom-3 left-3 pointer-events-none px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/70">
          {aspectRatio} · {resolution.toUpperCase()} · {zoomLevel.toFixed(1)}x
        </div>
      </div>

      {/* Permission or Access Error Banner */}
      {errorMsg && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-30">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 border border-rose-500/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {language === 'hi' ? 'कैमरा उपलब्ध नहीं है' : 'Camera Unavailable'}
          </h3>
          <p className="text-sm text-slate-300 max-w-md mb-6">{errorMsg}</p>
          <button
            onClick={startCamera}
            className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-900/30"
          >
            <RefreshCw className="w-4 h-4" />
            {language === 'hi' ? 'पुनः प्रयास करें (Retry)' : 'Retry Camera Access'}
          </button>
        </div>
      )}

      {/* Viewport HUD indicators (Recording, Audio Mic Level, Zoom Badge) */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
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
          <div className="w-12 h-1.5 bg-white/20 rounded-full overflow-hidden flex items-center">
            <div 
              className={`h-full transition-all duration-75 ${
                isMuted ? 'w-0' : audioLevel > 70 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: isMuted ? '0%' : `${audioLevel}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums font-mono opacity-80">
            {isMuted ? 'Muted' : `${audioLevel}%`}
          </span>
        </div>

        {/* Current Camera Mode Indicator */}
        <button
          onClick={onFacingModeToggle}
          title={language === 'hi' ? 'कैमरा बदलें (Front / Back)' : 'Switch Front/Back Camera'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white hover:bg-black/80 active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="capitalize">{facingMode === 'user' ? (language === 'hi' ? 'फ्रंट कैमरा' : 'Front') : (language === 'hi' ? 'बैक कैमरा' : 'Rear')}</span>
        </button>
      </div>

      {/* Zoom HUD Floating Pill (Right Side) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
        <div className="flex items-center bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-2 py-1 text-xs text-white font-mono">
          <button
            onClick={() => onZoomChange(Math.max(0.6, +(zoomLevel - 0.2).toFixed(1)))}
            disabled={zoomLevel <= 0.6}
            className="p-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Zoom Out (Wide Angle Full Body)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-semibold tabular-nums min-w-[38px] text-center">
            {zoomLevel.toFixed(1)}x
          </span>
          <button
            onClick={() => onZoomChange(Math.min(4, +(zoomLevel + 0.2).toFixed(1)))}
            disabled={zoomLevel >= 4}
            className="p-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
