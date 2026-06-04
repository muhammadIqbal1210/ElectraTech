'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Download, PackageCheck, QrCode, Route, Search } from 'lucide-react';
import { apiRequest } from '@/lib/api';

type BatchRow = {
  id: string;
  variety: string;
  generation: string;
  quantity: number;
  phase: string;
  health_status: string;
  producer_name: string;
  seeded_at: string;
  created_at: string;
};

type BatchLog = {
  id: number;
  batch_id: string;
  from_phase: string | null;
  to_phase: string;
  notes: string | null;
  created_at: string;
  created_by?: string;
};

type ShipmentRow = {
  receiptNumber: string;
  batchId: string;
  variety: string;
  generation: string;
  courierName: string | null;
  destination: string;
  packageQuantity: number;
  status: string;
  notes: string | null;
  createdAt: string;
  acceptedAt: string | null;
  deliveredAt: string | null;
};

const qrImageBaseUrl = 'https://api.qrserver.com/v1/create-qr-code/';

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPhase(phase: string) {
  return phase.replaceAll('_', ' ');
}

function buildQrPayload(batch: BatchRow, logs: BatchLog[], shipments: ShipmentRow[]) {
  const phaseHistory = logs.length > 0
    ? logs
        .slice()
        .reverse()
        .map((log, index) => `${index + 1}. ${formatPhase(log.from_phase || 'REGISTRASI')} -> ${formatPhase(log.to_phase)} (${formatDate(log.created_at)})`)
        .join('; ')
    : 'Belum ada mutasi fase.';

  const shipmentHistory = shipments.length > 0
    ? shipments
        .map((shipment, index) => `${index + 1}. ${shipment.receiptNumber} | ${shipment.packageQuantity} bibit | ${shipment.destination} | ${shipment.status} | kurir: ${shipment.courierName || 'belum diterima'} | dibuat: ${formatDate(shipment.createdAt)}`)
        .join('; ')
    : 'Belum ada paket pengiriman.';

  return [
    'ELECTRA TECH TRACEABILITY',
    `Batch: ${batch.id}`,
    `Varietas: ${batch.variety}`,
    `Generasi: ${batch.generation}`,
    `Produsen: ${batch.producer_name}`,
    `Jumlah awal: ${batch.quantity} bibit`,
    `Tanggal daftar: ${formatDate(batch.created_at || batch.seeded_at)}`,
    `Status kesehatan: ${batch.health_status}`,
    `Fase saat QR dibuat: ${formatPhase(batch.phase)}`,
    `Riwayat fase: ${phaseHistory}`,
    `Distribusi: ${shipmentHistory}`,
  ].join('\n');
}

