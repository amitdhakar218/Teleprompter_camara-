import React, { useState } from 'react';
import { ScriptItem } from '../types';
import { X, Plus, Trash2, Check, BookOpen, Clock, FileText, ArrowRight } from 'lucide-react';

interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScript: string;
  onSelectScriptText: (text: string) => void;
  savedScripts: ScriptItem[];
  onSaveNewScript: (item: Omit<ScriptItem, 'id' | 'updatedAt'>) => void;
  onDeleteScript: (id: string) => void;
  language: 'hi' | 'en';
}

export const ScriptModal: React.FC<ScriptModalProps> = ({
  isOpen,
  onClose,
  currentScript,
  onSelectScriptText,
  savedScripts,
  onSaveNewScript,
  onDeleteScript,
  language,
}) => {
  const [editText, setEditText] = useState(currentScript);
  const [scriptTitle, setScriptTitle] = useState('');
  const [showSaveAsNew, setShowSaveAsNew] = useState(false);

  if (!isOpen) return null;

  // Word count and reading time calculation
  const words = editText.trim() ? editText.trim().split(/\s+/).length : 0;
  const chars = editText.length;
  // Average speaking pace ~ 130 words per minute
  const estimatedSeconds = Math.ceil((words / 130) * 60);
  const estMins = Math.floor(estimatedSeconds / 60);
  const estSecs = estimatedSeconds % 60;
  const estTimeFormatted = `${estMins}m ${estSecs}s`;

  const handleApply = () => {
    onSelectScriptText(editText);
    onClose();
  };

  const handleSaveAsNew = () => {
    if (!editText.trim()) return;
    const title = scriptTitle.trim() || (language === 'hi' ? 'कस्टम स्क्रिप्ट' : 'Custom Script');
    onSaveNewScript({
      title,
      content: editText,
      category: 'custom',
      language: language,
    });
    setShowSaveAsNew(false);
    setScriptTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {language === 'hi' ? 'स्क्रिप्ट और प्रॉम्प्ट मैनेजर' : 'Script & Teleprompter Text'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'hi'
                  ? 'असीमित लंबा टेक्स्ट इनपुट करें या रेडीमेड स्क्रिप्ट चुनें'
                  : 'Enter unlimited long scripts or choose from presets'}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {/* Main Text Editor Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300">
                {language === 'hi' ? 'टेक्स्ट / भाषण स्क्रिप्ट (अनलिमिटेड)' : 'Your Speech Script (Unlimited)'}
              </label>

              {/* Stats: Word Count & Estimated Speaking Duration */}
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{words} {language === 'hi' ? 'शब्द' : 'words'}</span>
                <span>·</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  ~{estTimeFormatted}
                </span>
              </div>
            </div>

            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'यहाँ अपनी पूरी स्क्रिप्ट टाइप करें या कॉपी-पेस्ट करें... यह टेक्स्ट कैमरे के ऊपर ऑटो-स्क्रॉल होगा।'
                  : 'Type or paste your script here... this text will scroll automatically over your camera.'
              }
              className="w-full flex-1 min-h-[260px] p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 font-sans text-sm leading-relaxed resize-none"
            />

            {/* Save as New Script Sub-drawer */}
            {showSaveAsNew ? (
              <div className="mt-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2">
                <input
                  type="text"
                  value={scriptTitle}
                  onChange={(e) => setScriptTitle(e.target.value)}
                  placeholder={language === 'hi' ? 'स्क्रिप्ट का शीर्षक दें...' : 'Script title...'}
                  className="flex-1 bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={handleSaveAsNew}
                  className="px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-500 cursor-pointer"
                >
                  {language === 'hi' ? 'सुरक्षित करें' : 'Save'}
                </button>
                <button
                  onClick={() => setShowSaveAsNew(false)}
                  className="px-2 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => setShowSaveAsNew(true)}
                  className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {language === 'hi' ? 'इस स्क्रिप्ट को सेव करें (Save as Template)' : 'Save script as preset'}
                </button>
              </div>
            )}
          </div>

          {/* Saved / Preset Scripts Sidebar */}
          <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 flex flex-col">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-rose-400" />
              {language === 'hi' ? 'तैयार टेम्पलेट्स' : 'Ready Scripts'}
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px]">
              {savedScripts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setEditText(item.content)}
                  className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-rose-500/40 cursor-pointer transition-all group flex flex-col gap-1 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-rose-300 line-clamp-1">
                      {item.title}
                    </span>
                    {item.category === 'custom' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteScript(item.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {language === 'hi' ? 'स्क्रिप्ट लाइव कैमरे पर तुरंत लागू हो जाएगी' : 'Changes take effect immediately'}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {language === 'hi' ? 'बंद करें' : 'Cancel'}
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {language === 'hi' ? 'स्क्रिप्ट लागू करें (Apply Script)' : 'Apply to Teleprompter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
