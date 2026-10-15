'use client';

import { useId, useRef, useState } from 'react';
import { AlertCircle, Check, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/cn';
import { confirmEnglishLetterUpload, removeEnglishLetter, requestEnglishLetterUpload } from '@/lib/portal/actions';
import { fmtBytes, MB, type EnglishLetterMeta } from '@/lib/portal/documents';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const EXT_TYPE: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const typeOf = (f: File) => f.type || EXT_TYPE[f.name.split('.').pop()?.toLowerCase() ?? ''] || '';

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
    ctx.fillStyle = '#ffffff';
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
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('The upload failed. Please try again.')));
    xhr.onerror = () => reject(new Error('The upload stopped. Check your connection and try again.'));
    xhr.send(file);
  });
}

interface Props {
  value?: EnglishLetterMeta | null;
  onChange: (letter: EnglishLetterMeta | null) => void;
  className?: string;
}

export function EnglishLetterUploader({ value, onChange, className }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(original: File) {
    setError(null);
    const file = await shrinkImage(original);
    const mime = typeOf(file);

    if (!ACCEPTED_TYPES.includes(mime)) {
      setError('Please upload a PDF, JPG, or PNG document.');
      return;
    }

    if (file.size > 10 * MB) {
      setError(`File is too large (${fmtBytes(file.size)}). Maximum limit is 10 MB.`);
      return;
    }

    setUploading(true);
    setProgress(0.05);

    try {
      const ticket = await requestEnglishLetterUpload({ name: file.name, type: mime, size: file.size });
      if (!ticket.ok || !ticket.url || !ticket.path) {
        throw new Error(ticket.message || 'Could not prepare upload. Please try again.');
      }

      await put(ticket.url, file, mime, (p) => setProgress(Math.max(0.08, p)));
      setProgress(1);

      const confirmed = await confirmEnglishLetterUpload(ticket.path, file.name);
      if (!confirmed.ok || !confirmed.letter) {
        throw new Error(confirmed.message || 'File verification failed. Please try again.');
      }

      onChange(confirmed.letter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    setRemoving(true);
    setError(null);
    try {
      await removeEnglishLetter();
      onChange(null);
    } catch {
      setError('Could not remove file. Please try again.');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className={cn('mt-4 space-y-3', className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {value ? (
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/40 p-4 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-navy">{value.file_name}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                    <Check className="h-3 w-3" /> Uploaded
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {fmtBytes(value.size_bytes)} &bull; Ready for your applications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading || removing}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-paper focus:outline-none focus:ring-2 focus:ring-navy/20 disabled:opacity-50"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => void handleRemove()}
                disabled={uploading || removing}
                aria-label="Remove letter"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
              >
                {removing ? <Loader2 className="h-4 w-4 animate-spin text-muted" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            'group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all',
            over ? 'border-navy bg-navy/[0.03]' : 'border-line bg-paper/60 hover:border-navy/40 hover:bg-white',
            uploading && 'cursor-default pointer-events-none opacity-80'
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center py-2">
              <Loader2 className="h-8 w-8 animate-spin text-navy" />
              <p className="mt-3 text-sm font-medium text-navy">Uploading letter...</p>
              <div className="mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full bg-navy transition-all duration-200"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 group-hover:scale-105 transition-transform text-navy">
                <Upload className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-navy">
                Upload English proficiency letter
              </p>
              <p className="mt-1 text-xs text-muted max-w-sm">
                Upload a certificate or letter from your school, college, or university confirming you were taught in English. PDF, JPG, or PNG up to 10 MB.
              </p>
              <span className="mt-3 inline-block rounded-xl bg-white px-3.5 py-1.5 text-xs font-medium text-navy shadow-xs border border-line">
                Choose file
              </span>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-2 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
