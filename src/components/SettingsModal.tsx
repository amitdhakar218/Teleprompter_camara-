import React from 'react';
import { PrompterSettings } from '../types';
import { 
  X, 
  Type, 
  Palette, 
  FlipHorizontal, 
  Eye, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Clock, 
  Sliders,
  Gauge,
  Smartphone,
  Video
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrompterSettings;
  onUpdateSettings: (partial: Partial<PrompterSettings>) => void;
  language: 'hi' | 'en';
}

const COLOR_PALETTE = [
  { name: 'White (सफेद)', value: '#FFFFFF' },
  { name: 'Studio Yellow (पीला)', value: '#FACC15' },
  { name: 'Neon Green (हरा)', value: '#4ADE80' },
  { name: 'Cyan Blue (सियान)', value: '#38BDF8' },
  { name: 'Electric Orange (नारंगी)', value: '#FB923C' },
  { name: 'Hot Pink (गुलाबी)', value: '#F472B6' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  language,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {language === 'hi' ? 'टेलीप्रॉम्प्टर व कैमरा सेटिंग्स' : 'Teleprompter & Camera Settings'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'hi'
                  ? 'स्क्रॉल स्पीड, वीडियो साइज (Reels/YouTube), रिज़ॉल्यूशन व टेक्स्ट सेटिंग्स'
                  : 'Scroll speed, aspect ratio (Reels/16:9), resolution & prompter'}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Prompter Scroll Speed (WPM) Slider */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-emerald-400" />
                {language === 'hi' ? 'स्क्रॉलिंग स्पीड (Prompt Speed / WPM)' : 'Scroll Speed (WPM)'}
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {settings.scrollSpeed.toFixed(1)}x ({Math.round(settings.scrollSpeed * 35)} WPM)
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="7.0"
              step="0.2"
              value={settings.scrollSpeed}
              onChange={(e) => onUpdateSettings({ scrollSpeed: parseFloat(e.target.value) })}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.8x (धीमा / आराम से)</span>
              <span>3.5x (सामान्य गति)</span>
              <span>7.0x (तेज़ / Fast)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {language === 'hi'
                ? 'यह स्पीड आपके बोलने की गति के अनुसार हमेशा याद रखी जाती है।'
                : 'This scroll speed stays saved and tailored to your speech cadence.'}
            </p>
          </div>

          {/* 2. Video Format & Aspect Ratio */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              {language === 'hi' ? 'वीडियो साइज व अनुपात (Aspect Ratio)' : 'Video Size & Aspect Ratio'}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { 
                  value: '9:16', 
                  title: '9:16', 
                  descHi: 'Reels, Shorts & Story', 
                  descEn: 'Shorts & Reels (Vertical)' 
                },
                { 
                  value: '16:9', 
                  title: '16:9', 
                  descHi: 'YouTube & TV (Landscape)', 
                  descEn: 'YouTube (Horizontal)' 
                },
                { 
                  value: '1:1', 
                  title: '1:1', 
                  descHi: 'Square (Instagram Post)', 
                  descEn: 'Instagram Post Square' 
                },
              ].map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => onUpdateSettings({ aspectRatio: ratio.value as any })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    settings.aspectRatio === ratio.value
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm font-bold text-white font-mono">{ratio.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                    {language === 'hi' ? ratio.descHi : ratio.descEn}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Video Resolution */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-rose-400" />
              {language === 'hi' ? 'वीडियो रिज़ॉल्यूशन (Video Quality)' : 'Video Resolution'}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { value: '720p', label: '720p HD', subHi: 'कम स्टोरेज (हल्का)', subEn: 'Compact file' },
                { value: '1080p', label: '1080p FHD', subHi: 'सर्वश्रेष्ठ क्वालिटी (अनुशंसित)', subEn: 'Best quality' },
                { value: '4k', label: '4K Ultra', subHi: 'अल्ट्रा HD (यदि सपोर्ट हो)', subEn: 'Ultra HD' },
              ].map((res) => (
                <button
                  key={res.value}
                  onClick={() => onUpdateSettings({ videoResolution: res.value as any })}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    settings.videoResolution === res.value
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-white font-mono">{res.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{language === 'hi' ? res.subHi : res.subEn}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Text Color Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-rose-400" />
              {language === 'hi' ? 'टेक्स्ट का रंग (Text Color)' : 'Text Color'}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {COLOR_PALETTE.map((col) => (
                <button
                  key={col.value}
                  onClick={() => onUpdateSettings({ textColor: col.value })}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                    settings.textColor.toLowerCase() === col.value.toLowerCase()
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full shadow-inner border border-white/20"
                    style={{ backgroundColor: col.value }}
                  />
                  <span className="text-[10px] text-slate-300 line-clamp-1">{col.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Text Size (Font Size) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-rose-400" />
                {language === 'hi' ? 'टेक्स्ट का साइज़ (Font Size)' : 'Font Size'}
              </label>
              <span className="text-xs font-mono font-semibold text-rose-400">
                {settings.fontSize}px
              </span>
            </div>
            <input
              type="range"
              min="18"
              max="54"
              step="2"
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>18px (छोटा)</span>
              <span>32px (मध्यम)</span>
              <span>54px (बड़ा)</span>
            </div>
          </div>

          {/* 6. Text Width / Column Margin */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {language === 'hi' ? 'टेक्स्ट चौड़ाई (Eye Focus Width)' : 'Prompter Column Width'}
              </label>
              <span className="text-xs font-mono font-semibold text-rose-400">
                {settings.textWidth}%
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="100"
              step="5"
              value={settings.textWidth}
              onChange={(e) => onUpdateSettings({ textWidth: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {language === 'hi'
                ? 'चौड़ाई 50-70% रखने से आँखें स्क्रीन पर इधर-उधर कम भटकती हैं और कैमरा लेंस पर फोकस बना रहता है।'
                : 'Narrow width (50-70%) keeps your gaze focused directly into the camera lens.'}
            </p>
          </div>

          {/* 7. Text Alignment */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              {language === 'hi' ? 'टेक्स्ट अलाइनमेंट (Text Alignment)' : 'Text Alignment'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { align: 'left', icon: AlignLeft, label: language === 'hi' ? 'बायाँ (Left)' : 'Left' },
                { align: 'center', icon: AlignCenter, label: language === 'hi' ? 'मध्य (Center)' : 'Center' },
                { align: 'right', icon: AlignRight, label: language === 'hi' ? 'दायाँ (Right)' : 'Right' },
              ].map((item) => {
                const Icon = item.icon;
                const active = settings.textAlign === item.align;
                return (
                  <button
                    key={item.align}
                    onClick={() => onUpdateSettings({ textAlign: item.align as any })}
                    className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all cursor-pointer ${
                      active
                        ? 'border-rose-500 bg-rose-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8. Toggles: Mirror Horizontal & Eye Guide */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            {/* Eye Contact Guide */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="text-xs font-medium text-white">
                    {language === 'hi' ? 'आई-कांटेक्ट गाइड लाइन' : 'Eye Contact Guide Line'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {language === 'hi' ? 'कैमरा लेंस के ठीक नीचे फोकस लाइन दिखाता है' : 'Shows horizontal alignment guide at lens height'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.showEyeGuide}
                onChange={(e) => onUpdateSettings({ showEyeGuide: e.target.checked })}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </div>

            {/* Mirror Front Camera View (Like looking into real mirror) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <FlipHorizontal className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-medium text-white">
                    {language === 'hi' ? 'कैमरा शीशा मोड (Mirror / Normal)' : 'Camera Mirror Mode'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {language === 'hi' 
                      ? 'शीशे की तरह: बायाँ हाथ उठाने पर स्क्रीन पर भी बायाँ दिखे (उल्टा न दिखे)' 
                      : 'Real mirror reflection so movements match natural mirror'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.mirrorVideo}
                onChange={(e) => onUpdateSettings({ mirrorVideo: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Mirror / Flip Horizontal for Teleprompter Glass */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <FlipHorizontal className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-medium text-white">
                    {language === 'hi' ? 'मिरर टेक्स्ट (ग्लास टेलीप्रॉम्प्टर मोड)' : 'Mirror Text (Beam Splitter Glass)'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {language === 'hi' ? 'टेक्स्ट को हॉरिजॉन्टली उल्टा (मिरर) करता है' : 'Horizontally inverts text for teleprompter rigs'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.mirrorHorizontal}
                onChange={(e) => onUpdateSettings({ mirrorHorizontal: e.target.checked })}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </div>

            {/* Countdown before recording */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-medium text-white">
                    {language === 'hi' ? 'रिकॉर्डिंग से पहले काउंटडाउन' : 'Recording Countdown'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {language === 'hi' ? 'बोलना शुरू करने से पहले तैयारी का समय' : 'Prep countdown before scroll'}
                  </div>
                </div>
              </div>
              <select
                value={settings.countdownSeconds}
                onChange={(e) => onUpdateSettings({ countdownSeconds: parseInt(e.target.value) })}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value={3}>3 {language === 'hi' ? 'सेकंड' : 'seconds'}</option>
                <option value={5}>5 {language === 'hi' ? 'सेकंड' : 'seconds'}</option>
                <option value={0}>{language === 'hi' ? 'बंद (No countdown)' : 'Off'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer"
          >
            {language === 'hi' ? 'पूर्ण (Done)' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

