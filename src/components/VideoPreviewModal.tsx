import React from 'react';
import { RecordedVideo } from '../types';
import { X, Download, RotateCcw, CheckCircle2, ShieldCheck, Film, Share2 } from 'lucide-react';

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

  const [savedSuccess, setSavedSuccess] = React.useState<boolean>(false);
  const [successText, setSuccessText] = React.useState<string>('');

  // 1. Direct Download to Mobile Phone Storage (Downloads / Gallery)
  const handleDirectDownload = () => {
    const ext = video.blob.type.includes('mp4') ? 'mp4' : 'webm';
    const filename = `Camera_Video_${video.timestamp}.${ext}`;

    const a = document.createElement('a');
    a.href = video.url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 1500);

    setSuccessText(
      language === 'hi'
        ? 'वीडियो आपके मोबाइल स्टोरेज (Downloads फ़ोल्डर) में सेव हो रही है!'
        : 'Video is downloading directly into your phone storage (Downloads)!'
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 5000);
  };

  // 2. Share via Android Share Sheet to Photos / WhatsApp / Google Drive
  const handleShare = async () => {
    const ext = video.blob.type.includes('mp4') ? 'mp4' : 'webm';
    const filename = `Camera_Video_${video.timestamp}.${ext}`;

    if (navigator.canShare) {
      try {
        const file = new File([video.blob], filename, { type: video.blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Camera Recording',
            text: 'Save video or send to apps',
          });
          setSuccessText(
            language === 'hi'
              ? 'वीडियो सफलतापूर्वक शेयर / सेव हो गई!'
              : 'Video successfully shared / saved!'
          );
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 4000);
          return;
        }
      } catch (e) {
        console.warn('Share API fallback', e);
      }
    }

    // Fallback if sharing is cancelled or not supported
    handleDirectDownload();
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
              {language === 'hi' ? 'सेव करने के लिए तैयार' : 'Ready to save'}
            </div>
          </div>

          {/* Explanatory callout & Success Banner */}
          {savedSuccess && (
            <div className="w-full max-w-lg mt-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successText}</span>
            </div>
          )}

          <div className="w-full max-w-lg mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            {language === 'hi'
              ? 'यह वीडियो सीधे आपके मोबाइल फ़ोन के "Downloads / Files" फ़ोल्डर में सेव होती है। इसमें टेलीप्रॉम्प्टर का टेक्स्ट नहीं आया है, सिर्फ कैमरा रिकॉर्डिंग है।'
              : 'This video saves directly into your phone Downloads/Files folder. Clean camera stream with no teleprompter overlay.'}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={onRetake}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {language === 'hi' ? 'दोबारा रिकॉर्ड करें (Retake)' : 'Retake Video'}
          </button>

          <div className="flex items-center gap-2">
            {/* Share to Apps button */}
            <button
              onClick={handleShare}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              title={language === 'hi' ? 'WhatsApp, Photos या Drive में भेजें' : 'Share to apps'}
            >
              <Share2 className="w-4 h-4 text-sky-400" />
              <span>{language === 'hi' ? 'शेयर करें' : 'Share'}</span>
            </button>

            {/* Direct Save to Mobile Storage Button */}
            <button
              onClick={handleDirectDownload}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{language === 'hi' ? 'फ़ोन स्टोरेज में सेव करें (Download)' : 'Save to Mobile Storage'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
