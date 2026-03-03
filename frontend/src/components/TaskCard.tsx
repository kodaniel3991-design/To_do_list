import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task, Status } from '../types';


const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-gray-500 text-white',
};

const ROLE_COLORS: Record<string, string> = {
  backend: 'bg-purple-600 text-white',
  frontend: 'bg-blue-600 text-white',
  test: 'bg-pink-600 text-white',
  devops: 'bg-teal-600 text-white',
  all: 'bg-gray-600 text-white',
};

const STATUS_OPTIONS: { label: string; value: Status }[] = [
  { label: 'To Do', value: 'todo' },
  { label: 'Claimed', value: 'claimed' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Review', value: 'review' },
  { label: 'Done', value: 'done' },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  task: Task;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onOpen: (task: Task) => void;
}

export default function TaskCard({ task, isDragging, onDragStart, onDragEnd, onStatusChange, onDelete, onOpen }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const draggedRef = useRef(false);
  const lastChange = task.statusHistory[task.statusHistory.length - 1];

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  function handleMoveClick() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setMenuOpen(v => !v);
  }

  return (
    <div
      draggable
      onDragStart={() => { draggedRef.current = true; onDragStart(); }}
      onDragEnd={() => { onDragEnd(); setTimeout(() => { draggedRef.current = false; }, 0); }}
      onClick={() => { if (!draggedRef.current) onOpen(task); }}
      className={`bg-gray-800 border rounded-lg p-3 group relative transition-all cursor-grab active:cursor-grabbing
        ${isDragging
          ? 'opacity-40 scale-95 border-blue-500'
          : 'border-gray-700 hover:border-gray-600 hover:bg-gray-750'
        }`}
    >
      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(task.id); }}
        className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
        title="Delete"
      >
        ✕
      </button>

      {/* Title + Priority */}
      <div className="flex items-start gap-2 pr-4 mb-2">
        <p className="text-sm text-gray-100 leading-snug flex-1">{task.title}</p>
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ${PRIORITY_COLORS[task.priority]}`}
        >
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
      </div>

      {/* Role tag */}
      <div className="mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[task.role]}`}>
          {task.role}
        </span>
      </div>

      {/* Status history */}
      {lastChange && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{task.comments.length}</span>
          <span className="mx-1">·</span>
          <span>Status changed to {lastChange.to.toUpperCase().replace('_', ' ')}</span>
        </div>
      )}

      {/* Agent + Time + Status menu */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-500">
          {task.agentName && <span className="text-gray-400">{task.agentName}</span>}
          <span className="ml-1">{timeAgo(task.updatedAt)}</span>
        </div>

        {/* Status change button */}
        <div>
          <button
            ref={btnRef}
            onClick={e => { e.stopPropagation(); handleMoveClick(); }}
            className="text-xs text-gray-500 hover:text-blue-400 transition-colors px-2 py-0.5 rounded border border-gray-700 hover:border-blue-500"
          >
            Move ▾
          </button>
          {menuOpen && menuPos && createPortal(
            <div
              style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
              className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[130px]"
            >
              {STATUS_OPTIONS.filter(s => s.value !== task.status).map(s => (
                <button
                  key={s.value}
                  onClick={() => {
                    onStatusChange(task.id, s.value);
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  → {s.label}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
}
