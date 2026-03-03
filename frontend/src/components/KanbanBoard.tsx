import { useState } from 'react';
import { Task, Status } from '../types';
import TaskCard from './TaskCard';

const COLUMNS: { id: Status; label: string; headerBg: string }[] = [
  { id: 'todo',        label: 'To Do',       headerBg: 'bg-gray-700' },
  { id: 'claimed',     label: 'Claimed',     headerBg: 'bg-blue-600' },
  { id: 'in_progress', label: 'In Progress', headerBg: 'bg-yellow-500' },
  { id: 'review',      label: 'Review',      headerBg: 'bg-purple-500' },
  { id: 'done',        label: 'Done',        headerBg: 'bg-green-600' },
];

interface Props {
  tasks: Task[];
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
}

export default function KanbanBoard({ tasks, onStatusChange, onDelete }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);

  function handleDrop(colId: Status) {
    if (draggingId) {
      const task = tasks.find(t => t.id === draggingId);
      if (task && task.status !== colId) {
        onStatusChange(draggingId, colId);
      }
    }
    setDraggingId(null);
    setDragOverCol(null);
  }

  return (
    <div className="flex gap-4 p-4 overflow-x-auto h-full">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        const isOver = dragOverCol === col.id;
        return (
          <div key={col.id} className="flex flex-col flex-1 min-w-[220px]">
            {/* Column header */}
            <div
              className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${col.headerBg} mb-0.5`}
            >
              <span className="text-sm font-semibold text-white">{col.label}</span>
              <span className="text-xs font-bold bg-black/20 text-white px-2 py-0.5 rounded-full">
                {colTasks.length}
              </span>
            </div>

            {/* Cards — drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
              onDragLeave={e => {
                // only clear if leaving the column body itself (not a child)
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverCol(null);
                }
              }}
              onDrop={() => handleDrop(col.id)}
              className={`flex-1 border-x border-b rounded-b-lg p-2 overflow-y-auto max-h-[calc(100vh-200px)] flex flex-col gap-2 transition-colors
                ${isOver
                  ? 'bg-gray-800 border-blue-500 ring-1 ring-inset ring-blue-500'
                  : 'bg-gray-900 border-gray-800'
                }`}
            >
              {colTasks.length === 0 ? (
                <div className={`flex items-center justify-center h-20 text-sm transition-colors ${isOver ? 'text-blue-400' : 'text-gray-600'}`}>
                  {isOver ? 'Drop here' : 'No tasks'}
                </div>
              ) : (
                colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isDragging={draggingId === task.id}
                    onDragStart={() => setDraggingId(task.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
