"use client";

import type { Trade, Account, Screenshot } from "@/lib/db/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useEffect, useState } from "react";

interface Props {
  trade:    Trade;
  accounts: Account[];
  onEdit:   () => void;
  onDelete: () => void;
  onClose:  () => void;
}

export function TradeDrawer({ trade, accounts, onEdit, onDelete, onClose }: Props) {
  const account = accounts.find((a) => a.id === trade.accountId);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [expandedShot, setExpandedShot] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/screenshots?tradeId=${trade.id}`)
      .then((r) => r.json())
      .then((rows) => setScreenshots(
        rows.map((r: Record<string, unknown>) => ({
          id: r.id, tradeId: r.trade_id, filename: r.filename,
          label: r.label, filepath: r.filepath, url: r.url, uploadDate: new Date(r.upload_date as string),
        }))
      ));
  }, [trade.id]);

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const resultVariant = trade.result === "Win" ? "win" : trade.result === "Loss" ? "loss" : "be";

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{title}</h3>
        {children}
      </div>
    );
  }

  function Field({ label, value, mono = false }: { label: string; value: string | number | undefined | null; mono?: boolean }) {
    if (!value && value !== 0) return null;
    return (
      <div>
        <span className="text-xs text-[var(--text-subtle)]">{label}</span>
        <p className={`text-sm text-[var(--text)] ${mono ? "font-mono" : ""}`}>{String(value)}</p>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-[var(--bg-surface)] border-l border-[var(--border)] shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-[var(--text-muted)]">{trade.tradeNumber}</span>
            <Badge variant={resultVariant}>{trade.result}</Badge>
            {trade.isDraft && <Badge variant="neutral">Draft</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface2)] cursor-pointer transition-colors">
              Edit
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface2)] cursor-pointer transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-5">
          {/* PnL hero */}
          <div className="flex items-center gap-4 p-4 bg-[var(--bg-surface2)] rounded-xl border border-[var(--border)]">
            <div>
              <p className="text-xs text-[var(--text-muted)]">P&amp;L</p>
              <p className={`text-2xl font-mono font-bold ${trade.pnl >= 0 ? "text-win" : "text-loss"}`}>
                {trade.pnl >= 0 ? "+" : ""}{formatCurrency(trade.pnl)}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-[var(--text-muted)]">R:R</p>
              <p className="font-mono text-[var(--text)]">{trade.actualRR || "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-muted)]">Score</p>
              <div className="flex gap-0.5 justify-end mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < trade.disciplineScore ? "bg-gold" : "bg-[var(--border)]"}`} />
                ))}
              </div>
            </div>
          </div>

          <Section title="Trade Details">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date"       value={formatDate(trade.date)} />
              <Field label="Day"        value={trade.day} />
              <Field label="Account"    value={account?.name} />
              <Field label="Instrument" value={trade.instrument} mono />
              <Field label="Direction"  value={trade.direction} />
              <Field label="Session"    value={trade.session} />
            </div>
          </Section>

          <Section title="Execution">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Entry"       value={trade.entryPrice}  mono />
              <Field label="Stop Loss"   value={trade.stopLoss}    mono />
              <Field label="Take Profit" value={trade.takeProfit}  mono />
              <Field label="Lot Size"    value={trade.lotSize}     mono />
              <Field label="Planned R:R" value={trade.plannedRR}   mono />
              <Field label="Actual R:R"  value={trade.actualRR}    mono />
              <Field label="Duration"    value={trade.duration} />
            </div>
          </Section>

          {trade.marketCondition && (
            <Section title="Market Condition">
              <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{trade.marketCondition}</p>
            </Section>
          )}

          {trade.setupStrategy && (
            <Section title="Setup / Strategy">
              <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{trade.setupStrategy}</p>
            </Section>
          )}

          {trade.executionQuality && (
            <Section title="Execution Quality">
              <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{trade.executionQuality}</p>
            </Section>
          )}

          {trade.emotions && (
            <Section title="Emotions">
              <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{trade.emotions}</p>
            </Section>
          )}

          {trade.ruleViolation && (
            <Section title="Rule Violation">
              <p className="text-sm text-red-500 whitespace-pre-wrap">{trade.ruleViolation}</p>
            </Section>
          )}

          {trade.improvement && (
            <Section title="Improvement">
              <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{trade.improvement}</p>
            </Section>
          )}

          {trade.notesReflection && (
            <Section title="Notes / Reflection">
              <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{trade.notesReflection}</p>
            </Section>
          )}

          {trade.commissionCost != null && (
            <Section title="Commission Cost">
              <p className="text-sm font-mono text-amber-400">${Number(trade.commissionCost).toFixed(2)}</p>
            </Section>
          )}

          {/* TradingView embed */}
          {trade.tradingviewLink && (
            <Section title="TradingView Chart">
              <div className="relative w-full rounded-lg overflow-hidden border border-[var(--border)]" style={{ paddingBottom: "56.25%", height: 0 }}>
                <iframe
                  src={trade.tradingviewLink}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  title="TradingView chart"
                />
              </div>
            </Section>
          )}

          {/* Screenshots */}
          {screenshots.length > 0 && (
            <Section title="Screenshots">
              <div className="space-y-2">
                {screenshots.map((s) => (
                  <div key={s.id} className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg-surface2)]">
                    <button
                      type="button"
                      onClick={() => setExpandedShot(expandedShot === s.id ? null : s.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer hover:bg-[var(--bg-surface)] transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-[var(--text)] flex-1 truncate">{s.label || s.filename}</span>
                      <span className="text-xs text-[var(--text-subtle)]">{expandedShot === s.id ? "▲" : "▼"}</span>
                    </button>
                    {expandedShot === s.id && (
                      <div className="border-t border-[var(--border)] p-2 bg-[var(--bg)]">
                        <img
                          src={s.url ?? `/api/screenshots/${s.id}`}
                          alt={s.label || s.filename}
                          className="max-h-72 mx-auto object-contain rounded"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-5 py-3 flex items-center justify-between">
          <button
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-400 cursor-pointer transition-colors"
          >
            Delete trade
          </button>
          <p className="text-xs text-[var(--text-subtle)]">{trade.day} · {trade.session}</p>
        </div>
      </div>
    </>
  );
}
