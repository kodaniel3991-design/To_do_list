import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Task, Status } from '../types';

const STATUS_OPTIONS: { label: string; value: Status }[] = [
  { label: 'To Do',       value: 'todo' },
  { label: 'Claimed',     value: 'claimed' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Review',      value: 'review' },
  { label: 'Done',        value: 'done' },
];

const STATUS_COLORS: Record<string, string> = {
  todo:        'bg-gray-600 text-white',
  claimed:     'bg-blue-600 text-white',
  in_progress: 'bg-yellow-500 text-black',
  review:      'bg-purple-600 text-white',
  done:        'bg-green-600 text-white',
};

const STATUS_DOT: Record<string, string> = {
  todo:        'bg-gray-400',
  claimed:     'bg-blue-400',
  in_progress: 'bg-yellow-400',
  review:      'bg-purple-400',
  done:        'bg-green-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  high:     'bg-orange-500 text-white',
  medium:   'bg-yellow-500 text-black',
  low:      'bg-gray-500 text-white',
};

const ROLE_COLORS: Record<string, string> = {
  backend:  'bg-purple-700 text-white',
  frontend: 'bg-blue-700 text-white',
  test:     'bg-pink-700 text-white',
  devops:   'bg-teal-700 text-white',
  all:      'bg-gray-700 text-white',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface Props {
  task: Task;
  onClose: () => void;
  onStatusChange: (id: string, status: Status) => void;
}

export default function TaskDetailModal({ task, onClose, onStatusChange }: Props) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  function handleStatusSelect(status: Status) {
    onStatusChange(task.id, status);
    setStatusMenuOpen(false);
  }

  const currentStatusLabel = STATUS_OPTIONS.find(s => s.value === task.status)?.label ?? task.status;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-start gap-3 p-5 border-b border-gray-800">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[task.role]}`}>
                {task.role}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                {task.project}
              </span>
            </div>
            {/* Title */}
            <h2 className="text-base font-semibold text-white leading-snug">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-lg leading-none mt-0.5 flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable Body ─────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Status + Agent */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[task.status]}`}>
                {currentStatusLabel}
              </span>
              {task.agentName && (
                <span className="text-xs text-gray-400">
                  · {task.agentName}
                </span>
              )}
            </div>
            {/* Status change */}
            <div className="relative">
              <button
                onClick={() => setStatusMenuOpen(v => !v)}
                className="text-xs text-gray-400 hover:text-blue-400 border border-gray-700 hover:border-blue-500 px-2.5 py-1 rounded transition-colors"
              >
                Move ▾
              </button>
              {statusMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[130px] z-10">
                  {STATUS_OPTIONS.filter(s => s.value !== task.status).map(s => (
                    <button
                      key={s.value}
                      onClick={() => handleStatusSelect(s.value)}
                      className="block w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      → {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5">Description</p>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Status History Timeline */}
          {task.statusHistory.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                Status History
              </p>
              <div className="space-y-0">
                {task.statusHistory.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${STATUS_DOT[h.to] ?? 'bg-gray-500'}`} />
                      {i < task.statusHistory.length - 1 && (
                        <div className="w-px flex-1 bg-gray-700 mt-1 mb-1 min-h-[16px]" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs text-gray-300">
                        <span className="text-gray-500">{h.from.replace('_', ' ')}</span>
                        <span className="text-gray-600 mx-1">→</span>
                        <span className="font-medium text-gray-200">{h.to.replace('_', ' ')}</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {h.by} · {timeAgo(h.at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
              Comments {task.comments.length > 0 && `(${task.comments.length})`}
            </p>
            {task.comments.length === 0 ? (
              <p className="text-xs text-gray-600 italic">No comments yet</p>
            ) : (
              <div className="space-y-2">
                {task.comments.map(c => (
                  <div key={c.id} className="bg-gray-800 rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-400">{c.author}</span>
                      <span className="text-xs text-gray-600">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-600">
          <span>Created {formatDate(task.createdAt)}</span>
          <span>Updated {formatDate(task.updatedAt)}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}