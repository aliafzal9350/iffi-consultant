import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Program } from '@/types/data';
import { getProfile, isTeam } from '@/lib/auth/dal';
import { programs as fallbackPrograms } from '@/data/catalog';

export const dynamic = 'force-dynamic';

function getProgramsFilePath(): string {
  return path.join(process.cwd(), 'src', 'data', 'programs.json');
}

async function readPrograms(): Promise<Program[]> {
  try {
    const filePath = getProgramsFilePath();
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as Program[];
  } catch {
    return fallbackPrograms;
  }
}

async function writePrograms(programs: Program[]): Promise<void> {
  const filePath = getProgramsFilePath();
  await fs.writeFile(filePath, JSON.stringify(programs, null, 2), 'utf8');
}

function generateSlug(id: string, level: string, city: string | null, province: string): string {
  const cleanId = id.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanLevel = level.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const loc = (city || province).toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${cleanId}-${cleanLevel}-${loc}`;
}

async function guardStaff(): Promise<NextResponse | null> {
  // In development, allow easy editing; in production or when profile exists, verify staff/admin role
  try {
    const profile = await getProfile();
    if (profile && !isTeam(profile.role)) {
      return NextResponse.json({ success: false, error: 'Staff access required' }, { status: 403 });
    }
  } catch {
    // If auth failed in prod, block
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Staff sign-in required' }, { status: 401 });
    }
  }
  return null;
}

export async function GET() {
  const denied = await guardStaff();
  if (denied) return denied;

  try {
    const list = await readPrograms();

    const stats = {
      total: list.length,
      bachelor: list.filter((p) => p.level === 'Bachelor').length,
      mbbs: list.filter((p) => p.level === 'MBBS').length,
      master: list.filter((p) => p.level === 'Master').length,
      phd: list.filter((p) => p.level === 'PhD').length,
      language: list.filter((p) => p.level === 'Language').length,
      fullyFunded: list.filter((p) => p.fullyFunded).length,
      withStipend: list.filter((p) => (p.stipendCNYPerMonth ?? 0) > 0).length,
      englishTaught: list.filter((p) => p.teachingLanguages?.includes('English')).length,
    };

    return NextResponse.json({
      success: true,
      stats,
      programs: list,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to read programmes' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const denied = await guardStaff();
  if (denied) return denied;

  try {
    const body = await req.json();
    const list = await readPrograms();

    const level = body.level || 'Bachelor';
    const city = body.city?.trim() || null;
    const province = body.province?.trim() || 'Beijing';

    // Auto-generate ID if needed
    let id = body.id?.trim();
    if (!id) {
      const prefixMap: Record<string, string> = {
        Bachelor: 'B',
        MBBS: 'M',
        Master: 'MA',
        PhD: 'P',
        Language: 'L',
      };
      const prefix = prefixMap[level] || 'B';
      const existingSamePrefix = list
        .filter((p) => p.id.startsWith(prefix + '-'))
        .map((p) => parseInt(p.id.split('-')[1], 10))
        .filter((n) => !isNaN(n));
      const nextNum = existingSamePrefix.length ? Math.max(...existingSamePrefix) + 1 : 1;
      id = `${prefix}-${String(nextNum).padStart(2, '0')}`;
    }

    // Check duplicate ID
    if (list.some((p) => p.id.toLowerCase() === id.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: `A programme with ID "${id}" already exists.` },
        { status: 400 }
      );
    }

    const slug = body.slug?.trim() || generateSlug(id, level, city, province);

    // Build standard Program entity
    const newProg: Program = {
      id,
      slug,
      level,
      levelDetail: body.levelDetail || null,
      displayName:
        body.displayName?.trim() ||
        `${level === 'MBBS' ? 'MBBS' : `${level} programme`} in ${city || province}`,
      city,
      province,
      cityKnown: !!city,
      provinceCode: body.provinceCode ?? 0,
      coordinates: body.coordinates ?? null,
      coordinatesApproximate: true,
      intake: body.intake || 'September 2026',
      duration: body.duration || (level === 'Bachelor' ? '4 years' : level === 'MBBS' ? '5+1 years' : '2-3 years'),
      teachingLanguages: body.teachingLanguages || ['English'],
      chineseTaught: !!body.chineseTaught,
      ranking: body.ranking || null,
      status: body.status || null,
      majors: Array.isArray(body.majors)
        ? body.majors
        : typeof body.majors === 'string'
        ? body.majors.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      fields: Array.isArray(body.fields) ? body.fields : [],
      scholarships: Array.isArray(body.scholarships) ? body.scholarships : [],
      costItems: Array.isArray(body.costItems) ? body.costItems : [],
      fees: Array.isArray(body.fees) ? body.fees : [],
      tuition: body.tuition || null,
      dorm: body.dorm || null,
      stipendText: body.stipendText || null,
      totalFee: body.totalFee || null,
      tuitionStandardCNYPerYear: body.tuitionStandardCNYPerYear ?? null,
      tuitionStandardEstimated: false,
      tuitionMaxListedCNYPerYear: body.tuitionMaxListedCNYPerYear ?? body.tuitionStandardCNYPerYear ?? null,
      tuitionMinCNYPerYear: body.tuitionMinCNYPerYear ?? 0,
      tuitionPerSemesterCNY: null,
      tuitionAndDormCombinedCNYPerYear: null,
      tuitionNote: body.tuitionNote || null,
      tuitionFree: body.tuitionFree || (body.fullyFunded ? 'all years (scholarship)' : null),
      fullyFunded: !!body.fullyFunded,
      stipendCNYPerMonth: body.stipendCNYPerMonth ?? null,
      languageRequirement:
        body.languageRequirement ||
        (body.noIeltsRequired ? 'No IELTS required; English proficiency letter accepted.' : null),
      languagePolicy: body.languagePolicy || {
        type: body.noIeltsRequired ? 'any-english' : 'none',
      },
      noIeltsRequired: body.noIeltsRequired ?? true,
      interview: body.interview || null,
      introVideoRequired: !!body.introVideoRequired,
      ageLimit: body.ageLimit || null,
      ageRange: body.ageRange || { min: 18, max: 28 },
      bankStatementUSD: body.bankStatementUSD ?? null,
      deadline2025: null,
      deadlineText: body.deadlineText || 'Applications open for 2026/2027 intake',
      typicalDeadlineMonth: body.typicalDeadlineMonth || 'June',
      documents: Array.isArray(body.documents)
        ? body.documents
        : [
            'Passport copy',
            'Academic certificates & transcripts',
            'Physical Examination Form (Foreigner)',
            'Non-Criminal Record (Police Certificate)',
          ],
      headline: body.headline || null,
      details: body.details || {},
    };

    list.unshift(newProg);
    await writePrograms(list);

    return NextResponse.json({
      success: true,
      message: 'Programme added successfully',
      program: newProg,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to add programme' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const denied = await guardStaff();
  if (denied) return denied;

  try {
    const body = await req.json();
    const list = await readPrograms();

    const idx = list.findIndex(
      (p) => p.id.toLowerCase() === (body.id || '').toLowerCase()
    );

    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: `Programme with ID "${body.id}" not found.` },
        { status: 404 }
      );
    }

    const current = list[idx];

    const updated: Program = {
      ...current,
      ...body,
      id: current.id,
      slug: body.slug?.trim() || current.slug,
      displayName: body.displayName?.trim() || current.displayName,
      city: body.city !== undefined ? body.city : current.city,
      province: body.province || current.province,
      level: body.level || current.level,
      majors: Array.isArray(body.majors)
        ? body.majors
        : typeof body.majors === 'string'
        ? body.majors.split(',').map((s: string) => s.trim()).filter(Boolean)
        : current.majors,
      tuitionStandardCNYPerYear:
        body.tuitionStandardCNYPerYear !== undefined
          ? body.tuitionStandardCNYPerYear
          : current.tuitionStandardCNYPerYear,
      tuitionMinCNYPerYear:
        body.tuitionMinCNYPerYear !== undefined ? body.tuitionMinCNYPerYear : current.tuitionMinCNYPerYear,
      stipendCNYPerMonth:
        body.stipendCNYPerMonth !== undefined ? body.stipendCNYPerMonth : current.stipendCNYPerMonth,
      fullyFunded: body.fullyFunded !== undefined ? !!body.fullyFunded : current.fullyFunded,
      noIeltsRequired: body.noIeltsRequired !== undefined ? !!body.noIeltsRequired : current.noIeltsRequired,
      intake: body.intake || current.intake,
      duration: body.duration || current.duration,
      typicalDeadlineMonth: body.typicalDeadlineMonth || current.typicalDeadlineMonth,
    };

    list[idx] = updated;
    await writePrograms(list);

    return NextResponse.json({
      success: true,
      message: 'Programme updated successfully',
      program: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update programme' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const denied = await guardStaff();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Programme ID is required in query (?id=...)' },
        { status: 400 }
      );
    }

    const list = await readPrograms();
    const initialLen = list.length;
    const filtered = list.filter((p) => p.id.toLowerCase() !== id.toLowerCase());

    if (filtered.length === initialLen) {
      return NextResponse.json(
        { success: false, error: `Programme with ID "${id}" was not found.` },
        { status: 404 }
      );
    }

    await writePrograms(filtered);

    return NextResponse.json({
      success: true,
      message: `Programme "${id}" deleted successfully.`,
      deletedId: id,
      remainingCount: filtered.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete programme' },
      { status: 500 }
    );
  }
}
