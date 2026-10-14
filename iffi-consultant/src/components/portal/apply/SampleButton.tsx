'use client';
/** "See a sample": opens a side panel. The panel's content is rendered on the server and passed in as children. */
import { useId, useState, type ReactNode } from 'react';
import { Eye } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';

export function SampleButton({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const labelId = useId();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-navy/15 bg-white px-3.5 text-[13.5px] font-medium text-navy transition-colors hover:border-gold hover:bg-gold-soft/50"
      >
        <Eye size={15} aria-hidden="true" /> See a sample
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={`Sample: ${title}`} widthClass="sm:max-w-xl" labelId={labelId}>
        {children}
      </Drawer>
    </>
  );
}
