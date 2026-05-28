'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Truck, MapPin, Package, ShieldCheck, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export default function DashboardKurir() {
  // Simulasi data manifest pengiriman benih oleh kurir logistik
  const [shipments, setShipments] = useState([
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
  ]);

  // Fungsi simulasi update status kiriman instan di tempat (on-the-spot)
  const handleSelesaiKirim = (id: string) => {
    setShipments((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'SELESAI', estimasi: 'Tiba: Baru Saja' }
          : item
      )
    );
    alert(`Pengiriman ${id} berhasil dikonfirmasi dan terkunci ke TraceChain Ledger!`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* 1. KARTU IDENTITAS & STATS RINGKAS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-600/10 rounded-xl text-purple-400">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold">Konsol Kurir Logistik</h1>
              <p className="text-xs text-slate-400 mt-0.5">ID Driver: #DRV-IKBAL01</p>
            </div>
          </div>
        </div>
        
        {/* Status Koneksi Ledger */}
        <div className="bg-purple-950/30 border border-purple-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">
            Ledger Sync Active
          </span>
        </div>
      </div>

      {/* 2. RINGKASAN DATA PEKERJAAN HARI INI */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Sisa Pengantaran</p>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">
            {shipments.filter(s => s.status === 'DALAM_PERJALANAN').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Sukses Hari Ini</p>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {shipments.filter(s => s.status === 'SELESAI').length}
          </p>
        </div>
      </div>

      {/* 3. MANIFEST DAFTAR TUGAS PENGIRIMAN */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-400" /> Manifest Pengiriman Aktif
        </h2>

        <div className="space-y-3">
          {shipments.map((ship) => (
            <div
              key={ship.id}
              className={`bg-slate-900 border rounded-2xl p-5 transition-all space-y-4 ${
                ship.status === 'DALAM_PERJALANAN'
                  ? 'border-purple-500/20 shadow-md shadow-purple-600/[0.02]'
                  : 'border-slate-800/60 opacity-75'
              }`}
            >
              {/* Baris Atas: ID & Status Badge */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-purple-400">
                    {ship.id}
                  </span>
                  <span className="text-xs text-slate-500 ml-2 font-mono">
                    ({ship.batchId})
                  </span>
                </div>
                
                <span className={`text-[10px] px-2 py-0.5 font-bold rounded-md border ${
                  ship.status === 'DALAM_PERJALANAN'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {ship.status === 'DALAM_PERJALANAN' ? 'Dalam Rute' : 'Telah Tiba'}
                </span>
              </div>

              {/* Baris Tengah: Info Varietas & Alamat Tujuan */}
              <div className="space-y-2">
                <p className="text-base font-bold text-slate-200">{ship.varietas}</p>
                
                <div className="flex items-start gap-1.5 text-xs text-slate-400 leading-relaxed">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{ship.tujuan}</span>
                </div>
              </div>

              {/* Baris Bawah: Waktu Estimasi & Tombol Aksi */}
              <div className="pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{ship.estimasi}</span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Link
                    href={`/kurir/checkin?resi=${ship.id}`}
                    className="flex-1 sm:flex-none text-center bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    Detail Manifest <ArrowRight className="w-3 h-3" />
                  </Link>

                  {ship.status === 'DALAM_PERJALANAN' && (
                    <button
                      onClick={() => handleSelesaiKirim(ship.id)}
                      className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md shadow-purple-600/10"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Konfirmasi Tiba
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
