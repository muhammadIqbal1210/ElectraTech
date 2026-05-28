import { Link2, ShieldCheck } from 'lucide-react';

const logs = [
  ['09:22:10', 'createBatch', 'BATCH-B101', '0xaa81...90fe'],
  ['09:15:44', 'updateTracking', 'TRK-9901', '0x7f41...19aa'],
  ['08:31:05', 'aiRecommendation', 'BATCH-B092', '0x04bc...11de'],
  ['08:05:18', 'iotLog', 'SmartLink-CT-02', '0x91bc...42ed'],
];

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ShieldCheck className="h-6 w-6 text-cyan-400" />
          Audit TraceChain
        </h1>
        <p className="mt-1 text-sm text-slate-400">Pantau event ledger lintas modul operasional.</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="space-y-3">
          {logs.map(([time, action, target, hash]) => (
            <div key={hash} className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm md:grid-cols-[110px_1fr_1fr_160px] md:items-center">
              <span className="font-mono text-xs text-cyan-300">{time}</span>
              <span className="font-semibold text-slate-300">{action}</span>
              <span className="font-mono text-xs text-slate-500">{target}</span>
              <span className="inline-flex w-fit items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-400">
                <Link2 className="h-3 w-3" />
                {hash}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
