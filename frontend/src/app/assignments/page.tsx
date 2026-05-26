'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Filter, Search, MoreVertical, Eye, Trash2, ClipboardX, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../hooks/useTypedSelector';
import { loadAssignments, removeAssignment } from '../../store/slices/assignmentsSlice';
import type { Assignment } from '../../types';
import { format } from 'date-fns';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
      <div className="w-[100px] h-[100px] rounded-full bg-orange-50 flex items-center justify-center mb-6">
        <ClipboardX size={40} className="text-orange-500 opacity-50" />
      </div>
      <h3 className="text-[17px] font-semibold text-[#1A1A1A] mb-2">No assignments yet</h3>
      <p className="text-[13px] text-[#6B6B6B] max-w-[320px] leading-relaxed mb-6">
        Create your first assignment to start collecting and grading student submissions. Let AI assist with question generation.
      </p>
      <Link href="/assignments/create" className="btn-primary">
        <Plus size={14} /> Create Your First Assignment
      </Link>
    </div>
  );
}

function AssignmentCard({ assignment, onDelete }: { assignment: Assignment; onDelete: (id: string) => void }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const statusColor = {
    completed: 'bg-green-100 text-green-700',
    processing: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  }[assignment.status];

  const createdAt = (() => {
    try { return format(new Date(assignment.createdAt), 'dd-MM-yyyy'); } catch { return '—'; }
  })();

  return (
    <div
      className="bg-white border border-[#E2E0DA] rounded-[14px] p-[18px] cursor-pointer hover:border-orange-500 hover:shadow-md hover:-translate-y-px transition-all duration-150 relative"
      onClick={() => assignment.status === 'completed' && router.push(`/assignments/${assignment._id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-2">
          <h4 className="text-[14px] font-semibold text-[#1A1A1A] leading-snug">{assignment.title}</h4>
          <p className="text-[12px] text-[#9A9A9A] mt-0.5">{assignment.subject} · {assignment.className}</p>
        </div>
        <div className="relative flex-shrink-0">
          <button
            className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#6B6B6B] hover:bg-[#F5F4F0] hover:text-[#1A1A1A] transition-all border-none bg-transparent cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          >
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
              <div className="absolute top-full right-0 mt-1 bg-white border border-[#E2E0DA] rounded-[10px] shadow-md z-20 min-w-[140px] p-1">
                {assignment.status === 'completed' && (
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#1A1A1A] rounded-[6px] hover:bg-[#F5F4F0] transition-colors cursor-pointer border-none bg-transparent text-left"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); router.push(`/assignments/${assignment._id}`); }}
                  >
                    <Eye size={13} /> View Paper
                  </button>
                )}
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-600 rounded-[6px] hover:bg-red-50 transition-colors cursor-pointer border-none bg-transparent text-left"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(assignment._id); }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-[11px] text-[#9A9A9A]">
          <span><span className="text-[#AAAAAA]">Assigned on</span> <span className="font-medium text-[#6B6B6B]">{createdAt}</span></span>
          {assignment.dueDate && <span><span className="text-[#AAAAAA]">Due</span> <span className="font-medium text-[#6B6B6B]">{assignment.dueDate}</span></span>}
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
          {assignment.status === 'processing' ? (
            <span className="flex items-center gap-1"><Loader2 size={9} className="animate-spin" /> Processing</span>
          ) : assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
        </span>
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.assignments);
  const [search, setSearch] = useState('');

  useEffect(() => { dispatch(loadAssignments()); }, [dispatch]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    await dispatch(removeAssignment(id));
    toast.success('Assignment deleted');
  };

  const filtered = items.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h1 className="text-[18px] font-semibold text-[#1A1A1A]">Assignments</h1>
          </div>
          <p className="text-[13px] text-[#6B6B6B]">Manage and create assignments for your classes.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-orange-500" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500 text-sm">{error}</div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-4">
            <button className="flex items-center gap-1.5 px-3 py-2 border border-[#D0CEC8] rounded-[10px] text-[12px] text-[#6B6B6B] cursor-pointer bg-white hover:border-[#bbb] hover:text-[#1A1A1A] transition-colors">
              <Filter size={13} /> Filter by
            </button>
            <div className="relative max-w-[300px] flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
              <input
                type="text"
                placeholder="Search Assignment"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-[#D0CEC8] rounded-[10px] text-[12px] bg-white outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-3.5 max-md:grid-cols-1 pb-20">
            {filtered.map((a) => (
              <AssignmentCard key={a._id} assignment={a} onDelete={handleDelete} />
            ))}
          </div>

          {/* Bottom bar */}
          <div className="fixed bottom-0 left-[220px] right-0 bg-white border-t border-[#E2E0DA] p-3 flex justify-center z-40 max-md:left-0">
            <Link href="/assignments/create" className="btn-primary">
              <Plus size={14} /> Create Assignment
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
