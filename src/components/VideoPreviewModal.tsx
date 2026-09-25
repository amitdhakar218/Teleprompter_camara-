import React from 'react';
import { RecordedVideo } from '../types';
import { X, Download, RotateCcw, CheckCircle2, ShieldCheck, Film } from 'lucide-react';

interface VideoPreviewModalProps {
  video: RecordedVideo | null;
  isOpen: boolean;
  onClose: () => void;
  onRetake: () => void;
  language: 'hi' | 'en';
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  video,
  isOpen,
  onClose,
  onRetake,
  language,
}) => {
  if (!isOpen || !video) return null;

  const fileSizeMB = (video.fileSizeBytes / (1024 * 1024)).toFixed(2);
  const minutes = Math.floor(video.durationSeconds / 60);
  const seconds = video.durationSeconds % 60;
  const durationText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = video.url;
    a.download = `Teleprompter_Record_${video.timestamp}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {language === 'hi' ? 'रिकॉर्डेड वीडियो तैयार है' : 'Video Recording Ready'}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {language === 'hi'
                    ? '100% ओरिजिनल क्वालिटी · ज़ीरो वॉटरमार्क · कोई टेक्स्ट ओवरले नहीं'
                    : '100% Original Quality · Zero Watermark · Clean Video'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Display */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-full max-w-lg aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative group">
            <video
              src={video.url}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          </div>

          {/* Video Metadata Badges */}
          <div className="w-full max-w-lg mt-4 flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'hi' ? 'अवधि:' : 'Duration:'} <strong className="text-white font-mono">{durationText}</strong></span>
            </div>
            <div>
              {language === 'hi' ? 'फाइल साइज़:' : 'Size:'} <strong className="text-white font-mono">{fileSizeMB} MB</strong>
            </div>
            <div className="text-emerald-400 font-medium">
              {language === 'hi' ? 'लोकल डाउनलोड हेतु तैयार' : 'Ready to save'}
            </div>
          </div>

          {/* Explanatory callout */}
          <div className="w-full max-w-lg mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            {language === 'hi'
              ? 'जैसा आपने चाहा था: इस वीडियो में टेलीप्रॉम्प्टर का टेक्स्ट शामिल नहीं है। यह सिर्फ आपकी ओरिजिनल हाई-डेफिनिशन कैमरा रिकॉर्डिंग है।'
              : 'As requested: this recorded video does not contain the teleprompter text overlay. It captures only your pure high-definition camera stream.'}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onRetake}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {language === 'hi' ? 'दोबारा रिकॉर्ड करें (Retake)' : 'Retake Video'}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {language === 'hi' ? 'गैलरी / डिवाइस में सेव करें (Download)' : 'Save to Gallery / Device'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
