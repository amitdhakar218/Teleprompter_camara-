import React, { useState } from 'react';
import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES } from '../data/androidProjectFiles';
import { AndroidFile } from '../types';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  FolderArchive, 
  Terminal, 
  Smartphone, 
  ExternalLink,
  BookOpen,
  Sparkles,
  GitBranch
} from 'lucide-react';

interface AndroidProjectViewerProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'hi' | 'en';
}

export const AndroidProjectViewer: React.FC<AndroidProjectViewerProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_PROJECT_FILES[2]); // Default to MainActivity.kt
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'code' | 'guide'>('code');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Add each project file into its correct relative path
      ANDROID_PROJECT_FILES.forEach((f) => {
        zip.file(f.path, f.content);
      });

      // Add gradlew stub and gradle wrapper properties for convenient build
      zip.file('gradle/wrapper/gradle-wrapper.properties', `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`);

      zip.file('gradlew', `#!/bin/sh
exec gradle "$@"
`);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'TeleprompterCamera-Android-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate project zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {language === 'hi' ? 'Android Studio प्रोजेक्ट व GitHub Actions' : 'Android Studio Code & GitHub Actions'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Kotlin + CameraX
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'hi'
                  ? 'मॉड्युलर कोड जिसे सीधे Android Studio या GitHub Actions से APK में बदला जा सकता है'
                  : 'Ready-to-compile codebase for Android Studio or instant GitHub Actions APK build'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Tab Selector */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'code' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'hi' ? 'कोड फाइलें (Code)' : 'Code Files'}
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'guide' ? 'bg-slate-900 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'hi' ? 'APK कैसे बनाएँ (Guide)' : 'Build APK Guide'}
              </button>
            </div>

            {/* Download Complete ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {isZipping
                  ? (language === 'hi' ? 'ज़िप बन रहा है...' : 'Generating ZIP...')
                  : (language === 'hi' ? 'पूरा प्रोजेक्ट ZIP डाउनलोड करें' : 'Download Project ZIP')}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Container */}
        {activeTab === 'code' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar: Android File Tree */}
            <div className="w-64 md:w-80 border-r border-slate-800 bg-slate-950/60 flex flex-col shrink-0">
              <div className="p-3 border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>{language === 'hi' ? 'प्रोजेक्ट संरचना (File Tree)' : 'Project Structure'}</span>
                <span className="text-slate-600">{ANDROID_PROJECT_FILES.length} files</span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {ANDROID_PROJECT_FILES.map((file) => {
                  const isSelected = selectedFile.path === file.path;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-white'
                          : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                      }`}
                    >
                      <FileCode
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isSelected ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      />
                      <div className="overflow-hidden">
                        <div className="font-mono font-medium truncate text-[12px]">{file.name}</div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {language === 'hi' ? file.descriptionHi : file.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Pane: Code Viewer */}
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
              {/* File Title Bar */}
              <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-white">
                    {selectedFile.path}
                  </span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-400">
                    {language === 'hi' ? selectedFile.descriptionHi : selectedFile.description}
                  </span>
                </div>

                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">
                        {language === 'hi' ? 'कॉपी हो गया!' : 'Copied!'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'कोड कॉपी करें' : 'Copy File'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Pre Area */}
              <div className="flex-1 overflow-auto p-6 font-mono text-xs text-slate-200 leading-relaxed selection:bg-emerald-500/30">
                <pre>
                  <code>{selectedFile.content}</code>
                </pre>
              </div>
            </div>
          </div>
        ) : (
          /* Guide Tab: Step by Step GitHub Actions & Android Studio */
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-950">
            {/* Quick Hero Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {language === 'hi'
                      ? 'बिना कंप्यूटर में Android Studio इनस्टॉल किए APK बनाएँ'
                      : 'Build APK without installing Android Studio on your PC'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {language === 'hi'
                    ? 'GitHub Actions द्वारा केवल 3 मिनट में APK बिल्ड करने का तरीका'
                    : 'Compile your APK in 3 minutes using free GitHub Actions'}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {language === 'hi'
                    ? 'इस प्रोजेक्ट में .github/workflows/android-build.yml पहले से कॉन्फिगर किया हुआ है। जैसे ही आप इसे GitHub में पुश करेंगे, GitHub का क्लाउड सर्वर अपने आप APK बिल्ड कर देगा।'
                    : 'The project includes a ready-to-run GitHub Actions workflow. When pushed to GitHub, it automatically compiles the APK on an Ubuntu runner.'}
                </p>
              </div>

              <button
                onClick={handleDownloadZip}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 shrink-0 cursor-pointer"
              >
                <FolderArchive className="w-4 h-4" />
                {language === 'hi' ? 'प्रोजेक्ट ZIP डाउनलोड करें' : 'Download Complete ZIP'}
              </button>
            </div>

            {/* 4 Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="text-sm font-semibold text-white">
                  {language === 'hi' ? '1. GitHub पर नया रिपॉजिटरी बनाएँ' : '1. Create GitHub Repository'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'hi'
                    ? 'github.com पर लॉगिन करें और "New Repository" बनाएँ (जैसे teleprompter-camera)।'
                    : 'Log into github.com and create a new repository (e.g., teleprompter-camera).'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h4 className="text-sm font-semibold text-white">
                  {language === 'hi' ? '2. प्रोजेक्ट फाइलों को पुश (Push) करें' : '2. Push Project Files'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'hi'
                    ? 'ऊपर डाउनलोड की गई ZIP को अनज़िप करें और सभी फाइलों को गिटहब रिपॉजिटरी में कमिट व पुश करें।'
                    : 'Unzip the downloaded project and commit & push all files to your GitHub repository main branch.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <h4 className="text-sm font-semibold text-white">
                  {language === 'hi' ? '3. Actions टैब में बिल्ड देखें' : '3. Monitor Actions Build'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'hi'
                    ? 'GitHub रिपॉजिटरी के ऊपर Actions टैब पर जाएँ। "Build Android Teleprompter APK" वर्कफ़्लो चालू दिखेगा।'
                    : 'Go to your repository Actions tab. You will see "Build Android Teleprompter APK" executing.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                  4
                </div>
                <h4 className="text-sm font-semibold text-white">
                  {language === 'hi' ? '4. APK डाउनलोड कर फोन में डालें' : '4. Download APK to Phone'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'hi'
                    ? 'बिल्ड पूरा होते ही Artifacts में "Teleprompter-Camera-Debug-APK" लिंक दिखेगा। क्लिक करके डाउनलोड करें और सीधे अपने फोन में इनस्टॉल करें!'
                    : 'Once complete, open the workflow run, scroll to Artifacts and click "Teleprompter-Camera-Debug-APK" to install directly on your Android phone!'}
                </p>
              </div>
            </div>

            {/* Android Studio Local Option */}
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {language === 'hi' ? 'विकल्प 2: यदि आप Android Studio का उपयोग कर रहे हैं' : 'Alternative: Opening in Android Studio locally'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {language === 'hi'
                  ? 'ZIP फाइल को अनपैक करें, Android Studio में File > Open चुनें और फोल्डर सेलेक्ट करें। Gradle Sync अपने आप CameraX 1.4 व Material3 लाइब्रेरी डाउनलोड कर लेगा। इसके बाद Run बटन दबाते ही ऐप फोन या एमुलेटर पर खुल जाएगी।'
                  : 'Unpack the ZIP file, open Android Studio, click File > Open and select the folder. Gradle Sync will configure CameraX and dependencies. Click Run to test on your phone or emulator.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
