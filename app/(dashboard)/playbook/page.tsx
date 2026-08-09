"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

// Minimal markdown renderer — handles the playbook content format
function renderMarkdown(md: string, checkStates: Record<number, boolean>, onCheck: (i: number) => void): React.ReactNode[] {
  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let checkboxIndex = 0;
  let tableBuffer: string[] = [];
  let i = 0;

  function flushTable() {
    if (!tableBuffer.length) return;
    const rows = tableBuffer.filter((l) => !l.match(/^\|[-| ]+\|$/));
    nodes.push(
      <div key={`table-${nodes.length}`} className="overflow-x-auto my-3">
        <table className="w-full text-sm border-collapse">
          <tbody>
            {rows.map((row, ri) => {
              const cells = row.split("|").filter((_, ci) => ci > 0 && ci < row.split("|").length - 1);
              const isHead = ri === 0;
              return (
                <tr key={ri} className={`border-b border-[var(--border)] ${isHead ? "bg-[var(--bg-surface2)]" : ""}`}>
                  {cells.map((cell, ci) => {
                    const Tag = isHead ? "th" : "td";
                    return <Tag key={ci} className="px-3 py-2 text-left text-[var(--text)] font-mono whitespace-nowrap">{cell.trim()}</Tag>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
    tableBuffer = [];
  }

  while (i < lines.length) {
    const line = lines[i];

    // Tables
    if (line.startsWith("|")) {
      tableBuffer.push(line);
      i++; continue;
    } else {
      flushTable();
    }

    // H1
    if (line.startsWith("# ")) {
      nodes.push(<h1 key={i} className="text-2xl font-bold text-[var(--text)] mt-6 mb-3">{line.slice(2)}</h1>);
    }
    // H2
    else if (line.startsWith("## ")) {
      nodes.push(<h2 key={i} className="text-lg font-semibold text-[var(--text)] mt-5 mb-2 border-b border-[var(--border)] pb-1">{line.slice(3)}</h2>);
    }
    // H3
    else if (line.startsWith("### ")) {
      nodes.push(<h3 key={i} className="text-base font-semibold text-[var(--text)] mt-4 mb-1">{line.slice(4)}</h3>);
    }
    // Blockquote — personal rule gets special treatment
    else if (line.startsWith("> ")) {
      const text = line.slice(2);
      const isRule = text.includes("FOMO") || text.includes("Price will");
      nodes.push(
        <blockquote key={i} className={`my-4 px-5 py-4 rounded-xl border-l-4 ${
          isRule
            ? "border-gold bg-gold/5 text-[var(--text)] font-semibold text-base italic"
            : "border-[var(--border)] bg-[var(--bg-surface2)] text-[var(--text-muted)] italic"
        }`}>{text}</blockquote>
      );
    }
    // Checkbox list item
    else if (line.match(/^- \[ \] /)) {
      const idx = checkboxIndex++;
      const label = line.replace(/^- \[ \] /, "");
      const checked = checkStates[idx] ?? false;
      nodes.push(
        <label key={i} className="flex items-start gap-3 py-1.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onCheck(idx)}
            className="mt-0.5 w-4 h-4 rounded border-[var(--border)] accent-[#F5A623] cursor-pointer"
          />
          <span className={`text-sm ${checked ? "line-through text-[var(--text-subtle)]" : "text-[var(--text)]"} transition-colors`}>{label}</span>
        </label>
      );
    }
    // Regular list item
    else if (line.match(/^- /)) {
      nodes.push(
        <li key={i} className="text-sm text-[var(--text)] ml-4 list-disc py-0.5">
          {inlineMarkdown(line.slice(2))}
        </li>
      );
    }
    // Numbered list
    else if (line.match(/^\d+\. /)) {
      const text = line.replace(/^\d+\. /, "");
      nodes.push(
        <li key={i} className="text-sm text-[var(--text)] ml-4 list-decimal py-0.5">
          {inlineMarkdown(text)}
        </li>
      );
    }
    // Horizontal rule
    else if (line === "---") {
      nodes.push(<hr key={i} className="border-[var(--border)] my-4" />);
    }
    // Empty line
    else if (line.trim() === "") {
      nodes.push(<div key={i} className="h-1" />);
    }
    // Paragraph
    else {
      nodes.push(<p key={i} className="text-sm text-[var(--text)] leading-relaxed">{inlineMarkdown(line)}</p>);
    }
    i++;
  }
  flushTable();
  return nodes;
}

function inlineMarkdown(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-[var(--text)]">{part.slice(2, -2)}</strong>
      : part
  );
}

export default function PlaybookPage() {
  const [content,    setContent]    = useState("");
  const [editMode,   setEditMode]   = useState(false);
  const [draft,      setDraft]      = useState("");
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [updatedAt,  setUpdatedAt]  = useState<string | null>(null);
  const [checks,     setChecks]     = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch("/api/playbook")
      .then((r) => r.json())
      .then((data) => {
        setContent(data?.content ?? "");
        setUpdatedAt(data?.updatedAt ?? null);
        setLoading(false);
      });
  }, []);

  function handleEdit() { setDraft(content); setEditMode(true); }
  function handleCancel() { setEditMode(false); setDraft(""); }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/playbook", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    if (res.ok) {
      const data = await res.json();
      setContent(data.content);
      setUpdatedAt(data.updatedAt);
      setEditMode(false);
      setDraft("");
    }
    setSaving(false);
  }

  function toggleCheck(idx: number) {
    setChecks((c) => ({ ...c, [idx]: !c[idx] }));
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--text-muted)] text-sm">Loading playbook...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">Playbook</h1>
          {updatedAt && (
            <p className="text-xs text-[var(--text-subtle)] mt-0.5">Last updated {formatDate(updatedAt)}</p>
          )}
        </div>
        {!editMode ? (
          <button onClick={handleEdit}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface2)] cursor-pointer transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg text-[var(--text-muted)] cursor-pointer hover:text-[var(--text)]">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-1.5 text-sm bg-gold text-white rounded-lg font-medium cursor-pointer hover:bg-gold-500 disabled:opacity-50 shadow-glow-gold">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
        {editMode ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full min-h-[600px] bg-transparent text-sm text-[var(--text)] font-mono resize-none focus:outline-none leading-relaxed"
            spellCheck={false}
          />
        ) : (
          <div className="prose prose-sm max-w-none">
            {renderMarkdown(content, checks, toggleCheck)}
          </div>
        )}
      </div>

      {/* Session reset note */}
      {!editMode && (
        <p className="text-xs text-center text-[var(--text-subtle)]">
          Checklist resets on page reload — it is a per-session tool, not saved to the database
        </p>
      )}
    </div>
  );
}
