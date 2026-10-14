'use client';
/** The files already uploaded for one document: open, delete, and replace the ones IFFI asked to change. */
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CircleCheck, Clock, ExternalLink, FileText, Film, ImageIcon, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { deleteDocument } from '@/lib/portal/apply-actions';
import { fmtBytes, type DocKind, type UploadedDoc } from '@/lib/portal/documents';
import { DocumentUploader } from './DocumentUploader';

const STATE = {
  pending: { label: 'Waiting for IFFI to check', icon: Clock, cls: 'bg-paper text-muted ring-line' },
  accepted: { label: 'Accepted', icon: CircleCheck, cls: 'bg-good/10 text-good ring-good/30' },
  rejected: { label: 'Needs a new file', icon: RotateCcw, cls: 'bg-danger/10 text-danger ring-danger/25' },
} as const;

export function FileIcon({ mime, className }: { mime: string; className?: string }) {
  const Icon = mime.startsWith('image/') ? ImageIcon : mime.startsWith('video/') ? Film : FileText;
  return <Icon size={18} aria-hidden="true" className={className} />;
}

export function DocFiles({ appId, kind, files, canDelete, canReplace }: { appId: string; kind: DocKind; files: UploadedDoc[]; canDelete: boolean; canReplace: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const remove = (f: UploadedDoc) => {
    if (!window.confirm(`Delete "${f.file_name}"?`)) return;
    setBusy(f.id);
    setError(null);
    startTransition(async () => {
      const res = await deleteDocument(f.id);
      setBusy(null);
      if (!res.ok) setError(res.message ?? 'The file could not be deleted.');
      router.refresh();
    });
  };

  if (!files.length) return null;
  return (
    <ul className="space-y-2">
      {files.map((f) => {
        const s = STATE[f.status];
        const deletable = (canDelete && f.status !== 'accepted') || (canReplace && f.status === 'rejected');
        return (
          <li key={f.id} className={cn('rounded-2xl border px-3.5 py-3', f.status === 'rejected' ? 'border-danger/30 bg-danger/[0.03]' : 'border-line bg-white')}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <FileIcon mime={f.mime_type} className="shrink-0 text-navy" />
              <a href={`/portal/files/${f.id}`} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-[14px] font-medium text-navy underline decoration-line underline-offset-4 hover:decoration-gold">
                {f.file_name}
                <ExternalLink size={12} aria-hidden="true" className="ml-1 inline align-baseline" />
              </a>
              <span className="tabular text-[12.5px] text-muted">{fmtBytes(f.size_bytes)}</span>
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1', s.cls)}>
                <s.icon size={12} aria-hidden="true" /> {s.label}
              </span>
              {deletable && (
                <button
                  type="button"
                  onClick={() => remove(f)}
                  disabled={busy === f.id}
                  aria-label={`Delete ${f.file_name}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              )}
            </div>
            {f.status === 'rejected' && (
              <div className="mt-2.5 space-y-2.5">
                {f.review_note && (
                  <p className="rounded-xl bg-white px-3 py-2 text-[13.5px] text-ink ring-1 ring-danger/20">
                    <span className="font-medium text-danger">IFFI: </span>
                    {f.review_note}
                  </p>
                )}
                {canReplace && <DocumentUploader appId={appId} kind={kind} slots={1} replaces={f.id} label="Upload the corrected file" />}
              </div>
            )}
          </li>
        );
      })}
      {error && (
        <li role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </li>
      )}
    </ul>
  );
}
