'use client';

import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MapPin, Send, Thermometer, Truck } from 'lucide-react';
import { Suspense, useState } from 'react';
import { apiRequest } from '@/lib/api';

function CheckInKurirContent() {
  const searchParams = useSearchParams();
  const resi = searchParams.get('resi') ?? 'ELC-20260528-0092';
  const initialBatchId = searchParams.get('batch') ?? 'BATCH-B092';
  const [condition, setCondition] = useState('Aman');
  const [receiptNumber, setReceiptNumber] = useState(resi);
  const [batchId, setBatchId] = useState(initialBatchId);
  const [coordinates, setCoordinates] = useState('-6.9175, 107.6191');
  const [status, setStatus] = useState('Dalam perjalanan');
  const [notes, setNotes] = useState('Muatan stabil, segel kontainer utuh, suhu masih dalam rentang aman.');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    const [latitude, longitude] = coordinates.split(',').map((value) => Number(value.trim()));

    try {
      await apiRequest('/api/tracking/checkins', {
        method: 'POST',
        body: JSON.stringify({
          receiptNumber,
          batchId,
          status,
          latitude,
          longitude,
          cargoCondition: condition,
          containerTemperatureC: 18.5,
          notes,
        }),
      });
      setMessage('Check-in berhasil dikirim ke backend.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal mengirim check-in.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-600/10 p-3 text-purple-400">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Check-in Paket</h1>
            <p className="mt-1 text-sm text-slate-400">
              Update posisi, suhu kontainer, dan kondisi fisik muatan.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400">Nomor Resi</span>
              <input value={receiptNumber} onChange={(event) => setReceiptNumber(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-purple-500" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400">ID Batch</span>
              <input value={batchId} onChange={(event) => setBatchId(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-purple-500" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400">Koordinat</span>
              <input value={coordinates} onChange={(event) => setCoordinates(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-purple-500" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400">Status Perjalanan</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-purple-500">
                <option>Dalam perjalanan</option>
                <option>Tiba di hub</option>
                <option>Diserahkan ke penerima</option>
                <option>Tertunda</option>
              </select>
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-slate-400">Kondisi Muatan</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {['Aman', 'Perlu Inspeksi', 'Rusak'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCondition(item)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                    condition === item
                      ? 'border-purple-500/40 bg-purple-600/10 text-purple-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-400">Catatan Kurir</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-28 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-purple-500" />
          </label>

          <button className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-purple-500">
            <Send className="h-4 w-4" />
            Kirim Check-in
          </button>
          {message && <p className="text-sm font-semibold text-purple-300">{message}</p>}
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-300">
              <Thermometer className="h-4 w-4 text-orange-400" />
              Sensor Kontainer
            </h2>
            <p className="mt-4 font-mono text-3xl font-black text-orange-400">18.5 C</p>
            <p className="mt-1 text-xs text-emerald-400">Rentang aman untuk bibit aktif</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-300">
              <MapPin className="h-4 w-4 text-rose-400" />
              Lokasi Berikutnya
            </h2>
            <p className="mt-3 text-sm text-slate-400">Hub distribusi Bandung Timur</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Siap dikunci ke TraceChain
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function CheckInKurirPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-400">Memuat form check-in...</div>}>
      <CheckInKurirContent />
    </Suspense>
  );
}
