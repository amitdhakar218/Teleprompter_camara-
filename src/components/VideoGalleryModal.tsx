import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Download, 
  Play, 
  Share2, 
  Clock, 
  HardDrive, 
  Film,
  FolderOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  StoredVideoItem, 
  getAllStoredVideos, 
  deleteVideoFromGallery 
} from '../utils/videoGalleryStorage';

interface VideoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'hi' | 'en';
}

export const VideoGalleryModal: React.FC<VideoGalleryModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [videos, setVideos] = useState<StoredVideoItem[]>([]);
  const [activeVideo, setActiveVideo] = useState<{ id: string; url: string; timestamp: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadVideos();
    } else {
      if (activeVideo) {
        URL.revokeObjectURL(activeVideo.url);
        setActiveVideo(null);
      }
    }
  }, [isOpen]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const list = await getAllStoredVideos();
      setVideos(list);
    } catch (e) {
      console.error('Failed to load stored videos', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (video: StoredVideoItem) => {
    if (activeVideo) {
      URL.revokeObjectURL(activeVideo.url);
    }
    const url = URL.createObjectURL(video.blob);
    setActiveVideo({ id: video.id, url, timestamp: video.timestamp });
  };

  const handleSaveToDevice = async (video: StoredVideoItem) => {
    const ext = video.blob.type.includes('mp4') ? 'mp4' : 'webm';
    const filename = `Teleprompter_${video.timestamp}.${ext}`;

    // 1. Try Web Share API (File sharing works natively in Android Chrome & WebView)
    if (navigator.canShare) {
      try {
        const file = new File([video.blob], filename, { type: video.blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Teleprompter Video',
            text: 'Save video to Gallery or Files',
          });
          setSaveSuccessMsg(language === 'hi' ? 'वीडियो शेयर / सेव हो गई!' : 'Video shared/saved!');
          setTimeout(() => setSaveSuccessMsg(''), 3000);
          return;
        }
      } catch (e) {
        console.warn('Share API cancelled or unsupported, fallback to download anchor', e);
      }
    }

    // 2. Fallback to direct anchor download
    const url = URL.createObjectURL(video.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);

    setSaveSuccessMsg(
      language === 'hi' 
        ? 'वीडियो आपके मोबाइल के Download फ़ोल्डर में सेव हो गई!' 
        : 'Video saved to your mobile Downloads folder!'
    );
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  const handleDelete = async (id: string) => {
    if (activeVideo?.id === id) {
      URL.revokeObjectURL(activeVideo.url);
      setActiveVideo(null);
    }
    await deleteVideoFromGallery(id);
    await loadVideos();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                {language === 'hi' ? 'रिकॉर्डेड वीडियो लाइब्रेरी (Gallery)' : 'Recorded Videos Gallery'}
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                  {videos.length} {language === 'hi' ? 'वीडियो' : 'videos'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'hi'
                  ? 'आपकी सभी रिकॉर्डिंग ऐप के सुरक्षित स्टोरेज में सेव रहती हैं'
                  : 'All recordings stay safely saved inside your app storage'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast if triggered */}
        {saveSuccessMsg && (
          <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Video Player section (if one is playing) */}
        {activeVideo && (
          <div className="p-4 bg-black border-b border-slate-800 flex flex-col items-center">
            <div className="w-full max-w-lg aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
              <video
                src={activeVideo.url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            <div className="w-full max-w-lg mt-2 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-slate-300">{activeVideo.timestamp}</span>
              <button
                onClick={() => {
                  URL.revokeObjectURL(activeVideo.url);
                  setActiveVideo(null);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                {language === 'hi' ? 'प्लेयर बंद करें' : 'Close player'}
              </button>
            </div>
          </div>
        )}

        {/* Video List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {language === 'hi' ? 'लाइब्रेरी लोड हो रही है...' : 'Loading video gallery...'}
            </div>
          ) : videos.length === 0 ? (
            <div className="py-14 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mb-3">
                <Film className="w-7 h-7" />
              </div>
              <p className="text-sm font-medium text-slate-300">
                {language === 'hi' ? 'अभी तक कोई वीडियो रिकॉर्ड नहीं की गई' : 'No recorded videos yet'}
              </p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {language === 'hi'
                  ? 'कैमरा स्क्रीन पर लाल रिकॉर्ड बटन दबाकर रिकॉर्डिंग शुरू करें, वह यहाँ अपने आप सेव हो जाएगी।'
                  : 'Press the red record button on camera to create recordings; they will appear here.'}
              </p>
            </div>
          ) : (
            videos.map((vid) => {
              const mins = Math.floor(vid.durationSeconds / 60);
              const secs = vid.durationSeconds % 60;
              const durationFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
              const sizeMB = (vid.fileSizeBytes / (1024 * 1024)).toFixed(2);
              const isPlayingThis = activeVideo?.id === vid.id;

              return (
                <div
                  key={vid.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPlayingThis
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePlay(vid)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 cursor-pointer ${
                        isPlayingThis
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
                      }`}
                      title={language === 'hi' ? 'प्ले करें' : 'Play video'}
                    >
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </button>

                    <div>
                      <div className="text-xs font-semibold text-slate-200 font-mono">
                        Teleprompter_{vid.timestamp}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {durationFormatted}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-slate-500" />
                          {sizeMB} MB
                        </span>
                        <span className="text-emerald-400 font-medium">
                          {language === 'hi' ? 'सुरक्षित सेव्ड' : 'Saved'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleSaveToDevice(vid)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={language === 'hi' ? 'मोबाइल गैलरी / डाउनलोड में सेव करें' : 'Save to phone gallery / downloads'}
                    >
                      <Download className="w-3.5 h-3.5 text-rose-400" />
                      <span>{language === 'hi' ? 'फोन में सेव करें' : 'Save to Phone'}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(vid.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                      title={language === 'hi' ? 'डिलीट करें' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            {language === 'hi'
              ? '💡 टिप: "फोन में सेव करें" दबाते ही वीडियो सीधे गैलरी/डाउनलोड फ़ोल्डर में चली जाती है।'
              : '💡 Tip: Tapping "Save to Phone" sends the video directly to your phone downloads/gallery.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
          >
            {language === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
