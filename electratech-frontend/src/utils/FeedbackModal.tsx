'use client';

import { AlertCircle, CheckCircle2, X } from 'lucide-react';

type FeedbackModalType = 'success' | 'error';

type FeedbackModalProps = {
  open: boolean;
  type: FeedbackModalType;
  title: string;
  message: string;
  onClose: () => void;
};

export default function FeedbackModal({ open, type, title, message, onClose }: FeedbackModalProps) {
  if (!open) return null;

  const isSuccess = type === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;
  const accentClasses = isSuccess
    ? {
        icon: 'bg-emerald-500/15 text-emerald-400',
        button: 'bg-emerald-500 hover:bg-emerald-400',
      }
    : {
        icon: 'bg-rose-500/15 text-rose-400',
        button: 'bg-rose-500 hover:bg-rose-400',
      };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0D1123] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentClasses.icon}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 id="feedback-modal-title" className="text-base font-bold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:text-white"
            aria-label="Tutup notifikasi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-950 transition ${accentClasses.button}`}
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}
