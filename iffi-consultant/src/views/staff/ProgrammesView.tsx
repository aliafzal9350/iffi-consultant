'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { provinces } from '@/data/places';
import type { Program } from '@/types/data';
import { fmtCNY } from '@/lib/format';
import { PortalBand } from '@/components/portal/PortalBand';
import { buttonClass } from '@/components/ui/buttonStyles';

const PROVINCE_NAMES = provinces.map((p) => p.name).sort();
const LEVELS = ['All', 'Bachelor', 'MBBS', 'Master', 'PhD', 'Language'] as const;

export default function ProgrammesView({ initialPrograms = [] }: { initialPrograms?: Program[] }) {
  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<(typeof LEVELS)[number]>('All');
  const [provinceFilter, setProvinceFilter] = useState('All');
  const [fullyFundedOnly, setFullyFundedOnly] = useState(false);
  const [stipendOnly, setStipendOnly] = useState(false);
  const [noIeltsOnly, setNoIeltsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'id' | 'stipend' | 'tuition' | 'name'>('id');

  // Modal states
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Partial<Program> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New major input buffer
  const [majorInput, setMajorInput] = useState('');

  // Auto-dismiss notices
  useEffect(() => {
    if (actionNotice) {
      const t = setTimeout(() => setActionNotice(null), 4500);
      return () => clearTimeout(t);
    }
  }, [actionNotice]);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff/programs');
      const data = await res.json();
      if (data.success) {
        setPrograms(data.programs);
        setActionNotice({ type: 'success', message: 'Programmes refreshed successfully.' });
      } else {
        setActionNotice({ type: 'error', message: data.error || 'Failed to load programmes' });
      }
    } catch {
      setActionNotice({ type: 'error', message: 'Failed to fetch programmes from server' });
    } finally {
      setLoading(false);
    }
  };

  // Filtered & Sorted
  const filteredPrograms = useMemo(() => {
    return programs
      .filter((p) => {
        if (levelFilter !== 'All' && p.level !== levelFilter) return false;
        if (provinceFilter !== 'All' && p.province !== provinceFilter) return false;
        if (fullyFundedOnly && !p.fullyFunded) return false;
        if (stipendOnly && !(p.stipendCNYPerMonth && p.stipendCNYPerMonth > 0)) return false;
        if (noIeltsOnly && !p.noIeltsRequired) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const inId = p.id.toLowerCase().includes(q);
          const inName = p.displayName.toLowerCase().includes(q);
          const inCity = (p.city || '').toLowerCase().includes(q);
          const inProv = p.province.toLowerCase().includes(q);
          const inMajor = p.majors?.some((m) => m.toLowerCase().includes(q));
          return inId || inName || inCity || inProv || inMajor;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'stipend') {
          return (b.stipendCNYPerMonth || 0) - (a.stipendCNYPerMonth || 0);
        }
        if (sortBy === 'tuition') {
          return (a.tuitionMinCNYPerYear ?? 999999) - (b.tuitionMinCNYPerYear ?? 999999);
        }
        if (sortBy === 'name') {
          return a.displayName.localeCompare(b.displayName);
        }
        return a.id.localeCompare(b.id, 'en', { numeric: true });
      });
  }, [programs, search, levelFilter, provinceFilter, fullyFundedOnly, stipendOnly, noIeltsOnly, sortBy]);

  // Statistics overview
  const stats = useMemo(() => {
    return {
      total: programs.length,
      bachelor: programs.filter((p) => p.level === 'Bachelor').length,
      mbbs: programs.filter((p) => p.level === 'MBBS').length,
      master: programs.filter((p) => p.level === 'Master').length,
      phd: programs.filter((p) => p.level === 'PhD').length,
      fullyFunded: programs.filter((p) => p.fullyFunded).length,
      stipend: programs.filter((p) => (p.stipendCNYPerMonth || 0) > 0).length,
    };
  }, [programs]);

  // Open editor for new program
  const openNewProgram = () => {
    setIsNew(true);
    setEditingProgram({
      level: 'Bachelor',
      displayName: '',
      city: '',
      province: 'Jiangsu',
      majors: ['Computer Science and Technology'],
      tuitionStandardCNYPerYear: 20000,
      tuitionMinCNYPerYear: 0,
      stipendCNYPerMonth: 2500,
      fullyFunded: true,
      noIeltsRequired: true,
      duration: '4 years',
      intake: 'September 2026',
      typicalDeadlineMonth: 'June',
      status: '211, 985 and Double First Class University',
      teachingLanguages: ['English'],
      documents: [
        'Passport bio page',
        'Highest degree / transcript',
        'Foreigner Physical Examination Form',
        'Non-Criminal Record Certificate',
      ],
    });
    setMajorInput('');
    setEditorOpen(true);
  };

  // Open editor for existing program
  const openEditProgram = (prog: Program) => {
    setIsNew(false);
    setEditingProgram({ ...prog });
    setMajorInput('');
    setEditorOpen(true);
  };

  // Duplicate program
  const handleDuplicate = (prog: Program) => {
    setIsNew(true);
    const clone: Partial<Program> = {
      ...prog,
      id: undefined,
      slug: undefined,
      displayName: `${prog.displayName} (Copy)`,
    };
    setEditingProgram(clone);
    setMajorInput('');
    setEditorOpen(true);
  };

  // Save changes
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;

    setLoading(true);
    try {
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch('/api/staff/programs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProgram),
      });
      const data = await res.json();

      if (data.success) {
        setActionNotice({
          type: 'success',
          message: isNew
            ? `Programme ${data.program?.id || ''} added successfully.`
            : `Programme ${editingProgram.id} updated successfully.`,
        });
        setEditorOpen(false);
        // Refresh local list
        if (isNew && data.program) {
          setPrograms((prev) => [data.program, ...prev]);
        } else if (data.program) {
          setPrograms((prev) => prev.map((p) => (p.id === data.program.id ? data.program : p)));
        } else {
          fetchPrograms();
        }
      } else {
        setActionNotice({ type: 'error', message: data.error || 'Failed to save programme' });
      }
    } catch {
      setActionNotice({ type: 'error', message: 'Network error while saving' });
    } finally {
      setLoading(false);
    }
  };

  // Delete program
  const handleDeleteProgram = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/programs?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setActionNotice({ type: 'success', message: `Programme "${id}" deleted.` });
        setDeleteConfirmId(null);
        setPrograms((prev) => prev.filter((p) => p.id !== id));
      } else {
        setActionNotice({ type: 'error', message: data.error || 'Failed to delete programme' });
      }
    } catch {
      setActionNotice({ type: 'error', message: 'Network error while deleting' });
    } finally {
      setLoading(false);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(programs, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `iffi-consultant-programs-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  // Tag helper for majors
  const addMajor = () => {
    if (!majorInput.trim() || !editingProgram) return;
    const current = editingProgram.majors || [];
    if (!current.includes(majorInput.trim())) {
      setEditingProgram({ ...editingProgram, majors: [...current, majorInput.trim()] });
    }
    setMajorInput('');
  };

  const removeMajor = (idx: number) => {
    if (!editingProgram || !editingProgram.majors) return;
    const updated = [...editingProgram.majors];
    updated.splice(idx, 1);
    setEditingProgram({ ...editingProgram, majors: updated });
  };

  return (
    <>
      <PortalBand
        title="Programmes Manager"
        lede={`Manage universities, scholarships, and degree programmes in the IFFI catalog (${stats.total} total).`}
      >
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <span className="tabular font-display text-[1.75rem] font-semibold leading-none text-gold-2">
              {stats.total}
            </span>
            <span className="mt-2 block text-[13px] text-mist">Total Programmes</span>
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <span className="tabular font-display text-[1.75rem] font-semibold leading-none text-white">
              {stats.bachelor}
            </span>
            <span className="mt-2 block text-[13px] text-mist">Bachelor</span>
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <span className="tabular font-display text-[1.75rem] font-semibold leading-none text-emerald-400">
              {stats.mbbs}
            </span>
            <span className="mt-2 block text-[13px] text-mist">MBBS (Medicine)</span>
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <span className="tabular font-display text-[1.75rem] font-semibold leading-none text-white">
              {stats.master}
            </span>
            <span className="mt-2 block text-[13px] text-mist">Master</span>
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <span className="tabular font-display text-[1.75rem] font-semibold leading-none text-gold-2">
              {stats.fullyFunded}
            </span>
            <span className="mt-2 block text-[13px] text-mist">Fully Funded</span>
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <span className="tabular font-display text-[1.75rem] font-semibold leading-none text-sky-400">
              {stats.stipend}
            </span>
            <span className="mt-2 block text-[13px] text-mist">With Stipend</span>
          </li>
        </ul>
      </PortalBand>

      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        {/* Floating Notice */}
        {actionNotice && (
          <div
            className={`mb-6 flex items-center justify-between rounded-xl p-4 shadow-sm ring-1 ${
              actionNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 ring-emerald-200'
                : 'bg-red-50 text-red-900 ring-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              )}
              <span className="text-[14px] font-medium">{actionNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-current opacity-70 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Action Header & Search Bar */}
        <div className="rounded-card border border-line bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, title, university, province, city, or major..."
                className="w-full rounded-xl border border-line bg-paper/50 py-2.5 pl-10 pr-10 text-[14px] text-navy placeholder-muted focus:border-navy focus:bg-white focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-3 text-muted hover:text-navy"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Top Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                title="Export database as JSON"
                className={buttonClass('outline', 'sm')}
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>
              <button
                type="button"
                onClick={fetchPrograms}
                title="Refresh database"
                disabled={loading}
                className={buttonClass('outline', 'sm')}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={openNewProgram}
                className={buttonClass('gold', 'sm')}
              >
                <Plus size={16} />
                <span>Add Programme</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line/60 pt-4">
            {/* Level Filter */}
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span>Level:</span>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as any)}
                className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-navy focus:border-navy focus:outline-none"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* Province Filter */}
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span>Province:</span>
              <select
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
                className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-navy focus:border-navy focus:outline-none"
              >
                <option value="All">All Provinces</option>
                {PROVINCE_NAMES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Filter Badges */}
            <button
              type="button"
              onClick={() => setFullyFundedOnly(!fullyFundedOnly)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                fullyFundedOnly
                  ? 'bg-gold-2 text-navy font-semibold'
                  : 'border border-line bg-paper/60 text-navy hover:bg-paper'
              }`}
            >
              ★ Fully Funded
            </button>

            <button
              type="button"
              onClick={() => setStipendOnly(!stipendOnly)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                stipendOnly
                  ? 'bg-sky-100 text-sky-900 border border-sky-300 font-semibold'
                  : 'border border-line bg-paper/60 text-navy hover:bg-paper'
              }`}
            >
              ¥ With Stipend
            </button>

            <button
              type="button"
              onClick={() => setNoIeltsOnly(!noIeltsOnly)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                noIeltsOnly
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold'
                  : 'border border-line bg-paper/60 text-navy hover:bg-paper'
              }`}
            >
              ✓ No IELTS
            </button>

            {/* Sort Dropdown */}
            <div className="ml-auto flex items-center gap-1.5 text-xs text-muted">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-navy focus:border-navy focus:outline-none"
              >
                <option value="id">ID (Default)</option>
                <option value="stipend">Highest Stipend</option>
                <option value="tuition">Lowest Tuition</option>
                <option value="name">Programme Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-6 flex items-center justify-between text-xs text-muted">
          <span>
            Showing <strong className="text-navy">{filteredPrograms.length}</strong> of{' '}
            <strong className="text-navy">{programs.length}</strong> programmes
          </span>
          {(search || levelFilter !== 'All' || provinceFilter !== 'All' || fullyFundedOnly || stipendOnly || noIeltsOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setLevelFilter('All');
                setProvinceFilter('All');
                setFullyFundedOnly(false);
                setStipendOnly(false);
                setNoIeltsOnly(false);
              }}
              className="text-gold-deep hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Programmes Table */}
        <div className="mt-3 overflow-hidden rounded-card border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="border-b border-line bg-paper/60 text-[13px] font-medium text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3">ID</th>
                  <th scope="col" className="px-5 py-3">Programme & University</th>
                  <th scope="col" className="px-5 py-3">Level</th>
                  <th scope="col" className="px-5 py-3">Location</th>
                  <th scope="col" className="px-5 py-3">Funding & Fees</th>
                  <th scope="col" className="px-5 py-3">Languages</th>
                  <th scope="col" className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredPrograms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted">
                      No programmes match your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredPrograms.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-paper/40">
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span className="inline-block rounded-md bg-navy px-2 py-0.5 font-mono text-xs font-semibold text-gold-2">
                          {p.id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="max-w-md">
                          <p className="font-medium text-navy line-clamp-1">{p.displayName}</p>
                          <div className="mt-0.5 flex flex-wrap gap-1 text-[12px] text-muted">
                            {p.status && (
                              <span className="rounded bg-paper px-1.5 py-0.2 text-[11px] text-muted">
                                {p.status}
                              </span>
                            )}
                            {p.majors && p.majors.length > 0 && (
                              <span className="line-clamp-1 text-[12px]">
                                {p.majors.slice(0, 2).join(', ')}
                                {p.majors.length > 2 && ` +${p.majors.length - 2} more`}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            p.level === 'MBBS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.level === 'Bachelor'
                              ? 'bg-blue-100 text-blue-800'
                              : p.level === 'Master'
                              ? 'bg-purple-100 text-purple-800'
                              : p.level === 'PhD'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-paper text-navy'
                          }`}
                        >
                          {p.level}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-navy">
                        <div className="flex items-center gap-1.5 text-xs">
                          <MapPin size={13} className="text-muted" />
                          <span>
                            {p.city ? `${p.city}, ` : ''}
                            {p.province}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs">
                        {p.fullyFunded ? (
                          <span className="font-semibold text-gold-deep">★ Fully Funded</span>
                        ) : p.tuitionMinCNYPerYear === 0 ? (
                          <span className="font-medium text-emerald-700">0 - {fmtCNY(p.tuitionStandardCNYPerYear ?? 0)}/yr</span>
                        ) : (
                          <span className="text-navy">{fmtCNY(p.tuitionStandardCNYPerYear ?? 0)}/yr</span>
                        )}
                        {p.stipendCNYPerMonth ? (
                          <span className="block text-[11px] text-sky-700">
                            + {fmtCNY(p.stipendCNYPerMonth)}/mo stipend
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs">
                        <span className="block text-navy">
                          {p.teachingLanguages?.join(', ') || 'English'}
                        </span>
                        {p.noIeltsRequired && (
                          <span className="block text-[11px] text-emerald-700">✓ No IELTS</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/programmes/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View public live page"
                            className="rounded p-1.5 text-muted hover:bg-paper hover:text-navy"
                          >
                            <ExternalLink size={15} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(p)}
                            title="Duplicate programme"
                            className="rounded p-1.5 text-muted hover:bg-paper hover:text-navy"
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditProgram(p)}
                            title="Edit programme"
                            className="rounded p-1.5 text-navy hover:bg-gold/20 hover:text-gold-deep"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(p.id)}
                            title="Delete programme"
                            className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ADD / EDIT PROGRAMME MODAL                                    */}
      {/* ------------------------------------------------------------- */}
      {editorOpen && editingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-card border border-line bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="font-display text-xl font-semibold text-navy">
                  {isNew ? 'Add New Degree Programme' : `Edit Programme: ${editingProgram.id}`}
                </h3>
                <p className="text-xs text-muted">
                  Update database fields stored in <code className="text-navy">src/data/programs.json</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-lg p-2 text-muted hover:bg-paper hover:text-navy"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="mt-6 space-y-6">
              {/* SECTION: BASIC INFO */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  1. Basic Information
                </h4>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-navy">
                      Programme ID {isNew && <span className="text-muted">(Auto if blank)</span>}
                    </label>
                    <input
                      type="text"
                      disabled={!isNew}
                      value={editingProgram.id || ''}
                      onChange={(e) => setEditingProgram({ ...editingProgram, id: e.target.value })}
                      placeholder="e.g. B-01, M-02"
                      className="mt-1 w-full rounded-lg border border-line bg-paper/40 px-3 py-2 text-sm text-navy disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy">Degree Level *</label>
                    <select
                      value={editingProgram.level || 'Bachelor'}
                      onChange={(e) => setEditingProgram({ ...editingProgram, level: e.target.value as any })}
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                    >
                      <option value="Bachelor">Bachelor</option>
                      <option value="MBBS">MBBS (Medicine)</option>
                      <option value="Master">Master</option>
                      <option value="PhD">PhD</option>
                      <option value="Language">Language</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy">Custom URL Slug</label>
                    <input
                      type="text"
                      value={editingProgram.slug || ''}
                      onChange={(e) => setEditingProgram({ ...editingProgram, slug: e.target.value })}
                      placeholder="Auto-generated if blank"
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-navy">
                    Display Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProgram.displayName || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, displayName: e.target.value })}
                    placeholder="e.g. Bachelor of Computer Science & Technology at Southeast University"
                    className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-navy">Province *</label>
                    <select
                      value={editingProgram.province || 'Jiangsu'}
                      onChange={(e) => setEditingProgram({ ...editingProgram, province: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                    >
                      {PROVINCE_NAMES.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy">City</label>
                    <input
                      type="text"
                      value={editingProgram.city || ''}
                      onChange={(e) => setEditingProgram({ ...editingProgram, city: e.target.value })}
                      placeholder="e.g. Nanjing, Hangzhou, Beijing"
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-navy">
                    University Status / Badges
                  </label>
                  <input
                    type="text"
                    value={editingProgram.status || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, status: e.target.value })}
                    placeholder="e.g. 211, 985, Double First Class University, MOE Listed"
                    className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                  />
                </div>
              </div>

              {/* SECTION: ACADEMICS */}
              <div className="border-t border-line pt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  2. Academics & Intake
                </h4>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-navy">Intake</label>
                    <input
                      type="text"
                      value={editingProgram.intake || 'September 2026'}
                      onChange={(e) => setEditingProgram({ ...editingProgram, intake: e.target.value })}
                      placeholder="September 2026"
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy">Duration</label>
                    <input
                      type="text"
                      value={editingProgram.duration || '4 years'}
                      onChange={(e) => setEditingProgram({ ...editingProgram, duration: e.target.value })}
                      placeholder="4 years, 5+1 years, 2-3 years"
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy">Deadline Month</label>
                    <input
                      type="text"
                      value={editingProgram.typicalDeadlineMonth || 'June'}
                      onChange={(e) =>
                        setEditingProgram({ ...editingProgram, typicalDeadlineMonth: e.target.value })
                      }
                      placeholder="June, July"
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                    />
                  </div>
                </div>

                {/* Majors tag editor */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-navy">Majors Offered</label>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(editingProgram.majors || []).map((m, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full bg-paper px-3 py-1 text-xs font-medium text-navy border border-line"
                      >
                        <span>{m}</span>
                        <button
                          type="button"
                          onClick={() => removeMajor(idx)}
                          className="hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={majorInput}
                      onChange={(e) => setMajorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addMajor();
                        }
                      }}
                      placeholder="Type a major and click Add or press Enter"
                      className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-navy"
                    />
                    <button
                      type="button"
                      onClick={addMajor}
                      className="rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy hover:text-white"
                    >
                      + Add Major
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: TUITION & SCHOLARSHIPS */}
              <div className="border-t border-line pt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  3. Tuition, Scholarships & Stipend
                </h4>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="fullyFunded"
                    checked={!!editingProgram.fullyFunded}
                    onChange={(e) =>
                      setEditingProgram({ ...editingProgram, fullyFunded: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-line text-navy"
                  />
                  <label htmlFor="fullyFunded" className="text-sm font-semibold text-navy">
                    ★ Fully Funded Scholarship (100% Free Tuition)
                  </label>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-navy">
                      Standard Tuition (CNY/year)
                    </label>
                    <input
                      type="number"
                      value={editingProgram.tuitionStandardCNYPerYear ?? 20000}
                      onChange={(e) =>
                        setEditingProgram({
                          ...editingProgram,
                          tuitionStandardCNYPerYear: Number(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy">
                      Minimum Tuition (CNY/year)
                    </label>
                    <input
                      type="number"
                      value={editingProgram.tuitionMinCNYPerYear ?? 0}
                      onChange={(e) =>
                        setEditingProgram({
                          ...editingProgram,
                          tuitionMinCNYPerYear: Number(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy">
                      Monthly Stipend (CNY/month)
                    </label>
                    <input
                      type="number"
                      value={editingProgram.stipendCNYPerMonth ?? 0}
                      onChange={(e) =>
                        setEditingProgram({
                          ...editingProgram,
                          stipendCNYPerMonth: Number(e.target.value) || 0,
                        })
                      }
                      placeholder="e.g. 2500"
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-navy">Accommodation / Dorm</label>
                    <input
                      type="text"
                      value={editingProgram.dorm || ''}
                      onChange={(e) => setEditingProgram({ ...editingProgram, dorm: e.target.value })}
                      placeholder="e.g. Free (scholarship) or 4,000 CNY/year"
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy">Tuition Note</label>
                    <input
                      type="text"
                      value={editingProgram.tuitionNote || ''}
                      onChange={(e) => setEditingProgram({ ...editingProgram, tuitionNote: e.target.value })}
                      placeholder="e.g. Partial scholarships available for top 10% applicants"
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: REQUIREMENTS */}
              <div className="border-t border-line pt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  4. Requirements & Admissions
                </h4>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="noIeltsRequired"
                    checked={editingProgram.noIeltsRequired ?? true}
                    onChange={(e) =>
                      setEditingProgram({ ...editingProgram, noIeltsRequired: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-line text-navy"
                  />
                  <label htmlFor="noIeltsRequired" className="text-sm font-semibold text-navy">
                    ✓ No IELTS Required (English Proficiency Letter Accepted)
                  </label>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-navy">Bank Statement (USD)</label>
                    <input
                      type="number"
                      value={editingProgram.bankStatementUSD ?? 3000}
                      onChange={(e) =>
                        setEditingProgram({
                          ...editingProgram,
                          bankStatementUSD: Number(e.target.value) || 0,
                        })
                      }
                      placeholder="3000"
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy">
                      Language Requirement Note
                    </label>
                    <input
                      type="text"
                      value={editingProgram.languageRequirement || ''}
                      onChange={(e) =>
                        setEditingProgram({ ...editingProgram, languageRequirement: e.target.value })
                      }
                      placeholder="No IELTS required; English proficiency letter accepted."
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy"
                    />
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex items-center justify-end gap-3 border-t border-line pt-5">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className={buttonClass('outline', 'md')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={buttonClass('gold', 'md')}
                >
                  {loading ? 'Saving Changes...' : isNew ? 'Create Programme' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL                                     */}
      {/* ------------------------------------------------------------- */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-card border border-line bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h3 className="font-display text-lg font-semibold text-navy">Confirm Programme Deletion</h3>
            </div>
            <p className="mt-3 text-sm text-muted">
              Are you sure you want to permanently delete programme{' '}
              <strong className="text-navy">{deleteConfirmId}</strong> from the database? This cannot be
              undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className={buttonClass('outline', 'sm')}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProgram(deleteConfirmId)}
                disabled={loading}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Programme'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
