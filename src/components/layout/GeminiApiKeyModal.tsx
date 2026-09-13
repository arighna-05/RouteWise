import React, { useState, useEffect } from 'react';
import { Sparkles, X, Key, Check, ExternalLink } from 'lucide-react';
import { getStoredGeminiApiKey, setStoredGeminiApiKey } from '../../services/geminiService';

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredGeminiApiKey());
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredGeminiApiKey(apiKey);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setApiKey('');
    setStoredGeminiApiKey('');
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1E24]/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-card rounded-3xl w-full max-w-md p-6 border border-[#3B4252] shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2E3440]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg gradient-accent text-[#1A1E24] shadow-glow">
              <Sparkles className="w-4 h-4 text-[#1A1E24]" />
            </div>
            <h3 className="font-bold text-[#ECEFF4] text-base">Gemini AI Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#D8DEE9]/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#D8DEE9]/70 leading-relaxed">
          The app includes built-in knowledge for global destinations and works out of the box.
          You can optionally provide your own Google Gemini API key for live real-time model queries.
        </p>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#D8DEE9] font-bold mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#88C0D0]" />
              <span>Google Gemini API Key</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] font-mono focus:ring-2 focus:ring-[#88C0D0]"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[#88C0D0] hover:underline inline-flex items-center gap-1"
            >
              <span>Get a free key from Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-[#BF616A] hover:underline"
              >
                Clear Key
              </button>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#242933] text-[#D8DEE9] hover:bg-[#2E3440] hover:text-white"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl gradient-accent text-[#1A1E24] font-bold shadow-glow flex items-center gap-1.5"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Key</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