export default function QrDistribusiProdusenPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [logs, setLogs] = useState<BatchLog[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    void Promise.resolve()
      .then(async () => {
        const [batchResponse, shipmentResponse] = await Promise.all([
          apiRequest<BatchRow[]>('/api/batches'),
          apiRequest<ShipmentRow[]>('/api/tracking/shipments'),
        ]);
        const batchData = batchResponse.data || [];
        setBatches(batchData);
        setShipments(shipmentResponse.data || []);
        setSelectedBatchId((current) => current || batchData.find((batch) => batch.phase === 'SIAP_DISTRIBUSI')?.id || batchData[0]?.id || '');
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Gagal memuat data QR.'));
  }, []);

  useEffect(() => {
    if (!selectedBatchId) return;

    void Promise.resolve()
      .then(() => apiRequest<BatchLog[]>(`/api/batches/${selectedBatchId}/logs`))
      .then((response) => setLogs(response.data || []))
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Gagal memuat riwayat fase.'));
  }, [selectedBatchId]);

  const filteredBatches = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return batches;

    return batches.filter((batch) => (
      batch.id.toLowerCase().includes(keyword)
      || batch.variety.toLowerCase().includes(keyword)
      || batch.generation.toLowerCase().includes(keyword)
      || batch.phase.toLowerCase().includes(keyword)
    ));
  }, [batches, query]);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) || null,
    [batches, selectedBatchId],
  );

  const selectedShipments = useMemo(
    () => shipments.filter((shipment) => shipment.batchId === selectedBatchId),
    [selectedBatchId, shipments],
  );

  const isReadyForQr = selectedBatch?.phase === 'SIAP_DISTRIBUSI';
  const qrPayload = selectedBatch ? buildQrPayload(selectedBatch, logs, selectedShipments) : '';
  const qrImageUrl = `${qrImageBaseUrl}?size=280x280&margin=12&data=${encodeURIComponent(qrPayload)}`;

  const handleDownload = async () => {
    if (!selectedBatch) return;

    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-${selectedBatch.id}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage('Gagal mengunduh QR. Coba klik kanan pada gambar QR untuk menyimpan.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">QR Distribusi Benih</h1>
            <p className="mt-1 text-sm text-slate-400">
              Generate QR setelah batch masuk fase siap kemas dan distribusi.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300">
          SIAP_DISTRIBUSI required
        </div>
      </div>

      {message && <p className="text-sm font-semibold text-amber-300">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari batch, varietas, generasi"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div className="max-h-[580px] space-y-3 overflow-y-auto pr-1">
            {filteredBatches.map((batch) => {
              const ready = batch.phase === 'SIAP_DISTRIBUSI';
              const selected = batch.id === selectedBatchId;

              return (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => setSelectedBatchId(batch.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    selected
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-emerald-300">{batch.id}</p>
                      <p className="mt-1 text-sm font-bold text-slate-200">{batch.variety}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{batch.generation} - {batch.quantity.toLocaleString('id-ID')} bibit</p>
                    </div>
                    <span className={`rounded-md border px-2 py-1 text-[10px] font-bold ${
                      ready
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                    }`}>
                      {ready ? 'Siap QR' : formatPhase(batch.phase)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-5">
          {selectedBatch ? (
            <>
              <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <div className="mx-auto flex h-[280px] w-[280px] items-center justify-center rounded-xl border border-slate-800 bg-white p-3">
                    {isReadyForQr ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrImageUrl} alt={`QR traceability ${selectedBatch.id}`} className="h-full w-full" />
                    ) : (
                      <div className="px-5 text-center text-sm font-semibold text-slate-500">
                        QR aktif setelah fase SIAP_DISTRIBUSI.
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!isReadyForQr}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                  >
                    <Download className="h-4 w-4" />
                    Unduh QR
                  </button>

                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    QR memuat trace dari pendaftaran sampai distribusi.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="rounded bg-slate-950 px-2 py-1 font-mono text-xs font-bold text-emerald-300 ring-1 ring-slate-800">
                        {selectedBatch.id}
                      </span>
                      <h2 className="mt-4 text-xl font-bold text-slate-100">
                        {selectedBatch.variety} ({selectedBatch.generation})
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {selectedBatch.producer_name} - {selectedBatch.quantity.toLocaleString('id-ID')} bibit
                      </p>
                    </div>
                    <span className={`w-fit rounded-md border px-2 py-1 text-[10px] font-bold ${
                      isReadyForQr
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                    }`}>
                      {formatPhase(selectedBatch.phase)}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[
                      ['Tanggal Daftar', formatDate(selectedBatch.created_at || selectedBatch.seeded_at)],
                      ['Mutasi Fase', logs.length],
                      ['Paket Dibuat', selectedShipments.length],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                        <p className="mt-1 text-sm font-bold text-slate-200">{value}</p>
                      </div>
                    ))}
                  </div>

                  <label className="mt-5 block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Isi QR</span>
                    <textarea
                      readOnly
                      value={isReadyForQr ? qrPayload : 'Batch belum masuk fase SIAP_DISTRIBUSI.'}
                      className="min-h-48 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 font-mono text-xs leading-relaxed text-slate-300 outline-none"
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    <Route className="h-4 w-4 text-emerald-300" />
                    Riwayat Fase
                  </h2>
                  <div className="mt-4 space-y-3">
                    {logs.map((log) => (
                      <div key={log.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-sm font-bold text-slate-200">
                          {formatPhase(log.from_phase || 'REGISTRASI')} &rarr; {formatPhase(log.to_phase)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(log.created_at)}</p>
                        {log.notes && <p className="mt-2 text-sm text-slate-400">{log.notes}</p>}
                      </div>
                    ))}
                    {logs.length === 0 && <p className="text-sm text-slate-400">Belum ada riwayat mutasi fase.</p>}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    <PackageCheck className="h-4 w-4 text-purple-300" />
                    Riwayat Pengiriman
                  </h2>
                  <div className="mt-4 space-y-3">
                    {selectedShipments.map((shipment) => (
                      <div key={shipment.receiptNumber} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-xs font-bold text-purple-300">{shipment.receiptNumber}</p>
                            <p className="mt-1 text-sm text-slate-300">{shipment.destination}</p>
                          </div>
                          <span className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-1 text-[10px] font-bold text-purple-300">
                            {shipment.status.replaceAll('_', ' ')}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {shipment.packageQuantity.toLocaleString('id-ID')} bibit - Kurir: {shipment.courierName || 'belum diterima'}
                        </p>
                      </div>
                    ))}
                    {selectedShipments.length === 0 && (
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                        Belum ada paket pengiriman untuk batch ini.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-sm text-slate-400">
              Belum ada batch yang bisa diproses.
            </div>
          )}
        </section>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
          <ClipboardList className="h-4 w-4 text-cyan-300" />
          Alur QR
        </h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-400 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">1. Daftarkan batch benih di Pendaftaran Batch.</div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">2. Update fase hidup sampai SIAP_DISTRIBUSI.</div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">3. Buat paket pengiriman dan tempel QR pada kemasan.</div>
        </div>
      </div>
    </div>
  );
}
