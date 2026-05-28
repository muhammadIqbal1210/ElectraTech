'use client';

import { useState } from 'react';
import { Bot, Send, Sparkles, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

export default function AiAgentPenakarPage() {
  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      text: 'Halo Penakar! Saya ElectraAgent Core. Saya memantau data sirkuit SmartLink IoT dan log TraceChain Ledger Anda secara real-time. Ada yang bisa saya bantu hari ini?',
      time: '08:30',
    },
    {
      sender: 'agent',
      text: 'PEMBERITAHUAN OTOMATIS:\nBerdasarkan data sensor 5 menit terakhir, Kelembapan Tanah berada pada angka 78% (Optimal). Pompa air irigasi disarankan tetap non-aktif untuk mencegah pembusukan akar pada BATCH-B092.',
      time: '08:31',
    },
  ]);
  const [input, setInput] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input, time: '08:32' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: 'Saya menerima instruksi Anda. Sedang menganalisis log rantai pasok dan telemetri perangkat keras penakar... [Simulasi Respons AI Berhasil]',
          time: '08:32',
        },
      ]);
    }, 1000);
  };

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl lg:col-span-2">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-600/10 p-2 text-purple-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-200">ElectraAgent Penakar</h2>
              <p className="flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Online - Terintegrasi IoT & Ledger Hulu
              </p>
            </div>
          </div>
          <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 font-mono text-[10px] text-slate-400">
            Akses: Penakar
          </span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-950/20 p-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-2xl border p-4 text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'rounded-tr-none border-purple-500/20 bg-purple-600 text-white'
                    : 'rounded-tl-none border-slate-800 bg-slate-900 text-slate-300'
                }`}
              >
                {msg.text}
              </div>
              <span className="mt-1 px-1 font-mono text-[10px] text-slate-600">{msg.time}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-800 bg-slate-950/40 p-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan status batch, deteksi anomali, atau instruksi aktuator..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition-all placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
          />
          <button
            type="submit"
            className="flex shrink-0 items-center justify-center rounded-xl bg-purple-600 p-3 font-bold text-white shadow-lg shadow-purple-600/10 transition-all hover:bg-purple-500"
            aria-label="Kirim pesan"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Deteksi Anomali Berjalan
          </h3>
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/10 bg-emerald-950/20 p-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Sirkuit IoT Aman</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Tidak ditemukan lonjakan suhu ekstrem atau kegagalan perangkat keras SmartLink.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Saran Pertanyaan AI
          </h3>
          <p className="text-xs text-slate-500">Klik salah satu saran di bawah ini untuk berinteraksi cepat dengan AI:</p>

          <div className="mt-2 space-y-2">
            {[
              'Apakah ada anomali suhu pada sirkuit IoT hari ini?',
              'Berikan rekomendasi perawatan untuk Cabai Rawit di BATCH-B092.',
              'Kapan pompa irigasi perlu dinyalakan lagi?',
            ].map((question) => (
              <button
                key={question}
                onClick={() => setInput(question)}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3 text-left text-xs text-slate-300 transition-colors hover:bg-slate-800"
              >
                <HelpCircle className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
