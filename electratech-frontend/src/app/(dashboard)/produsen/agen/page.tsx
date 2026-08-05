'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, Sparkles, AlertTriangle, ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';
import { getToken } from '@/lib/api';

export default function AiAgentPenakarPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // State untuk kontrol loading AI
  const hasFetched = useRef(false);


  // Helper untuk mendapatkan waktu terkini (format HH:mm)
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    setMessages([
      {
        sender: 'agent',
        text: 'Halo Penakar! Saya ElectraAgent Core. Saya memantau data sirkuit SmartLink IoT dan log TraceChain Ledger Anda secara real-time. Ada yang bisa saya bantu hari ini?',
        time: getCurrentTime(),
      }
    ]);

    const fetchSystemStatus = async () => {
      setIsLoading(true);
      try {
        const token = getToken();
        const res = await fetch('http://localhost:4000/api/agent/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: 'Tolong berikan ringkasan singkat status batch terbaru dan data sensor IoT saat ini untuk laporan pembuka.',
            history: [],
          }),
        });

        const data = await res.json();

        if (res.ok && data.reply) {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'agent',
              text: 'PEMBERITAHUAN SISTEM:\n' + data.reply,
              time: getCurrentTime(),
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching initial status', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemStatus();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    const userMessage = { sender: 'user', text: userText, time: getCurrentTime() };

    // 1. Tambahkan pesan pengguna ke UI & reset input
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Tembak endpoint Express.js Backend (electratech-backend)
      const token = getToken();
      const res = await fetch('http://localhost:4000/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userText,
          history: messages, // Mengirim riwayat obrolan untuk context memory
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal tersambung ke server');
      }

      // 3. Tambahkan respons nyata dari ElectraAgent AI ke UI
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: data.reply || 'Maaf, tidak ada respons dari sistem.',
          time: getCurrentTime(),
        },
      ]);
    } catch (err) {
      console.error('Frontend Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: 'Gagal terhubung ke ElectraAgent Core Backend. Pastikan server Express berjalan.',
          time: getCurrentTime(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-6 lg:grid-cols-1">
      <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl lg:col-span-2">
        {/* Header Agent */}
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

        {/* Chat History List */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-950/20 p-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl border p-4 text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                    ? 'rounded-tr-none border-purple-500/20 bg-purple-600 text-white whitespace-pre-line'
                    : 'rounded-tl-none border-slate-800 bg-slate-900 text-slate-300'
                  }`}
              >
                {msg.sender === 'agent' ? (
                  <div className="prose prose-invert max-w-none text-slate-300 text-sm [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h3]:text-base [&>h3]:font-bold [&>h3]:text-purple-400 [&>h3]:mt-3 [&>h3]:mb-1 [&>hr]:border-slate-800 [&>hr]:my-3">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
              <span className="mt-1 px-1 font-mono text-[10px] text-slate-600">{msg.time}</span>
            </div>
          ))}

          {/* Indikator Loading saat Backend / AI sedang bekerja */}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-purple-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>ElectraAgent sedang menganalisis, tunggu respon...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-800 bg-slate-950/40 p-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Tanyakan status batch, deteksi anomali, atau instruksi aktuator..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition-all placeholder:text-slate-600 focus:border-purple-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="flex shrink-0 items-center justify-center rounded-xl bg-purple-600 p-3 font-bold text-white shadow-lg shadow-purple-600/10 transition-all hover:bg-purple-500 disabled:opacity-50"
            aria-label="Kirim pesan"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}