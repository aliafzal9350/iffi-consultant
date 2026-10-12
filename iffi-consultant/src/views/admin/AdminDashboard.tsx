'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Lock,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { provinces } from '@/data/places';
import type { Program } from '@/types/data';
import { fmtCNY, fmtNumber } from '@/lib/format';
import { Crest } from '@/components/ui/Logo';

const PROVINCE_NAMES = provinces.map((p) => p.name).sort();
const LEVELS = ['All', 'Bachelor', 'MBBS', 'Master', 'PhD', 'Language'] as const;

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [programs, setPrograms] = useState<Program[]>([]);
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
      const t = setTimeout(() => setActionNotice(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionNotice]);

  // An existing session lives in the httpOnly cookie: if the API accepts it, skip the login form
  useEffect(() => {
    fetch('/api/admin/programs')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setIsAuthenticated(true);
          setPrograms(data.programs);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passcode }),
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        fetchPrograms();
      } else {
        setLoginError(data.error || 'Invalid passcode');
      }
    } catch {
      setLoginError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    fetch('/api/admin/auth', { method: 'DELETE' });
  };

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/programs');
      const data = await res.json();
      if (data.success) {
        setPrograms(data.programs);
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
          const inMajor = p.majors.some((m) => m.toLowerCase().includes(q));
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
      language: programs.filter((p) => p.level === 'Language').length,
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
      const res = await fetch('/api/admin/programs', {
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
        fetchPrograms();
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
      const res = await fetch(`/api/admin/programs?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setActionNotice({ type: 'success', message: `Programme "${id}" deleted.` });
        setDeleteConfirmId(null);
        fetchPrograms();
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

  // -------------------------------------------------------------
  // LOGIN SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-[#071124] via-navy to-[#050b18]">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1f3f]/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 ring-1 ring-gold/30">
              <Crest className="h-10 w-10" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-white">
              IFFI Consultant Portal
            </h1>
            <p className="mt-1.5 text-sm text-mist/80">
              Executive Admissions & Programme Management
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label htmlFor="passcode" className="block text-xs font-medium uppercase tracking-wider text-mist/90">
                Admin Passcode
              </label>
              <div className="relative mt-2">
                <input
                  id="passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="ADMIN_PASSWORD from .env.local"
                  autoFocus
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-mist/40 transition-colors focus:border-gold focus:bg-white/[0.08] focus:outline-none"
                />
                <Lock className="absolute right-3.5 top-3.5 h-5 w-5 text-mist/50" />
              </div>
              <p className="mt-2 text-xs text-mist/60">
                Local editor only. Set <code className="text-gold-2">ADMIN_PASSWORD</code> and <code className="text-gold-2">ADMIN_SECRET</code> in .env.local.
              </p>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-300 ring-1 ring-red-500/30">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gold py-3 font-semibold text-navy transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-mist/50">
            <a href="/" className="hover:text-gold transition-colors">
              ← Return to Public Website
            </a>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#071124] text-slate-100">
      {/* Top Admin Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071124]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 ring-1 ring-gold/30">
              <Crest className="h-6 w-6" />
            </div>
            <div>
              <span className="block font-display text-lg font-semibold leading-tight text-white">
                IFFI Consultant Admin
              </span>
              <span className="block text-[11px] text-gold-2">Programmes Control Center</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportJson}
              title="Export database as JSON"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-mist hover:bg-white/10 transition-colors"
            >
              <Download size={14} />
              Export JSON
            </button>
            <button
              type="button"
              onClick={fetchPrograms}
              title="Refresh database"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-mist hover:bg-white/10 transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold-2 hover:bg-gold/20 transition-colors"
            >
              <span>Public Site</span>
              <ExternalLink size={12} />
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-mist hover:text-white hover:bg-red-500/20 transition-colors"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Floating Notice */}
        {actionNotice && (
          <div
            className={`mb-6 flex items-center justify-between rounded-xl p-4 shadow-lg ring-1 ${
              actionNotice.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
                : 'bg-red-500/15 text-red-300 ring-red-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              )}
              <span className="text-sm font-medium">{actionNotice.message}</span>
            </div>
            <button type="button" onClick={() => setActionNotice(null)} className="text-current opacity-70 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Executive Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <span className="text-xs text-mist/75">Total Programmes</span>
            <p className="mt-1 font-display text-2xl font-bold text-white">{stats.total}</p>
            <span className="text-[11px] text-gold-2">Active in catalog</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <span className="text-xs text-mist/75">Bachelor</span>
            <p className="mt-1 font-display text-2xl font-bold text-white">{stats.bachelor}</p>
            <span className="text-[11px] text-mist/60">Undergraduate</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <span className="text-xs text-mist/75">MBBS (Medicine)</span>
            <p className="mt-1 font-display text-2xl font-bold text-emerald-400">{stats.mbbs}</p>
            <span className="text-[11px] text-mist/60">English-medium</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <span className="text-xs text-mist/75">Master / Postgraduate</span>
            <p className="mt-1 font-display text-2xl font-bold text-white">{stats.master}</p>
            <span className="text-[11px] text-mist/60">Research / Taught</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <span className="text-xs text-mist/75">Fully Funded</span>
            <p className="mt-1 font-display text-2xl font-bold text-gold-2">{stats.fullyFunded}</p>
            <span className="text-[11px] text-mist/60">100% Free Tuition</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <span className="text-xs text-mist/75">With Monthly Stipend</span>
            <p className="mt-1 font-display text-2xl font-bold text-sky-400">{stats.stipend}</p>
            <span className="text-[11px] text-mist/60">Living allowance</span>
          </div>
        </div>

        {/* Action Header & Search */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-mist/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID (B-01), city, province, or major (e.g. Software, MBBS)..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-mist/40 transition-colors focus:border-gold focus:bg-white/[0.08] focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-3 text-mist hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Main Add Button */}
            <button
              type="button"
              onClick={openNewProgram}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-semibold text-navy shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={18} />
              <span>Add New Programme</span>
            </button>
          </div>

          {/* Level Tabs */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {LEVELS.map((lvl) => {
              const active = levelFilter === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevelFilter(lvl)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-gold text-navy font-semibold shadow'
                      : 'bg-white/5 text-mist hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {lvl}
                  {lvl !== 'All' && (
                    <span className="ml-1.5 opacity-70">
                      ({programs.filter((p) => p.level === lvl).length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Additional Filter Row */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-mist">
            {/* Province Select */}
            <div className="flex items-center gap-1.5">
              <span>Province:</span>
              <select
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#0d1f3f] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-gold"
              >
                <option value="All">All Provinces ({PROVINCE_NAMES.length})</option>
                {PROVINCE_NAMES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Toggles */}
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={fullyFundedOnly}
                onChange={(e) => setFullyFundedOnly(e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-gold focus:ring-0"
              />
              <span>Fully Funded</span>
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={stipendOnly}
                onChange={(e) => setStipendOnly(e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-gold focus:ring-0"
              />
              <span>With Stipend</span>
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={noIeltsOnly}
                onChange={(e) => setNoIeltsOnly(e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-gold focus:ring-0"
              />
              <span>No IELTS</span>
            </label>

            {/* Sort Dropdown */}
            <div className="ml-auto flex items-center gap-1.5">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-white/10 bg-[#0d1f3f] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-gold"
              >
                <option value="id">By ID (Default)</option>
                <option value="stipend">Highest Stipend</option>
                <option value="tuition">Lowest Tuition</option>
                <option value="name">Programme Title</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="mt-6 flex items-center justify-between text-xs text-mist/75">
          <span>
            Showing <strong className="text-white">{filteredPrograms.length}</strong> of{' '}
            <strong className="text-white">{programs.length}</strong> programmes
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
              className="text-gold-2 hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Programme Cards / Table List */}
        <div className="mt-4 space-y-3">
          {filteredPrograms.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
              <p className="font-display text-lg text-white">No programmes match your filter criteria.</p>
              <p className="mt-1 text-sm text-mist/70">Try adjusting your keywords or clearing the active filters.</p>
            </div>
          ) : (
            filteredPrograms.map((prog) => {
              const hasStip = (prog.stipendCNYPerMonth || 0) > 0;
              const hasMin0 = prog.tuitionMinCNYPerYear === 0;

              return (
                <div
                  key={prog.id}
                  className="group flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-[border-color,background-color] hover:border-gold/40 hover:bg-white/[0.05] sm:flex-row sm:items-center"
                >
                  {/* Left: Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-navy-2 px-2 py-0.5 font-mono text-xs font-bold text-gold-2 ring-1 ring-gold/30">
                        {prog.id}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          prog.level === 'MBBS'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : prog.level === 'Master' || prog.level === 'PhD'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {prog.level}
                      </span>
                      {prog.fullyFunded && (
                        <span className="rounded bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold-2">
                          Fully Funded
                        </span>
                      )}
                      {hasStip && (
                        <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                          +{fmtNumber(prog.stipendCNYPerMonth!)} CNY/mo stipend
                        </span>
                      )}
                      {prog.noIeltsRequired && (
                        <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] text-mist/90">
                          No IELTS
                        </span>
                      )}
                    </div>

                    <h2 className="mt-1.5 font-display text-base font-semibold text-white">
                      {prog.displayName}
                    </h2>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mist/80">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} className="text-gold-2" />
                        {prog.city ? `${prog.city}, ` : ''}{prog.province}
                      </span>
                      {prog.duration && <span>Duration: {prog.duration}</span>}
                      {prog.intake && <span>Intake: {prog.intake}</span>}
                      {prog.tuitionStandardCNYPerYear && (
                        <span>
                          Tuition: {hasMin0 ? '0' : fmtCNY(prog.tuitionStandardCNYPerYear)}/yr
                        </span>
                      )}
                    </div>

                    {/* Majors snippet */}
                    {prog.majors && prog.majors.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-medium text-mist/60">Majors ({prog.majors.length}):</span>
                        {prog.majors.slice(0, 3).map((m, idx) => (
                          <span
                            key={idx}
                            className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-mist"
                          >
                            {m}
                          </span>
                        ))}
                        {prog.majors.length > 3 && (
                          <span className="text-[11px] text-mist/60">
                            +{prog.majors.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
                    <a
                      href={`/programmes/${prog.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View live page on website"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-mist hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <ExternalLink size={15} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(prog)}
                      title="Duplicate programme"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-mist hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditProgram(prog)}
                      title="Edit programme"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/15 px-3 text-xs font-semibold text-gold-2 hover:bg-gold/25 transition-colors"
                    >
                      <Edit3 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(prog.id)}
                      title="Delete programme"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1f3f] p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400">
              <AlertCircle size={24} />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold text-white">Delete Programme?</h3>
            <p className="mt-2 text-sm text-mist/80">
              Are you sure you want to permanently delete programme <strong className="text-white">"{deleteConfirmId}"</strong>?
              This will update the active database immediately.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-mist hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProgram(deleteConfirmId)}
                disabled={loading}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD / EDIT PROGRAMME FULL MODAL */}
      {/* ------------------------------------------------------------- */}
      {editorOpen && editingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 sm:p-6 backdrop-blur-md">
          <div className="my-8 w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0d1f3f] p-6 sm:p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display text-2xl font-semibold text-white">
                  {isNew ? 'Add New Programme' : `Edit Programme (${editingProgram.id})`}
                </h3>
                <p className="mt-0.5 text-xs text-mist/75">
                  Changes are persisted directly to the website catalog.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-lg p-2 text-mist hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProgram} className="mt-6 space-y-6">
              {/* Row 1: Level, ID, Title */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-mist">
                    Degree Level *
                  </label>
                  <select
                    value={editingProgram.level || 'Bachelor'}
                    onChange={(e) => setEditingProgram({ ...editingProgram, level: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
                  >
                    <option value="Bachelor">Bachelor</option>
                    <option value="MBBS">MBBS</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                    <option value="Language">Chinese Language</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-mist">
                    ID {isNew ? '(Leave blank to auto-generate)' : '*'}
                  </label>
                  <input
                    type="text"
                    value={editingProgram.id || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, id: e.target.value })}
                    placeholder="e.g. B-43 or M-07"
                    disabled={!isNew}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-mist/40 disabled:opacity-60 focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-mist">
                    Custom URL Slug (optional)
                  </label>
                  <input
                    type="text"
                    value={editingProgram.slug || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, slug: e.target.value })}
                    placeholder="auto-generated if empty"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-mist/40 focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-mist">
                  Display Name / Headline *
                </label>
                <input
                  type="text"
                  required
                  value={editingProgram.displayName || ''}
                  onChange={(e) => setEditingProgram({ ...editingProgram, displayName: e.target.value })}
                  placeholder="e.g. Bachelor programme in Beijing"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
                />
              </div>

              {/* Row 2: Location */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-mist">
                    Province *
                  </label>
                  <select
                    value={editingProgram.province || 'Jiangsu'}
                    onChange={(e) => setEditingProgram({ ...editingProgram, province: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
                  >
                    {PROVINCE_NAMES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-mist">
                    City (optional)
                  </label>
                  <input
                    type="text"
                    value={editingProgram.city || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, city: e.target.value })}
                    placeholder="e.g. Nanjing, Beijing, Chengdu"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Academics & Duration */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-mist">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={editingProgram.duration || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, duration: e.target.value })}
                    placeholder="e.g. 4 years, 5+1 years"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-mist">
                    Intake
                  </label>
                  <input
                    type="text"
                    value={editingProgram.intake || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, intake: e.target.value })}
                    placeholder="e.g. September 2026"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-mist">
                    Typical Deadline Month
                  </label>
                  <input
                    type="text"
                    value={editingProgram.typicalDeadlineMonth || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, typicalDeadlineMonth: e.target.value })}
                    placeholder="e.g. June, July"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Majors Editor */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-mist">
                  Offered Majors / Specializations
                </label>
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
                    placeholder="Type a major name and press Enter (e.g. Computer Science)"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white focus:border-gold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addMajor}
                    className="rounded-xl bg-gold/20 px-4 py-2 text-xs font-semibold text-gold-2 hover:bg-gold/30"
                  >
                    + Add Major
                  </button>
                </div>

                {/* Majors pills */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {(editingProgram.majors || []).map((m, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs text-white"
                    >
                      <span>{m}</span>
                      <button
                        type="button"
                        onClick={() => removeMajor(idx)}
                        className="text-mist hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {(!editingProgram.majors || editingProgram.majors.length === 0) && (
                    <span className="text-xs text-mist/50">No majors added yet.</span>
                  )}
                </div>
              </div>

              {/* Row 4: Scholarships & Financials */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <span className="block text-xs font-bold uppercase tracking-wider text-gold-2">
                  Financials & Scholarship
                </span>

                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs text-mist">Standard Tuition (CNY/year)</label>
                    <input
                      type="number"
                      value={editingProgram.tuitionStandardCNYPerYear ?? ''}
                      onChange={(e) =>
                        setEditingProgram({
                          ...editingProgram,
                          tuitionStandardCNYPerYear: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="e.g. 20000"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-mist">Min Tuition (0 if scholarship makes free)</label>
                    <input
                      type="number"
                      value={editingProgram.tuitionMinCNYPerYear ?? ''}
                      onChange={(e) =>
                        setEditingProgram({
                          ...editingProgram,
                          tuitionMinCNYPerYear: e.target.value !== '' ? Number(e.target.value) : 0,
                        })
                      }
                      placeholder="0"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-mist">Monthly Stipend (CNY/month)</label>
                    <input
                      type="number"
                      value={editingProgram.stipendCNYPerMonth ?? ''}
                      onChange={(e) =>
                        setEditingProgram({
                          ...editingProgram,
                          stipendCNYPerMonth: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="e.g. 2500, 3000, 3500"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-5">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={!!editingProgram.fullyFunded}
                      onChange={(e) => setEditingProgram({ ...editingProgram, fullyFunded: e.target.checked })}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-gold focus:ring-0"
                    />
                    <span>Fully Funded (CSC / University scholarship)</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={!!editingProgram.noIeltsRequired}
                      onChange={(e) => setEditingProgram({ ...editingProgram, noIeltsRequired: e.target.checked })}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-gold focus:ring-0"
                    />
                    <span>No IELTS Required (English Proficiency Letter accepted)</span>
                  </label>
                </div>
              </div>

              {/* Status Note */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-mist">
                  University Accreditation / Status Note
                </label>
                <input
                  type="text"
                  value={editingProgram.status || ''}
                  onChange={(e) => setEditingProgram({ ...editingProgram, status: e.target.value })}
                  placeholder="e.g. 211, 985 and Double First Class University"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-mist hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-gold px-6 py-2.5 font-semibold text-navy shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Saving...' : isNew ? 'Create Programme' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
