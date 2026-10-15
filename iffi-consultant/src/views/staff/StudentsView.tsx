import { FileText } from 'lucide-react';
import { LEVEL_LABEL } from '@/lib/programs';
import { Link } from '@/lib/router';
import type { StudentSummary } from '@/lib/staff/queries';
import { Avatar } from '@/components/portal/Avatar';
import { PortalBand } from '@/components/portal/PortalBand';
import { StudentWhatsApp, shortDate } from '@/components/staff/StaffBits';

export type StudentRow = StudentSummary & {
  level: string | null;
  applicationIds: string[];
  english_test?: string | null;
  english_letter?: unknown;
};

function Applied({ s }: { s: StudentRow }) {
  if (!s.applicationIds.length) return <span className="text-muted">Not yet</span>;
  return (
    <Link to={`/staff/applications/${s.applicationIds[0]}`} className="font-medium text-navy underline underline-offset-4 hover:text-gold-deep">
      {s.applicationIds.length === 1 ? 'Open application' : `${s.applicationIds.length} applications`}
    </Link>
  );
}

function EnglishStatus({ s }: { s: StudentRow }) {
  const hasLetter = s.english_test === 'moi' && s.english_letter && typeof s.english_letter === 'object' && (s.english_letter as Record<string, unknown>).storage_path;

  if (hasLetter) {
    return (
      <a
        href={`/portal/files/${s.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-navy/[0.05] border border-navy/20 px-2.5 py-1 text-[12.5px] font-medium text-navy hover:bg-navy/10"
        title="View English proficiency letter"
      >
        <FileText size={12} aria-hidden="true" /> Letter uploaded
      </a>
    );
  }

  if (s.english_test && s.english_test !== 'none' && s.english_test !== 'moi') {
    return <span className="text-[13px] text-ink">{s.english_test.toUpperCase()}</span>;
  }

  if (s.english_test === 'moi') {
    return <span className="text-[13px] text-muted">MOI (no letter yet)</span>;
  }

  if (!s.level) return <span className="text-muted">—</span>;
  return <span className="text-[13px] text-muted">No test yet</span>;
}

export default function StudentsView({ students, count }: { students: StudentRow[]; count: number }) {
  const quizDone = students.filter((s) => s.level).length;
  const withLetters = students.filter((s) => s.english_test === 'moi' && s.english_letter && typeof s.english_letter === 'object' && (s.english_letter as Record<string, unknown>).storage_path).length;
  return (
    <>
      <PortalBand
        title="Students"
        lede={`${count} signed up · ${quizDone} finished quiz${withLetters ? ` · ${withLetters} with English proficiency letter` : ''}. Newest first.`}
      />

      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        {!students.length ? (
          <p className="rounded-card border border-line bg-white p-6 text-[15px] text-muted">When a student signs up with Google they appear here.</p>
        ) : (
          <div className="overflow-hidden rounded-card border border-line bg-white">
            {/* md+: table */}
            <table className="hidden w-full text-left text-[14px] md:table">
              <thead className="border-b border-line bg-paper/60 text-[13px] text-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 font-medium">Student</th>
                  <th scope="col" className="px-6 py-3 font-medium">Wants to study</th>
                  <th scope="col" className="px-6 py-3 font-medium">English</th>
                  <th scope="col" className="px-6 py-3 font-medium">WhatsApp</th>
                  <th scope="col" className="px-6 py-3 font-medium">Applied</th>
                  <th scope="col" className="px-6 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.full_name} src={s.avatar_url} size={36} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-navy">{s.full_name ?? 'No name yet'}</p>
                          <p className="truncate text-[13px] text-muted">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">{s.level ? LEVEL_LABEL[s.level] : <span className="text-muted">Quiz not finished</span>}</td>
                    <td className="px-6 py-3.5">
                      <EnglishStatus s={s} />
                    </td>
                    <td className="px-6 py-3.5">
                      <StudentWhatsApp student={s} />
                    </td>
                    <td className="px-6 py-3.5">
                      <Applied s={s} />
                    </td>
                    <td className="tabular px-6 py-3.5 text-muted">{shortDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* phones: stacked rows */}
            <ul className="divide-y divide-line md:hidden">
              {students.map((s) => (
                <li key={s.id} className="flex items-start gap-3 p-4">
                  <Avatar name={s.full_name} src={s.avatar_url} size={40} />
                  <div className="min-w-0 flex-1 text-[13.5px]">
                    <p className="truncate text-[15px] font-medium text-navy">{s.full_name ?? 'No name yet'}</p>
                    <p className="truncate text-muted">{s.email}</p>
                    <p className="mt-2 text-ink">{s.level ? LEVEL_LABEL[s.level] : <span className="text-muted">Quiz not finished</span>}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <EnglishStatus s={s} />
                      <StudentWhatsApp student={s} />
                      <Applied s={s} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
