'use client';

import { useState } from 'react';
import {
  QrCode,
  Download,
  ExternalLink,
  X,
  Package,
  CheckCircle2,
  Calendar,
  MapPin,
  Truck,
  Copy,
  Check,
} from 'lucide-react';

export type ShipmentModalData = {
  receiptNumber: string;
  batchId: string;
  variety?: string;
  generation?: string;
  destination: string;
  packageQuantity: number;
  status: string;
  courierName?: string | null;
  createdAt?: string;
  blockchainTxHash?: string | null;
};

type ShipmentQrModalProps = {
  open: boolean;
  shipment: ShipmentModalData | null;
  onClose: () => void;
};

const QR_IMAGE_BASE_URL = 'https://api.qrserver.com/v1/create-qr-code/';

function formatDate(value?: string | null) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export default function ShipmentQrModal({ open, shipment, onClose }: ShipmentQrModalProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!open || !shipment) return null;

  // URL verifikasi publik untuk konsumen/mitra/agen
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const verificationUrl = `${origin}/#verify?id=${encodeURIComponent(shipment.receiptNumber)}`;

  // Isi data QR yang komprehensif (dapat dibaca scanner biasa atau URL verifikasi)
  const qrTextPayload = [
    'ELECTRA TECH - RESI PENGIRIMAN',
    `Nomor Resi: ${shipment.receiptNumber}`,
    `Batch ID: ${shipment.batchId}`,
    shipment.variety ? `Varietas: ${shipment.variety}` : null,
    `Tujuan: ${shipment.destination}`,
    `Jumlah Bibit: ${shipment.packageQuantity} bibit`,
    `Status: ${shipment.status.replaceAll('_', ' ')}`,
    shipment.courierName ? `Kurir: ${shipment.courierName}` : null,
    `Tgl Dibuat: ${formatDate(shipment.createdAt || new Date().toISOString())}`,
    `Verifikasi Publik: ${verificationUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const qrImageUrl = `${QR_IMAGE_BASE_URL}?size=260x260&margin=12&data=${encodeURIComponent(qrTextPayload)}`;

  const handleCopyResi = async () => {
    try {
      await navigator.clipboard.writeText(shipment.receiptNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadQr = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR-RESI-${shipment.receiptNumber}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download QR failed:', err);
      // Fallback open new tab
      window.open(qrImageUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0D1123] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-[#0A0E1C]/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                QR Code Pengiriman Paket
                <span className="inline-flex items-center rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                  {shipment.status.replaceAll('_', ' ')}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tempel QR ini pada fisik kemasan bibit untuk verifikasi logistik & agen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Box Preview QR */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative group rounded-2xl border border-slate-700 bg-white p-3 shadow-lg flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageUrl}
                  alt={`QR Resi ${shipment.receiptNumber}`}
                  className="w-48 h-48 md:w-52 md:h-52 object-contain"
                />
              </div>

              <div className="mt-3 flex w-full gap-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  disabled={isDownloading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-2.5 px-3 text-xs font-semibold text-white transition shadow-lg shadow-purple-600/20 disabled:bg-slate-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isDownloading ? 'Mengunduh...' : 'Unduh QR'}
                </button>
                <a
                  href={qrImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 p-2.5 text-slate-300 transition"
                  title="Buka Gambar Langsung"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Info Resi & Batch */}
            <div className="md:col-span-7 space-y-3.5">
              {/* Box Nomor Resi */}
              <div className="rounded-xl border border-slate-800 bg-[#05070e] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    NOMOR RESI PENGIRIMAN
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyResi}
                    className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Resi</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-1 font-mono text-base font-bold text-purple-300">
                  {shipment.receiptNumber}
                </p>
              </div>

              {/* Grid Atribut */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl border border-slate-800/80 bg-[#0A0E1C] p-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <Package className="w-3 h-3 text-slate-400" /> BATCH ID
                  </span>
                  <p className="mt-1 font-mono font-semibold text-slate-200 truncate">
                    {shipment.batchId}
                  </p>
                  {shipment.variety && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{shipment.variety}</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-[#0A0E1C] p-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <CheckCircle2 className="w-3 h-3 text-purple-400" /> JUMLAH BIBIT
                  </span>
                  <p className="mt-1 font-semibold text-slate-200">
                    {shipment.packageQuantity.toLocaleString('id-ID')} bibit
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Siap didistribusikan</p>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-[#0A0E1C] p-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <MapPin className="w-3 h-3 text-slate-400" /> TUJUAN
                  </span>
                  <p className="mt-1 font-medium text-slate-200 line-clamp-2">
                    {shipment.destination}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-[#0A0E1C] p-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <Truck className="w-3 h-3 text-slate-400" /> KURIR PICKUP
                  </span>
                  <p className="mt-1 font-medium text-slate-200">
                    {shipment.courierName || 'Menunggu Penjemputan'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#05070e] px-3.5 py-2 text-[11px] text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Dibuat: {formatDate(shipment.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Raw Payload Preview Accordion */}
          <div className="rounded-xl border border-slate-800/80 bg-[#05070e] p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Isi Payload Terenkode di QR
            </span>
            <pre className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">
              {qrTextPayload}
            </pre>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="border-t border-slate-800/80 px-6 py-4 bg-[#0A0E1C]/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2 text-xs font-semibold text-slate-200 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
