import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // If already running as an installed PWA
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        title="Install NW Service Center App on this device"
        className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-semibold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        }`}
      >
        <Download className="w-4 h-4 text-slate-950" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 font-semibold text-amber-400 hover:bg-amber-500/20 transition-all ${
            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                  Install NW App on iPhone/iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-slate-950">
                    1
                  </span>
                  <p>
                    Tap the <strong>Share</strong> icon (box with upward arrow) at the bottom of Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-slate-950">
                    2
                  </span>
                  <p>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-slate-950">
                    3
                  </span>
                  <p>
                    Tap <strong>Add</strong> in the top-right corner. The NW Service Center app is now installed!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback info button for other browsers / desktop guidance
  return (
    <>
      <button
        onClick={() => setShowInfoModal(true)}
        className={`flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 font-medium text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
        }`}
        title="App Installation Instructions"
      >
        <Download className="w-4 h-4 text-amber-400" />
        <span>Install App</span>
      </button>

      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Download className="w-5 h-5 text-amber-400" />
                How to Install NW Service Center
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <div>
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  On Android Mobile (Chrome):
                </h4>
                <p className="mt-1 text-slate-300 text-xs leading-relaxed">
                  1. Tap the three dots (⋮) in the top-right corner of Chrome.<br />
                  2. Select <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.<br />
                  3. Tap <strong>Install</strong>. NW Service Center will launch like a native application with full offline caching.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  On Laptop / Desktop (Chrome / Edge):
                </h4>
                <p className="mt-1 text-slate-300 text-xs leading-relaxed">
                  1. Look for the <strong>Install NW Service Center</strong> icon on the right side of the browser URL address bar.<br />
                  2. Click <strong>Install</strong>.<br />
                  3. Or open Chrome menu (⋮) → <strong>Cast, save, and share</strong> → <strong>Install NW Service Center</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-6 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
