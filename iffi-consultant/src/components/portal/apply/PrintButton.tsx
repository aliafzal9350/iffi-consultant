'use client';
import { Printer } from 'lucide-react';
import { buttonClass } from '@/components/ui/buttonStyles';

export function PrintButton({ label = 'Print or save as PDF' }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass('gold', 'md')}>
      <Printer size={17} aria-hidden="true" /> {label}
    </button>
  );
}
