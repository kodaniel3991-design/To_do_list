import { Task } from '../types';

interface Props {
  tasks: Task[];
  connected: boolean;
  onNewTask: () => void;
}

export default function Header({ tasks, connected, onNewTask }: Props) {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const active = tasks.filter(t => t.status !== 'done' && t.status !== 'todo').length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-white">
          TaskForce<span className="text-blue-400">.AI</span>
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}
          />
          <span className={`text-xs font-medium ${connected ? 'text-green-400' : 'text-gray-500'}`}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-gray-400">
        <span>
          Total: <strong className="text-white">{total}</strong>
        </span>
        <span>
          Active: <strong className="text-yellow-400">{active}</strong>
        </span>
        <span>
          Done: <strong className="text-green-400">{done}</strong>
        </span>
        <span>
          Rate: <strong className="text-blue-400">{rate}%</strong>
        </span>
      </div>

      {/* New Task */}
      <button
        onClick={onNewTask}
        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        New Task
      </button>
    </header>
  );
}
