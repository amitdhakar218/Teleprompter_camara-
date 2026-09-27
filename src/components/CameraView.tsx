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
  const activeStreamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [hasHardwareZoom, setHasHardwareZoom] = useState<boolean>(false);
  const [capabilities, setCapabilities] = useState<{ min: number; max: number; step: number }>({ min: 1, max: 5, step: 0.1 });
  const [showZoomSlider, setShowZoomSlider] = useState<boolean>(false);

  // Initialize camera stream with robust device resolution & rear/front fallback
  const startCamera = useCallback(async () => {
    try {
      setErrorMsg(null);

      // 1. Synchronously stop and release existing active stream tracks
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn('Track stop warning:', e);
          }
        });
        activeStreamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Small async tick to allow mobile camera hardware sensor (HAL) to release cleanly
      await new Promise((res) => setTimeout(res, 80));

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg(
          language === 'hi'
            ? 'आपके ब्राउज़र में कैमरा API उपलब्ध नहीं है। कृपया Chrome/Firefox में सुरक्षित HTTPS URL खोलें।'
            : 'Camera API not supported in this browser. Please use Chrome/Firefox over HTTPS.'
        );
        onStreamReady(null);
        return;
      }

      // 2. Query available video devices to locate back/front camera accurately
      let targetDeviceId: string | undefined = undefined;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        if (videoDevices.length > 1) {
          if (facingMode === 'environment') {
            // Find back/rear camera by label keywords
            const backCam = videoDevices.find(d => 
              /back|rear|environment|camera 0|camera2 0|main|wide/i.test(d.label)
            ) || videoDevices[videoDevices.length - 1]; // Often last camera on mobile is rear
            if (backCam && backCam.deviceId) {
              targetDeviceId = backCam.deviceId;
            }
          } else {
            // Find front/user camera
            const frontCam = videoDevices.find(d => 
              /front|user|facing front|selfie|camera 1|camera2 1/i.test(d.label)
            ) || videoDevices[0];
            if (frontCam && frontCam.deviceId) {
              targetDeviceId = frontCam.deviceId;
            }
          }
        }
      } catch (enumErr) {
        console.warn('Device enumeration non-blocking error:', enumErr);
      }

      let mediaStream: MediaStream | null = null;

      // Determine width/height according to resolution and aspect ratio (requesting high-res to prevent pixelation)
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

      // Attempt 1: Standard facingMode with ideal constraint (most widely supported on mobile Android/iOS)
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: targetWidth },
            height: { ideal: targetHeight },
          },
          audio: true,
        });
      } catch (err1) {
        console.warn('Attempt 1 ideal facingMode failed, trying deviceId fallback:', err1);

        // Attempt 2: If targetDeviceId was determined, try with ideal deviceId
        if (targetDeviceId) {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { ideal: targetDeviceId },
                width: { ideal: targetWidth },
                height: { ideal: targetHeight },
              },
              audio: true,
            });
          } catch (err2) {
            console.warn('Attempt 2 deviceId fallback failed:', err2);
          }
        }

        // Attempt 3: Try simple facingMode string with audio: false (in case mic access caused issue)
        if (!mediaStream) {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: facingMode } },
              audio: false,
            });
          } catch (err3) {
            console.warn('Attempt 3 video-only failed, trying general fallback:', err3);
            // Attempt 4: Last-resort fallback to any video
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }
        }
      }

      if (!mediaStream) {
        throw new Error('Failed to acquire media stream');
      }

      activeStreamRef.current = mediaStream;
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
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(t => t.stop());
        activeStreamRef.current = null;
      }
    };
  }, [facingMode, resolution, aspectRatio, startCamera]);

  // Apply hardware zoom if supported for zoomLevel >= min
  useEffect(() => {
    if (stream && hasHardwareZoom) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && typeof (videoTrack as any).applyConstraints === 'function') {
        try {
          if (zoomLevel >= (capabilities.min || 1)) {
            const hwZoom = Math.min(zoomLevel, capabilities.max || 5);
            (videoTrack as any).applyConstraints({
              advanced: [{ zoom: hwZoom }]
            }).catch(() => {});
          }
        } catch (e) {
          // Hardware zoom constraint failed, fallback to CSS scale
        }
      }
    }
  }, [zoomLevel, stream, hasHardwareZoom, capabilities]);

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
  // Rear camera is NEVER mirrored. Only front camera when mirrorVideo is true.
  const shouldMirror = facingMode === 'user' && mirrorVideo;

  // Visual scale:
  // If hardware zoom is handling zoomLevel >= 1, visual scale is 1.
  // When zoomLevel < 1 (0.1x to 0.9x wide), CSS scale scales down smoothly.
  // If hardware zoom is not supported, CSS scale scales directly according to zoomLevel.
  const visualScale = hasHardwareZoom && zoomLevel >= (capabilities.min || 1)
    ? 1
    : zoomLevel;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none flex items-center justify-center p-0">
      {/* Video Framing Box for 9:16 or 1:1 or 16:9 */}
      <div className={`relative overflow-hidden bg-black flex items-center justify-center ${getAspectRatioClasses()}`}>
        {/* Real Video Element (Full body visible, high clarity, no forced cropped zoom) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transition-transform duration-100 will-change-transform"
          style={{
            transform: `${shouldMirror ? 'scaleX(-1)' : 'scaleX(1)'} scale(${visualScale})`,
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

      {/* Zoom HUD Floating Pill (Right Side) with interactive Slider & Presets */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1.5">
        <div className="flex items-center bg-black/70 backdrop-blur-md border border-white/15 rounded-full px-2 py-1 text-xs text-white font-mono shadow-lg">
          <button
            onClick={() => onZoomChange(Math.max(0.1, +(zoomLevel - 0.1).toFixed(1)))}
            disabled={zoomLevel <= 0.1}
            className="p-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90 transition-transform"
            title={language === 'hi' ? 'ज़ूम कम करें (0.1x तक)' : 'Zoom Out (down to 0.1x)'}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setShowZoomSlider(prev => !prev)}
            className="px-2 font-semibold tabular-nums min-w-[42px] text-center text-rose-400 hover:text-rose-300 cursor-pointer"
            title={language === 'hi' ? 'ज़ूम स्लाइडर खोलें / बंद करें' : 'Click to adjust Zoom slider'}
          >
            {zoomLevel.toFixed(1)}x
          </button>

          <button
            onClick={() => onZoomChange(Math.min(4.0, +(zoomLevel + 0.1).toFixed(1)))}
            disabled={zoomLevel >= 4.0}
            className="p-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90 transition-transform"
            title={language === 'hi' ? 'ज़ूम बढ़ाएँ (0.1 स्टेप)' : 'Zoom In (+0.1)'}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Zoom Presets Bar */}
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-1.5 py-0.5 text-[10px] text-white font-mono shadow-md">
          {[0.1, 0.5, 1.0, 2.0].map((preset) => (
            <button
              key={preset}
              onClick={() => onZoomChange(preset)}
              className={`px-1.5 py-0.5 rounded-full transition-all cursor-pointer ${
                Math.abs(zoomLevel - preset) < 0.05
                  ? 'bg-rose-600 text-white font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={preset === 0.1 ? '0.1x Wide Angle (फुल बॉडी)' : `${preset}x Zoom`}
            >
              {preset === 0.1 ? '0.1x' : `${preset}x`}
            </button>
          ))}
        </div>

        {/* Interactive Floating Zoom Slider Popover (0.1 to 4.0 in 0.1 increments) */}
        {showZoomSlider && (
          <div className="w-48 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2.5 shadow-2xl flex flex-col gap-2 mt-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>{language === 'hi' ? 'कस्टम ज़ूम:' : 'Custom Zoom:'}</span>
              <span className="font-mono font-bold text-rose-400">{zoomLevel.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="4.0"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>0.1x (Wide)</span>
              <span>1.0x</span>
              <span>4.0x</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
