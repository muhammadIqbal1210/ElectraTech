'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  Send,
  Sparkles,
  X,
  MessageSquare,
  ChevronDown,
  Loader2,
  ShieldCheck,
  Cpu,
  HelpCircle,
  Minimize2,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { API_URL } from '@/lib/api';

type ChatMessage = {
  sender: 'user' | 'agent';
  text: string;
  time: string;
};

const SUGGESTED_QUESTIONS = [
  'Apa saja layanan utama di Electra Tech?',
  'Bagaimana cara kerja SmartLink IoT?',
  'Bagaimana TraceChain Blockchain melindungi keaslian benih?',
  'Bagaimana cara verifikasi QR Code produk?',
];

export default function PublicAiAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setIsMinimized(false);
      setHasUnread(false);
    };

    window.addEventListener('open-electra-chat', handleOpenChat);
    return () => window.removeEventListener('open-electra-chat', handleOpenChat);
  }, []);

  // Pesan sambutan awal
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          sender: 'agent',
          text: 'Halo! Selamat datang di **Electra Tech**. Saya asisten virtual untuk membantu menjawab pertanyaan seputar layanan kami: **SmartLink IoT**, **TraceChain Blockchain**, dan sistem **Verifikasi QR Code**',
          time: getCurrentTime(),
        },
      ]);
    }
  }, []);

  const handleSend = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: queryText.trim(),
      time: getCurrentTime(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/agent/public-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: queryText.trim(),
          history: nextHistory.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal memproses pesan');
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: data.reply || 'Maaf, tidak ada respon.',
          time: getCurrentTime(),
        },
      ]);

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err) {
      console.error('Error on public chat:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: 'Maaf, terjadi kendala saat menghubungkan ke asisten. Silakan coba beberapa saat lagi.',
          time: getCurrentTime(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        sender: 'agent',
        text: 'Percakapan telah diatur ulang. Silakan ajukan pertanyaan seputar sistem atau modul Electra Tech.',
        time: getCurrentTime(),
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Jendela Chat Popup */}
      {isOpen && (
        <div
          className={`flex flex-col rounded-2xl border border-slate-700/80 bg-[#0B132B] shadow-2xl overflow-hidden transition-all duration-300 mb-4 ${
            isMinimized
              ? 'h-16 w-80'
              : 'h-[540px] max-h-[82vh] w-[92vw] sm:w-[380px]'
          }`}
        >
          {/* Header Chat*/}
          <div className="flex items-center justify-between bg-[#0F275E] px-4 py-3 select-none">
            <div className="flex items-center gap-3">
              {/* Bot Avatar Icon */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A3B8B] text-white ">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white leading-tight">
                  Electra Assistant
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
                title={isMinimized ? 'Perbesar' : 'Perkecil'}
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Body Percakapan (Hanya jika tidak diminimalkan) */}
          {!isMinimized && (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto p-4 bg-[#070D1E] text-xs">

                {/* Render Messages */}
                {messages.map((msg, index) => {
                  const isAgent = msg.sender === 'agent';
                  return (
                    <div
                      key={index}
                      className={`flex gap-2.5 ${
                        isAgent ? 'items-start' : 'justify-end'
                      }`}
                    >
                      {/* Avatar Bot di samping kiri bubble pesan bot */}
                      {isAgent && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#162A5E] text-white mt-1">
                          <Bot className="h-3.5 w-3.5 text-cyan-300" />
                        </div>
                      )}

                      <div className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} max-w-[82%]`}>
                        <div
                          className={`p-3.5 text-xs leading-relaxed shadow-sm ${
                            isAgent
                              ? 'rounded-2xl rounded-tl-sm bg-[#0B132B] text-slate-400 border border-slate-200'
                              : 'rounded-2xl rounded-tr-sm bg-indigo-600 text-white whitespace-pre-line'
                          }`}
                        >
                          {isAgent ? (
                            <div className="prose prose-sm max-w-none text-slate-200 text-xs leading-relaxed [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>li]:mb-1 [&>strong]:text-blue-900 font-normal">
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                          ) : (
                            msg.text
                          )}
                        </div>
                        <span className="mt-1 px-1 font-mono text-[10px] text-slate-400">
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#162A5E] border border-blue-400/30 text-white">
                      <Bot className="h-3.5 w-3.5 text-cyan-300" />
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-[#0B132B] border border-slate-200 p-3 text-xs text-slate-700 shadow-sm">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 shrink-0" />
                      <span>Electra Assistant sedang mengetik...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Rekomendasi Pertanyaan Cepat (Chips) */}
              {messages.length <= 2 && (
                <div className="border-t border-slate-800 bg-[#0B132B] px-3 py-2 overflow-x-auto">
                  <p className="text-[10px] font-semibold text-slate-400 mb-1.5 px-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Topik Pertanyaan:
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => void handleSend(q)}
                        disabled={isLoading}
                        className="rounded-full border border-slate-700 bg-[#070D1E] px-2.5 py-1 text-[10px] font-medium text-slate-300 hover:border-indigo-400 hover:text-white transition text-left disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Bar: Bentuk Pill seperti referensi gambar */}
              <div className="border-t border-slate-800/80 bg-[#0B132B] p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSend(input);
                  }}
                  className="flex items-center rounded-full bg-[#070D1E] border border-slate-700 px-3 py-1.5 focus-within:border-indigo-500 transition-colors"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    placeholder="Ask something..."
                    className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow transition disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Kirim pertanyaan"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* Gelembung Pesan / Bubble Mengambang saat Chat Tertutup */}
      {!isOpen && showGreeting && (
        <div className="relative mb-3 max-w-[280px] sm:max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              setHasUnread(false);
            }}
            className="cursor-pointer rounded-2xl rounded-br-sm border border-cyan-500/30 bg-[#0F275E]/95 backdrop-blur-md p-3.5 shadow-2xl hover:border-cyan-400 transition-all group select-none text-left hover:shadow-cyan-500/10"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Electra AI Assistant
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGreeting(false);
                }}
                className="text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition"
                title="Tutup pesan"
                aria-label="Tutup pesan"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Halo! Butuh info seputar <span className="font-semibold text-cyan-300">SmartLink IoT</span> atau <span className="font-semibold text-cyan-300">TraceChain</span>? Tanya saya di sini!
            </p>
          </div>
        </div>
      )}

      {/* Tombol Bundar Mengambang (Launcher / Close Button) seperti pada referensi */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
          setHasUnread(false);
        }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#0F275E] text-white shadow-2xl transition-all duration-200 hover:bg-slate-700 hover:scale-105 active:scale-95"
        aria-label={isOpen ? 'Tutup Chat' : 'Buka Asisten Chat'}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white stroke-[2.5]" />
        ) : (
          <>
            <Bot className="h-6 w-6 text-white" />
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </>
        )}
      </button>
    </div>
  );
}
