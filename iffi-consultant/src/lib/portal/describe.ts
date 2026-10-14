/** One activity-log row in words, for the student's history and the staff timeline. Pure. */
import { STATUS_LABEL, isFormSection } from './application';
import { DOCS, isDocKind } from './documents';
import type { EventRow } from './events';
import { SECTIONS } from './form';
import { PURPOSE_LABEL, fmtMoney, type PaymentPurpose } from './payment';

const docTitle = (kind: unknown) => (typeof kind === 'string' && isDocKind(kind) ? DOCS[kind].title : 'Document');
const quote = (s: unknown) => (typeof s === 'string' && s ? ` “${s}”` : '');

export function describeEvent(e: Pick<EventRow, 'type' | 'to_status' | 'meta' | 'note'>): string {
  const m = e.meta ?? {};
  switch (e.type) {
    case 'status':
      return e.to_status ? STATUS_LABEL[e.to_status] : 'Status changed';
    case 'form':
      return typeof m.section === 'string' && isFormSection(m.section) ? `Finished “${SECTIONS[m.section].title}”` : 'Form updated';
    case 'document': {
      const verb = { uploaded: 'uploaded', replaced: 'replaced', deleted: 'deleted', accepted: 'accepted', rejected: 'needs a new file' }[String(m.action)] ?? 'updated';
      return `${docTitle(m.kind)} ${verb}${m.action === 'accepted' || m.action === 'rejected' ? '' : quote(m.file)}`;
    }
    case 'payment': {
      const purpose = PURPOSE_LABEL[(m.purpose as PaymentPurpose) ?? 'application_fee'] ?? 'Payment';
      if (m.action === 'submitted') return `${purpose} sent: ${fmtMoney(Number(m.amount), String(m.currency))} (${String(m.transactionId)})`;
      if (m.action === 'verified') return `${purpose} received`;
      if (m.action === 'rejected') return `${purpose} not found in IFFI's account`;
      if (m.action === 'fees') return 'Fees updated';
      return purpose;
    }
    case 'signature':
      if (m.cleared) return 'Signature removed: an answer changed';
      if (m.refundPolicy) return 'Refund policy accepted';
      return 'Application signed';
    case 'note':
      return e.note ? 'Note' : 'Note added';
    case 'assignment':
      return typeof m.name === 'string' && m.name ? `Adviser: ${m.name}` : 'Adviser removed';
  }
}
