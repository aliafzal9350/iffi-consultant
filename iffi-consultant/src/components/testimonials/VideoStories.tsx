'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Play, Volume2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Reveal } from '@/components/ui/Reveal';
import { Lightbox, keepFocus } from '@/components/ui/Lightbox';
import { fmtDuration, storyLabel, videoLoopSrc, videoPoster, videoSrc, type VideoStory } from '@/data/testimonials';

/**
 * The card's silent loop starts only once the card is on screen (the file is not even requested before that) and pauses
 * when it leaves. Reduced-motion and Data Saver visitors keep the still poster.
 */
function useLoopWhileVisible() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === 'undefined') return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!v.getAttribute('src')) v.src = v.dataset.src!;
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return ref;
}

function StoryCard({ story, index, onOpen }: { story: VideoStory; index: number; onOpen: () => void }) {
  const loop = useLoopWhileVisible();
  const label = storyLabel(story, index);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`Watch ${label} (${fmtDuration(story.seconds)}, with sound)`}
      className="group relative block aspect-[9/16] w-full overflow-hidden rounded-[24px] bg-navy-2 text-left shadow-[0_18px_50px_rgba(5,12,28,0.35)] ring-1 ring-white/10 transition-[transform,box-shadow] duration-500 ease-[var(--ease-premium)] hover:-translate-y-2 hover:shadow-[0_30px_70px_rgba(5,12,28,0.5)] hover:ring-gold-2/60"
    >
      <Image
        src={videoPoster(story.id)}
        alt=""
        fill
        sizes="(min-width: 1024px) 290px, (min-width: 640px) 42vw, 64vw"
        className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-premium)] group-hover:scale-[1.05]"
      />
      <video
        ref={loop}
        data-src={videoLoopSrc(story.id)}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        onPlaying={(e) => (e.currentTarget.dataset.playing = '')}
        className="absolute inset-0 h-full w-full object-cover opacity-0 transition-[opacity,transform] duration-[1.2s] ease-[var(--ease-premium)] group-hover:scale-[1.05] data-[playing]:opacity-100"
      />
      <span
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,18,40,0.35)_0%,transparent_26%,transparent_52%,rgba(8,18,40,0.94)_100%)]"
        aria-hidden="true"
      />
      <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[12px] font-medium text-white ring-1 ring-white/15 backdrop-blur-md">
        <Volume2 size={13} aria-hidden="true" />
        <span className="tabular">{fmtDuration(story.seconds)}</span>
      </span>
      <span
        className="absolute left-1/2 top-1/2 inline-flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/40 backdrop-blur-md transition-[background-color,color,transform,box-shadow] duration-500 ease-[var(--ease-premium)] group-hover:scale-110 group-hover:bg-gold group-hover:text-navy group-hover:shadow-[0_0_0_10px_rgba(224,189,107,0.18)]"
        aria-hidden="true"
      >
        <Play size={24} fill="currentColor" className="ml-1" />
      </span>
      <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        {story.quote && <span className="font-display-italic mb-2 block text-[1.05rem] leading-snug text-white">“{story.quote}”</span>}
        <span className="block font-display text-[1.15rem] font-semibold leading-tight text-white">{label}</span>
        <span className="mt-1 block text-[13px] text-mist/85">Watch with sound</span>
      </span>
      <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gold-2 transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-x-100" aria-hidden="true" />
    </button>
  );
}

/** A row of vertical phone videos (a swipeable strip on phones); each card opens the full clip, with sound, in a viewer. */
export function VideoStories({ stories, className }: { stories: VideoStory[]; className?: string }) {
  // the index outlives `open` so the caption stays put while the viewer fades out
  const [i, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const current = stories[i];
  const step = (d: number) => setIndex((n) => (n + d + stories.length) % stories.length);

  return (
    <>
      <Reveal
        as="ul"
        stagger
        className={cn(
          'scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0',
          className,
        )}
      >
        {stories.map((s, n) => (
          <li key={s.id} className="w-[64%] shrink-0 snap-center sm:w-[40%] lg:w-auto lg:even:mt-14">
            <StoryCard
              story={s}
              index={n}
              onOpen={() => {
                setIndex(n);
                setOpen(true);
              }}
            />
          </li>
        ))}
      </Reveal>
      <Lightbox
        open={open}
        onClose={() => setOpen(false)}
        label={`${storyLabel(current, i)}, video`}
        onPrev={stories.length > 1 ? () => step(-1) : undefined}
        onNext={stories.length > 1 ? () => step(1) : undefined}
        position={`${i + 1} / ${stories.length}`}
        caption={
          <>
            <p className="font-display text-lg text-white">{storyLabel(current, i)}</p>
            {current.quote && <p className="font-display-italic mt-1 text-mist">“{current.quote}”</p>}
          </>
        }
      >
        {open && (
          <video
            key={current.id}
            ref={keepFocus}
            data-autofocus
            src={videoSrc(current.id)}
            poster={videoPoster(current.id)}
            controls
            autoPlay
            playsInline
            className="aspect-[9/16] h-[min(76svh,calc((100vw-2rem)*16/9))] w-auto max-w-full rounded-2xl bg-black shadow-[0_30px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
          />
        )}
      </Lightbox>
    </>
  );
}
