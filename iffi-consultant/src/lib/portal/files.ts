/**
 * Where uploads live: one private bucket, one folder per student and application. The server picks every path
 * (the browser never chooses where a file goes), and files are opened only through /portal/files/[id].
 */
import 'server-only';
import { randomUUID } from 'node:crypto';

export const BUCKET = 'application-files';

const EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

/** students/<user>/<application>/<kind>/<random>.<ext> */
export function uploadPath(userId: string, applicationId: string, kind: string, mime: string): string {
  return `students/${userId}/${applicationId}/${kind}/${randomUUID()}.${EXT[mime] ?? 'bin'}`;
}

export const isUploadPathFor = (path: string, userId: string, applicationId: string, kind: string) =>
  path.startsWith(`students/${userId}/${applicationId}/${kind}/`) && !path.includes('..') && /^[\w\-/.]+$/.test(path);

/** settings/payment-qr/<random>.<ext> */
export const settingsPath = (name: string, mime: string) => `settings/${name}/${randomUUID()}.${EXT[mime] ?? 'bin'}`;

/** A file name that is safe to show and to offer as a download name. */
export function cleanFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (cleaned || 'document').slice(0, 120);
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
