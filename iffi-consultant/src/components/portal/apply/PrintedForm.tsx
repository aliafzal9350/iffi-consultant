/**
 * IFFI's "Application Form for Foreign Students" (外国留学生入学申请表), laid out like the Word original and filled in
 * from the online answers. Empty answers stay as blank cells, so the form can still be completed by hand.
 */
import type { ReactNode } from 'react';
import { site } from '@/data/content';
import { applicationRef } from '@/lib/portal/application';
import { SECTIONS, rowsOf, savedSection, type FieldDef, type FormContext } from '@/lib/portal/form';
import { DECLARATION, IFFI_REFERENCE } from '@/lib/portal/policy';
import { fmtValue } from './AnswersView';

export interface PrintableApplication {
  id: string;
  program_id: string;
  form: Record<string, unknown> | null;
  signed_name: string | null;
  signed_at: string | null;
}

export function PrintedForm({ app, ctx }: { app: PrintableApplication; ctx: FormContext }) {
  const form = app.form ?? {};
  const v = {
    personal: savedSection(form, 'personal'),
    contact: savedSection(form, 'contact'),
    education: savedSection(form, 'education'),
    study: savedSection(form, 'study'),
    family: savedSection(form, 'family'),
  };
  const field = (section: keyof typeof v, name: string): string => {
    const def = SECTIONS[section].blocks.flatMap((b) => [...(b.fields ?? []), ...(b.group?.fields ?? [])]).find((f) => f.name === name);
    const raw = String(v[section][name] ?? '');
    return def ? fmtValue(def, raw, ctx) : raw;
  };
  const sameAddress = v.contact.permanentSame === 'yes';
  const addr = (prefix: 'present' | 'permanent') => (prefix === 'permanent' && sameAddress ? 'present' : prefix);
  const major = v.study.major === '__other' ? field('study', 'majorOther') : field('study', 'major');

  return (
    <article className="mx-auto max-w-[210mm] bg-white px-[10mm] py-[9mm] text-[9.5pt] leading-snug text-black shadow-lift print:max-w-none print:p-0 print:shadow-none">
      <header className="mb-3 text-center">
        <h1 lang="zh" className="font-zh text-[17pt] font-semibold tracking-[0.2em] text-black">
          外国留学生入学申请表
        </h1>
        <p className="mt-0.5 text-[11pt] font-semibold">Application Form for Foreign Students</p>
      </header>

      <Table>
        <Head zh="申请人信息" en="Personal Information" />
        <Row>
          <L zh="护照姓名" en="Passport name" rows={2} />
          <L zh="姓" en="Surname" />
          <V span={4}>{field('personal', 'surname')}</V>
        </Row>
        <Row>
          <L zh="名" en="Given name" />
          <V span={4}>{field('personal', 'givenName')}</V>
        </Row>
        <Row>
          <L zh="中文姓名" en="Chinese name (max 6 characters)" span={2} />
          <V span={4}>{field('personal', 'chineseName')}</V>
        </Row>
        <Row>
          <L zh="出生地点" en="Place of birth" />
          <V span={2}>{field('personal', 'placeOfBirth')}</V>
          <L zh="出生日期" en="Date of birth" />
          <V span={2}>{field('personal', 'dateOfBirth')}</V>
        </Row>
        <Row>
          <L zh="国籍" en="Nationality" />
          <V>{field('personal', 'nationality')}</V>
          <L zh="婚否" en="Marital status" />
          <V>{field('personal', 'maritalStatus')}</V>
          <L zh="健康状况" en="Health status" />
          <V>{field('personal', 'healthStatus')}</V>
        </Row>
        <Row>
          <L zh="宗教" en="Religion" />
          <V>{field('personal', 'religion')}</V>
          <L zh="母语" en="Native language" />
          <V>{field('personal', 'nativeLanguage')}</V>
          <L zh="爱好" en="Hobbies" />
          <V>{field('personal', 'hobbies')}</V>
        </Row>
        <Row>
          <L zh="性别" en="Gender" />
          <V>{field('personal', 'gender')}</V>
          <L zh="护照号码" en="Passport No." />
          <V>{field('personal', 'passportNumber')}</V>
          <L zh="护照有效期" en="Passport validity" />
          <V>{field('personal', 'passportExpiry')}</V>
        </Row>
        <Row>
          <L zh="最高学历" en="Highest diploma" />
          <V>{field('personal', 'highestDiploma')}</V>
          <L zh="职业" en="Occupation" />
          <V>{field('personal', 'occupation')}</V>
          <L zh="工作或学习单位" en="Employer or institution" />
          <V>{field('personal', 'institution')}</V>
        </Row>
        <Row>
          <L zh="手机" en="Cell-phone" />
          <V>{field('contact', 'mobile')}</V>
          <L zh="电话" en="Telephone" />
          <V>{field('contact', 'telephone')}</V>
          <L zh="电子邮件" en="E-mail" />
          <V className="break-all">{field('contact', 'email')}</V>
        </Row>
        {(['present', 'permanent'] as const).map((p) => (
          <Row key={p}>
            <L
              zh={p === 'present' ? '联系地址（录取通知书邮寄地址）' : '详细的永久居住地址'}
              en={p === 'present' ? 'Present address (mailing address for the admission letter)' : 'Permanent residence address'}
              span={2}
            />
            <V span={4}>
              <span className="block">
                Country: {field('contact', `${addr(p)}Country`)} · City: {field('contact', `${addr(p)}City`)} · Post code: {field('contact', `${addr(p)}Postcode`)}
              </span>
              <span className="block">Detail address: {field('contact', `${addr(p)}Detail`)}</span>
              {p === 'present' && v.contact.presentContact && <span className="block">Contact person: {field('contact', 'presentContact')}</span>}
            </V>
          </Row>
        ))}

        <Head zh="语言能力" en="Language Proficiency" />
        <Row>
          <L zh="汉语能力" en="Chinese proficiency" span={2} />
          <V span={4}>
            HSK: {v.education.hskLevel && v.education.hskLevel !== '0' ? `Level ${v.education.hskLevel}` : 'None'}
            {v.education.hskScore ? `, score ${v.education.hskScore}` : ''} · HSKK: {v.education.hskkLevel && v.education.hskkLevel !== 'none' ? field('education', 'hskkLevel') : 'None'}
            {v.education.hskkScore ? `, score ${v.education.hskkScore}` : ''}
          </V>
        </Row>
        <Row>
          <L zh="英语能力" en="English proficiency" span={2} />
          <V span={4}>
            {field('education', 'englishTest')}
            {v.education.englishScore ? `, score ${v.education.englishScore}` : ''}
          </V>
        </Row>

        <Head zh="教育背景（从高中起）" en="Educational background (from high school)" />
        <Rows
          ctx={ctx}
          heads={[
            ['在校期间', 'From / To', 2],
            ['学校', 'Institution', 2],
            ['所获学历', 'Certificate', 2],
          ]}
          rows={rowsOf(v.education, 'schools')}
          fields={SECTIONS.education.blocks[0].group!.fields}
          cells={(r, f) => [`${f('from')} – ${f('to')}`, f('institution'), f('certificate')]}
          min={4}
        />

        <Head zh="本人工作经历（博士生至少写一条）" en="Employment record (PhD applicants at least one)" />
        <Rows
          ctx={ctx}
          heads={[
            ['起止时间', 'From / To', 2],
            ['工作单位', 'Employer', 2],
            ['职务及职称', 'Posts held', 2],
          ]}
          rows={rowsOf(v.education, 'jobs')}
          fields={SECTIONS.education.blocks[1].group!.fields}
          cells={(r, f) => [`${f('from')} – ${f('to')}`, f('employer'), f('position')]}
          min={2}
        />

        <Head zh="留学中国计划" en="Study plan in China" />
        <Row>
          <L zh="申请学习专业" en="Major or field of study" span={2} />
          <V span={4}>{major}</V>
        </Row>
        <Row>
          <L zh="授课语言" en="Medium of instruction" />
          <V span={2}>{field('study', 'medium')}</V>
          <L zh="申请学位" en="Applying for degree" />
          <V span={2}>{field('study', 'degree')}</V>
        </Row>
        <Row>
          <L zh="学习期限" en="Duration" />
          <V span={5}>
            From {field('study', 'durationFrom') || '________'} to {field('study', 'durationTo') || '________'}
          </V>
        </Row>
        <Row>
          <L zh="经费来源" en="Funds" />
          <V span={5}>
            <Tick on={v.study.funding === 'self'} /> 自费 Self-support <Tick on={v.study.funding === 'scholarship'} /> 奖学金 Scholarship <Tick on={v.study.funding === 'other'} /> 其它 Other:{' '}
            {v.study.funding === 'other' ? field('study', 'fundingOther') : ''}
          </V>
        </Row>

        <Head zh="申请人亲属情况" en="Family members" />
        <Row>
          <L zh="关系" en="Relationship" />
          <L zh="姓名" en="Name" />
          <L zh="" en="Age" />
          <L zh="职业" en="Occupation" />
          <L zh="电话/邮箱" en="Tel. / Email" span={2} />
        </Row>
        {(['father', 'mother'] as const).map((p) => {
          const late = v.family[`${p}Late`] === 'yes';
          return (
            <Row key={p}>
              <L zh={p === 'father' ? '父亲' : '母亲'} en={p === 'father' ? 'Father' : 'Mother'} />
              <V>{field('family', `${p}Name`)}</V>
              <V>{late ? 'Deceased' : field('family', `${p}Age`)}</V>
              <V>{late ? '' : field('family', `${p}Occupation`)}</V>
              <V span={2}>{late ? '' : [field('family', `${p}Phone`), field('family', `${p}Email`)].filter(Boolean).join(' / ')}</V>
            </Row>
          );
        })}
        {[0, 1].map((i) => {
          const r = rowsOf(v.family, 'relatives')[i];
          return (
            <Row key={i}>
              <V>{r?.relation ?? ''}</V>
              <V>{r?.name ?? ''}</V>
              <V />
              <V>{r?.occupation ?? ''}</V>
              <V span={2}>{r?.phone ?? ''}</V>
            </Row>
          );
        })}

        {(
          [
            ['推荐单位（人）信息', 'Information for reference'],
            ['在华事务担保人', 'The guarantor in charge of your case in China'],
          ] as const
        ).map(([zh, en]) => (
          <IffiBlock key={en} zh={zh} en={en} />
        ))}

        <Head zh="经济担保人或机构" en="Financial guarantee" />
        <Row>
          <L zh="姓名" en="Name" />
          <L zh="工作机构" en="Organization" span={2} />
          <L zh="电话" en="Tel." />
          <L zh="邮箱" en="E-mail" span={2} />
        </Row>
        <Row>
          <V>{field('family', 'guarantorName')}</V>
          <V span={2}>{field('family', 'guarantorOrganization')}</V>
          <V>{field('family', 'guarantorPhone')}</V>
          <V span={2} className="break-all">
            {field('family', 'guarantorEmail')}
          </V>
        </Row>
        <Row>
          <L zh="联系地址" en="Address" />
          <V span={5}>{field('family', 'guarantorAddress')}</V>
        </Row>

        <Head zh="申请人保证" en="I hereby affirm that" />
        <tr>
          <td colSpan={6} className="border border-black px-2 py-1.5">
            <ol className="space-y-1">
              {DECLARATION.points.map((p, i) => (
                <li key={i}>
                  <span lang="zh" className="font-zh block">
                    {i + 1}. {p.zh}
                  </span>
                  <span className="block">{p.en}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 grid grid-cols-2 gap-6 pb-1">
              <p>
                日期 / Date: <span className="inline-block min-w-[35mm] border-b border-black">&nbsp;</span>
              </p>
              <p>
                申请人签名 / Applicant’s signature: <span className="inline-block min-w-[45mm] border-b border-black">&nbsp;</span>
              </p>
            </div>
            {app.signed_at && (
              <p className="mt-1 text-[8pt] text-neutral-600">
                Signed online by {app.signed_name} on {new Date(app.signed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} (declaration version {DECLARATION.version}).
              </p>
            )}
            <p className="mt-2 font-medium">◆ 若无签字，则视为无效申请 / The application is invalid without the applicant’s signature.</p>
          </td>
        </tr>
      </Table>

      <p className="mt-3 text-right text-[7.5pt] text-neutral-500">
        {applicationRef(app.id)} · {app.program_id} · filled in from the {site.brand.name} student portal
      </p>
    </article>
  );
}

// ---------------------------------------------------------------------------------------------- table pieces

function Table({ children }: { children: ReactNode }) {
  return (
    <table className="w-full table-fixed border-collapse">
      <colgroup>
        {Array.from({ length: 6 }, (_, i) => (
          <col key={i} className="w-1/6" />
        ))}
      </colgroup>
      <tbody>{children}</tbody>
    </table>
  );
}

const Row = ({ children }: { children: ReactNode }) => <tr className="break-inside-avoid">{children}</tr>;

function Head({ zh, en }: { zh: string; en: string }) {
  return (
    <tr className="break-after-avoid">
      <th colSpan={6} className="border border-black bg-neutral-100 px-2 py-1 text-left text-[9.5pt] font-semibold print:bg-neutral-100">
        <span lang="zh" className="font-zh">
          {zh}
        </span>{' '}
        / {en}
      </th>
    </tr>
  );
}

function L({ zh, en, span = 1, rows }: { zh: string; en: string; span?: number; rows?: number }) {
  return (
    <th scope="row" colSpan={span} rowSpan={rows} className="border border-black px-1.5 py-1 text-left align-top text-[8pt] font-normal">
      {zh && (
        <span lang="zh" className="font-zh block">
          {zh}
        </span>
      )}
      <span className="block">{en}</span>
    </th>
  );
}

function V({ children, span = 1, className }: { children?: ReactNode; span?: number; className?: string }) {
  return (
    <td colSpan={span} className={`h-[7mm] border border-black px-1.5 py-1 align-top text-[9.5pt] font-medium ${className ?? ''}`}>
      {children === '' || children == null ? ' ' : children}
    </td>
  );
}

const Tick = ({ on }: { on: boolean }) => <span className="mx-1 inline-block w-[1.4em] text-center">({on ? '✓' : '\u00a0\u00a0'})</span>;

function Rows({
  ctx,
  heads,
  rows,
  fields,
  cells,
  min,
}: {
  ctx: FormContext;
  heads: [string, string, number][];
  rows: Record<string, string>[];
  fields: FieldDef[];
  cells: (r: Record<string, string>, f: (name: string) => string) => string[];
  min: number;
}) {
  const filled = [...rows, ...Array.from({ length: Math.max(0, min - rows.length) }, () => ({}) as Record<string, string>)];
  return (
    <>
      <Row>
        {heads.map(([zh, en, span]) => (
          <L key={en} zh={zh} en={en} span={span} />
        ))}
      </Row>
      {filled.map((r, i) => {
        const empty = !Object.values(r).some(Boolean);
        const f = (name: string) => {
          const def = fields.find((x) => x.name === name);
          return def ? fmtValue(def, r[name] ?? '', ctx) : (r[name] ?? '');
        };
        return (
          <Row key={i}>
            {cells(r, f).map((c, k) => (
              <V key={k} span={heads[k][2]}>
                {empty ? '\u00a0' : c}
              </V>
            ))}
          </Row>
        );
      })}
    </>
  );
}

function IffiBlock({ zh, en }: { zh: string; en: string }) {
  return (
    <>
      <Head zh={zh} en={en} />
      <Row>
        <L zh="姓名" en="Name" />
        <L zh="工作机构" en="Organization" span={2} />
        <L zh="电话" en="Tel." />
        <L zh="邮箱" en="E-mail" span={2} />
      </Row>
      <Row>
        <V>{IFFI_REFERENCE.name}</V>
        <V span={2}>{IFFI_REFERENCE.organization}</V>
        <V>{IFFI_REFERENCE.phone}</V>
        <V span={2} className="break-all">
          {IFFI_REFERENCE.email}
        </V>
      </Row>
      <Row>
        <L zh="联系地址" en="Address" />
        <V span={5}>{IFFI_REFERENCE.address}</V>
      </Row>
    </>
  );
}

