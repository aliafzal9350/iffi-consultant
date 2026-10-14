/**
 * One document on the Documents step: what to upload, a sample of what it should look like, the forms to download
 * (application form, medical form), the files already uploaded, and the uploader.
 */
import { CircleAlert, CircleCheck, Clock, Download, FileDown, Printer, Upload, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DOCS, FILE_TYPES, TEMPLATES, docState, educationWhat, type DocRequirement, type DocState, type UploadedDoc } from '@/lib/portal/documents';
import { DocSample } from './DocSample';
import { DocFiles } from './DocFiles';
import { DocumentUploader } from './DocumentUploader';
import { SampleButton } from './SampleButton';

const NEED = {
  required: { label: 'Required', cls: 'bg-navy text-white' },
  recommended: { label: 'Recommended', cls: 'bg-gold-soft text-gold-deep ring-1 ring-gold/40' },
  optional: { label: 'Optional', cls: 'bg-paper text-muted ring-1 ring-line' },
} as const;

const STATE: Record<DocState, { icon: typeof CircleCheck; cls: string; words: string }> = {
  missing: { icon: Upload, cls: 'bg-paper text-muted ring-1 ring-line', words: 'Not uploaded yet' },
  uploaded: { icon: Clock, cls: 'bg-gold-soft text-gold-deep', words: 'Uploaded, waiting for IFFI to check' },
  accepted: { icon: CircleCheck, cls: 'bg-good/10 text-good', words: 'Accepted by IFFI' },
  rejected: { icon: CircleAlert, cls: 'bg-danger/10 text-danger', words: 'IFFI needs a new file' },
};

/** The links to the forms a student fills in: the filled-in application form, and the blank originals. */
export function TemplateLinks({ template, appId }: { template: keyof typeof TEMPLATES; appId: string }) {
  const t = TEMPLATES[template];
  const linkCls = 'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 py-1 text-[13.5px] font-medium transition-colors';
  return (
    <>
      {template === 'application_form' && (
        <a href={`/portal/print/${appId}`} target="_blank" rel="noopener" className={cn(linkCls, 'border-gold bg-gold-soft text-navy hover:bg-gold-2')}>
          <Printer size={15} aria-hidden="true" /> My filled-in form
        </a>
      )}
      <a href={`/portal/forms/${t.file}`} download className={cn(linkCls, 'border-navy/15 bg-white text-navy hover:border-gold')}>
        {template === 'application_form' ? <FileDown size={15} aria-hidden="true" /> : <Download size={15} aria-hidden="true" />}
        {t.label} ({t.format})
      </a>
    </>
  );
}

export function SamplePanel({ req, level, appId }: { req: DocRequirement; level: string; appId: string }) {
  const spec = DOCS[req.kind];
  const count = spec.points.length;
  return (
    <div className="space-y-6">
      <p className="text-[15px] text-ink">{req.kind === 'education' ? educationWhat(level) : spec.what}</p>
      <div className="rounded-2xl border border-line bg-paper/60 p-4">
        <DocSample kind={spec.sample} count={count} title={spec.title} className="mx-auto block max-h-[340px] w-full" />
      </div>
      <div>
        <h3 className="font-sans text-[15px] font-medium text-navy">Check these</h3>
        <ol className="mt-3 space-y-2.5">
          {spec.points.map((p, i) => (
            <li key={p} className="flex gap-3 text-[14.5px] text-ink">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold text-[12px] font-bold text-navy">{i + 1}</span>
              {p}
            </li>
          ))}
        </ol>
      </div>
      {spec.avoid.length > 0 && (
        <div>
          <h3 className="font-sans text-[15px] font-medium text-navy">Avoid</h3>
          <ul className="mt-3 space-y-2">
            {spec.avoid.map((a) => (
              <li key={a} className="flex gap-3 text-[14.5px] text-ink">
                <X size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-danger" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
      {spec.template && (
        <div className="rounded-2xl bg-navy p-4 text-mist">
          <p className="text-[14px]">
            {spec.template === 'application_form'
              ? 'Open your filled-in form, print it, sign it at the end, then scan or photograph every page.'
              : 'Download the form, take it to a hospital or clinic, and ask the doctor to fill it in and stamp it.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <TemplateLinks template={spec.template} appId={appId} />
          </div>
        </div>
      )}
      <p className="text-[13px] text-muted">
        Accepted files: {FILE_TYPES[spec.files].label}, up to {FILE_TYPES[spec.files].maxMB} MB each. Photos from your phone are fine if every word is readable.
      </p>
    </div>
  );
}

export function DocCard({ req, files, appId, level, canUpload, canReplace }: { req: DocRequirement; files: UploadedDoc[]; appId: string; level: string; canUpload: boolean; canReplace: boolean }) {
  const spec = DOCS[req.kind];
  const state = docState(files);
  const S = STATE[state];
  const live = files.filter((f) => f.status !== 'rejected').length;
  return (
    <li id={`doc-${req.kind}`} className={cn('scroll-mt-6 rounded-card border bg-white p-5 sm:p-6', state === 'rejected' ? 'border-danger/40' : 'border-line')}>
      <div className="flex items-start gap-4">
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', S.cls)} aria-hidden="true">
          <S.icon size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-sans text-[16.5px] font-medium text-navy">{spec.title}</h3>
            <span className={cn('rounded-full px-2.5 py-0.5 text-[11.5px] font-medium', NEED[req.need].cls)}>{NEED[req.need].label}</span>
          </div>
          <p className="mt-1 text-[14px] text-muted">{req.kind === 'education' ? educationWhat(level) : spec.what}</p>
          {req.note && (
            <p className="mt-2 rounded-xl bg-gold-soft/60 px-3 py-2 text-[13px] text-ink">
              <span className="font-medium text-gold-deep">This programme: </span>
              {req.note}
            </p>
          )}
          <p className="sr-only">Status: {S.words}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <SampleButton title={spec.title}>
              <SamplePanel req={req} level={level} appId={appId} />
            </SampleButton>
            {spec.template && <TemplateLinks template={spec.template} appId={appId} />}
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <DocFiles appId={appId} kind={req.kind} files={files} canDelete={canUpload} canReplace={canReplace} />
        </div>
      )}
      {/* while IFFI reviews, a document that is missing altogether can still be sent; rejected files have their own "replace" */}
      {(canUpload || (canReplace && files.length === 0)) && !(files.length > 0 && live === 0) && live < spec.maxFiles && (
        <>
          <DocumentUploader appId={appId} kind={req.kind} slots={spec.maxFiles - live} className="mt-4" />
          {req.kind === 'health_form' && (
            <p className="mt-2 text-[12.5px] text-muted">
              By uploading it you agree that IFFI uses this medical information only for your application and student visa. You can ask us to delete it at any
              time.
            </p>
          )}
        </>
      )}
    </li>
  );
}
