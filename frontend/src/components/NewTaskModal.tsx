import { useState } from 'react';
import { NewTaskPayload, Priority, Role } from '../types';

const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];
const ROLES: Role[] = ['backend', 'frontend', 'test', 'devops'];

interface Props {
  projects: string[];
  onClose: () => void;
  onCreate: (payload: NewTaskPayload) => void;
}

export default function NewTaskModal({ projects, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [project, setProject] = useState(projects[0] ?? 'TaskForce AI');
  const [role, setRole] = useState<Role>('backend');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({ title: title.trim(), description, priority, project, role });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">New Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Priority + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Project</label>
            <select
              value={project}
              onChange={e => setProject(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {projects.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
