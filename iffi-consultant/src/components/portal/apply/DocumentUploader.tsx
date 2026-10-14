'use client';
/**
 * Drop or pick files for one document. Each file goes: check here -> shrink big phone photos -> ask the server for a
 * one-time upload link -> PUT straight to storage (with a progress bar) -> the server checks what arrived and records
 * it. Files never pass through the website's own server, so there is no request-size limit to hit.
 */
import { useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleAlert, CircleCheck, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/cn';
import { confirmUpload, requestUpload } from '@/lib/portal/apply-actions';
import { DOCS, FILE_TYPES, MB, fmtBytes, type DocKind } from '@/lib/portal/documents';

type Item = { key: string; name: string; size: number; progress: number; state: 'working' | 'done' | 'error'; message?: string };

const EXT_TYPE: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};
const typeOf = (f: File) => f.type || EXT_TYPE[f.name.split('.').pop()?.toLowerCase() ?? ''] || '';

/** Phone photos are often 4-8 MB. Re-encode big ones at 2400 px, which is still sharp for any document. */
async function shrinkImage(file: File): Promise<File> {
  const type = typeOf(file);
  if (!/^image\/(jpeg|png|webp)$/.test(type) || file.size < 1.5 * MB || typeof createImageBitmap !== 'function') return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#ffffff'; // transparent PNG areas would turn black in a JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

function put(url: string, file: File, type: string, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('content-type', type);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('cache-control', 'max-age=3600');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.status === 413 ? 'This file is too large.' : 'The upload failed. Please try again.')));
    xhr.onerror = () => reject(new Error('The upload stopped. Check your connection and try again.'));
    xhr.send(file);
  });
}

interface Props {
  appId: string;
  kind: DocKind;
  /** how many more files fit (maxFiles minus files already there) */
  slots: number;
  /** replace this rejected file instead of adding */
  replaces?: string;
  label?: string;
  /** called with the new document id (the payment form needs it) */
  onUploaded?: (docId: string, name: string) => void;
  className?: string;
}

export function DocumentUploader({ appId, kind, slots, replaces, label, onUploaded, className }: Props) {
  const router = useRouter();
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [over, setOver] = useState(false);
  const spec = DOCS[kind];
  const types = FILE_TYPES[spec.files];
  const busy = items.some((i) => i.state === 'working');
  const allowed = replaces ? 1 : slots;

  const patch = (key: string, p: Partial<Item>) => setItems((cur) => cur.map((i) => (i.key === key ? { ...i, ...p } : i)));

  async function uploadOne(original: File, key: string) {
    const file = await shrinkImage(original);
    const type = typeOf(file);
    patch(key, { size: file.size });
    if (!(types.mime as readonly string[]).includes(type)) return patch(key, { state: 'error', message: `Upload a ${types.label} file.` });
    if (file.size > types.maxMB * MB) return patch(key, { state: 'error', message: `This file is ${fmtBytes(file.size)}. The limit is ${types.maxMB} MB.` });

    try {
      const ticket = await requestUpload(appId, kind, { name: file.name, type, size: file.size }, replaces ?? null);
      if (!ticket.ok || !ticket.url || !ticket.path) return patch(key, { state: 'error', message: ticket.message ?? 'Upload refused.' });
      await put(ticket.url, file, type, (p) => patch(key, { progress: Math.min(0.98, p) }));
      const done = await confirmUpload(appId, kind, ticket.path, original.name, replaces ?? null);
      if (!done.ok) return patch(key, { state: 'error', message: done.message ?? 'The file could not be saved.' });
      patch(key, { state: 'done', progress: 1 });
      if (done.docId) onUploaded?.(done.docId, original.name);
    } catch (e) {
      patch(key, { state: 'error', message: e instanceof Error ? e.message : 'The upload failed. Please try again.' });
    }
  }

  async function take(list: FileList | null) {
    if (!list?.length || busy) return;
    const files = Array.from(list).slice(0, Math.max(0, allowed));
    const fresh = files.map((f, i) => ({ key: `${Date.now()}-${i}`, name: f.name, size: f.size, progress: 0, state: 'working' as const }));
    setItems(fresh);
    // one at a time: phones on slow connections do better than with parallel uploads
    for (let i = 0; i < files.length; i++) await uploadOne(files[i], fresh[i].key);
    if (input.current) input.current.value = '';
    router.refresh();
  }

  if (allowed <= 0) return null;

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void take(e.dataTransfer.files);
        }}
        className={cn(
          'flex min-h-14 cursor-pointer flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl border-2 border-dashed px-4 py-3 text-center text-[14px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold',
          over ? 'border-gold bg-gold-soft/60' : 'border-navy/20 bg-paper/50 hover:border-navy/40 hover:bg-paper',
          busy && 'pointer-events-none opacity-70'
        )}
      >
        <input
          ref={input}
          id={inputId}
          type="file"
          className="sr-only"
          multiple={allowed > 1}
          accept={[...types.mime, ...Object.entries(EXT_TYPE).filter(([, t]) => (types.mime as readonly string[]).includes(t)).map(([e]) => `.${e}`)].join(',')}
          disabled={busy}
          onChange={(e) => void take(e.target.files)}
        />
        <span className="inline-flex items-center gap-2 font-medium text-navy">
          {busy ? <Loader2 size={17} aria-hidden="true" className="animate-spin" /> : <Upload size={17} aria-hidden="true" />}
          {busy ? 'Uploading…' : (label ?? (replaces ? 'Upload a new file' : 'Choose a file or take a photo'))}
        </span>
        <span className="text-[12.5px] text-muted">
          {types.label}, up to {types.maxMB} MB{allowed > 1 ? ` · up to ${allowed} files` : ''}
        </span>
      </label>

      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5" aria-live="polite">
          {items.map((i) => (
            <li key={i.key} className="rounded-xl bg-paper/70 px-3 py-2 text-[13px]">
              <div className="flex items-center gap-2">
                {i.state === 'working' && <Loader2 size={14} aria-hidden="true" className="shrink-0 animate-spin text-navy" />}
                {i.state === 'done' && <CircleCheck size={14} aria-hidden="true" className="shrink-0 text-good" />}
                {i.state === 'error' && <CircleAlert size={14} aria-hidden="true" className="shrink-0 text-danger" />}
                <span className="min-w-0 flex-1 truncate text-ink">{i.name}</span>
                <span className="tabular shrink-0 text-muted">{fmtBytes(i.size)}</span>
              </div>
              {i.state === 'working' && (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={`Uploading ${i.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(i.progress * 100)}>
                  <div className="h-full rounded-full bg-gold transition-[width] duration-200" style={{ width: `${Math.max(4, i.progress * 100)}%` }} />
                </div>
              )}
              {i.message && <p className="mt-1 text-danger">{i.message}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
