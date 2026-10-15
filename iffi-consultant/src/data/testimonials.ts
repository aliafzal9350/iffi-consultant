/**
 * Student testimonials: phone videos and admission documents shared with IFFI.
 *
 * Videos: public/videos/testimonials/<id>.mp4 (full clip with sound), <id>-loop.mp4 (a few silent seconds that play
 * on the card) and <id>.webp (poster). Documents: public/images/testimonials/*.webp, with passport numbers, home
 * addresses and the scannable verification QR codes blurred. Never publish the source PDFs.
 */
import type { StaticImageData } from 'next/image';
import jw202Sadat from '../../public/images/testimonials/jw202-sadat-sayed-hamid.webp';
import jw202Baig from '../../public/images/testimonials/jw202-baig-saad-ali.webp';
import jw202Rehan from '../../public/images/testimonials/jw202-rehan.webp';
import jw202Saleem from '../../public/images/testimonials/jw202-saleem-muhammad-abu-zar.webp';
import noticeAmanzai from '../../public/images/testimonials/admission-notice-amanzai-ahmad-faisal.webp';

export interface VideoStory {
  id: string;
  /** length of the full clip in seconds */
  seconds: number;
  /** 'story': the student talks about their experience; 'shoutout': a few seconds and a thumbs up */
  kind: 'story' | 'shoutout';
  /** the student's name, once they have agreed to be named; the card falls back to a neutral label */
  name: string | null;
  /** one line from the video for the card; null until someone has transcribed it */
  quote: string | null;
}

export const VIDEO_STORIES: VideoStory[] = [
  { id: 'story-1', seconds: 46, kind: 'story', name: null, quote: null },
  { id: 'story-2', seconds: 51, kind: 'story', name: null, quote: null },
  { id: 'story-3', seconds: 5, kind: 'shoutout', name: null, quote: null },
  { id: 'story-4', seconds: 5, kind: 'shoutout', name: null, quote: null },
];

export const videoSrc = (id: string) => `/videos/testimonials/${id}.mp4`;
export const videoLoopSrc = (id: string) => `/videos/testimonials/${id}-loop.mp4`;
export const videoPoster = (id: string) => `/videos/testimonials/${id}.webp`;

export function storyLabel(s: VideoStory, index: number): string {
  if (s.name) return s.name;
  return s.kind === 'story' ? `Student story ${String(index + 1).padStart(2, '0')}` : 'A quick hello';
}

export function fmtDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export interface AdmissionDoc {
  id: string;
  kind: 'jw202' | 'notice';
  image: StaticImageData;
  /** given names first, as the student would write them */
  name: string;
  /** from the nationality field; null where the document does not say */
  country: string | null;
  programme: string;
  level: string;
  period: string;
}

/** Facts copied from the documents themselves (university names stay off the site, see the data rules). */
export const ADMISSION_DOCS: AdmissionDoc[] = [
  { id: 'sadat', kind: 'jw202', image: jw202Sadat, name: 'Sayed Hamid Sadat', country: 'Afghanistan', programme: 'International Business', level: '3-year diploma', period: 'Sep 2026 – Jul 2029' },
  { id: 'baig', kind: 'jw202', image: jw202Baig, name: 'Saad Ali Baig', country: 'Pakistan', programme: 'International Business', level: '3-year diploma', period: 'Sep 2026 – Jul 2029' },
  { id: 'rehan', kind: 'jw202', image: jw202Rehan, name: 'Rehan', country: 'Pakistan', programme: 'International Business', level: '3-year diploma', period: 'Sep 2026 – Jul 2029' },
  { id: 'saleem', kind: 'jw202', image: jw202Saleem, name: 'Muhammad Abu Zar Saleem', country: 'Pakistan', programme: 'International Business', level: '3-year diploma', period: 'Sep 2026 – Jul 2029' },
  { id: 'amanzai', kind: 'notice', image: noticeAmanzai, name: 'Ahmad Faisal Amanzai', country: null, programme: 'Chinese Language + Vocational Skills', level: '1-year programme', period: 'Autumn 2026' },
];

export const DOC_KIND_LABEL: Record<AdmissionDoc['kind'], string> = {
  jw202: 'JW202 visa form',
  notice: 'Admission notice',
};
