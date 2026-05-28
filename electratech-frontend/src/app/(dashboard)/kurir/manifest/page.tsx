'use client';

import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Package, ShieldCheck } from 'lucide-react';

const shipments = [
  {
    id: 'TRK-9901',
    batchId: 'BATCH-B092',
    varietas: 'Cabai Rawit Merah',
    tujuan: 'Dinas Pertanian Suka Makmur, Blok C',
    status: 'DALAM_PERJALANAN',
    estimasi: '25 Menit',
  },
  {
    id: 'TRK-9875',
    batchId: 'BATCH-B080',
    varietas: 'Tomat Hibrida F1',
    tujuan: 'Koperasi Tani Makmur Sentosa',
    status: 'SELESAI',
    estimasi: 'Tiba: Kemarin, 16:30',
  },
  {
    id: 'TRK-9914',
    batchId: 'BATCH-B101',
    varietas: 'Bawang Merah Lokananta',
    tujuan: 'Balai Penyuluhan Ciwidey',
    status: 'MENUNGGU_PICKUP',
    estimasi: 'Pickup: 13:15',
  },
];

export default function ManifestKurirPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manifest Pengiriman</h1>
          <p className="mt-1 text-sm text-slate-400">
            Daftar paket bibit yang ditugaskan ke kurir hari ini.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-950/30 px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-purple-400" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300">
            Ledger Sync Active
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {shipments.map((ship) => (
          <div
            key={ship.id}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-all hover:border-purple-500/30"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <div>
                  <span className="rounded bg-slate-950 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-400 ring-1 ring-slate-800">
                    {ship.id}
                  </span>
                  <span className="ml-2 font-mono text-xs text-slate-500">({ship.batchId})</span>
                </div>
                <div>
                  <p className="font-bold text-slate-200">{ship.varietas}</p>
                  <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-slate-400">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                    {ship.tujuan}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
                <span className="w-fit rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  {ship.status.replaceAll('_', ' ')}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{ship.estimasi}</span>
                </div>
                <Link
                  href={`/kurir/checkin?resi=${ship.id}`}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-slate-800"
                >
                  Check-in Paket <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
          <Package className="h-4 w-4 text-purple-400" />
          Ringkasan Manifest
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ['Total Paket', '3'],
            ['Dalam Rute', '1'],
            ['Selesai', '1'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-1 font-mono text-2xl font-black text-emerald-400">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
