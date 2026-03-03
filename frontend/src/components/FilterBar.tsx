import { Role } from '../types';

const ROLES: { label: string; value: Role | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'backend', value: 'backend' },
  { label: 'frontend', value: 'frontend' },
  { label: 'test', value: 'test' },
  { label: 'devops', value: 'devops' },
];

interface Props {
  projects: string[];
  selectedProject: string;
  selectedRole: Role | 'all';
  onProjectChange: (p: string) => void;
  onRoleChange: (r: Role | 'all') => void;
}

export default function FilterBar({
  projects,
  selectedProject,
  selectedRole,
  onProjectChange,
  onRoleChange,
}: Props) {
  return (
    <div className="flex items-center gap-4 px-6 py-2.5 bg-gray-900 border-b border-gray-800">
      {/* Project dropdown */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Project:</span>
        <select
          value={selectedProject}
          onChange={e => onProjectChange(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-md px-2.5 py-1 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="All Projects">All Projects</option>
          {projects.map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Role tabs */}
      <div className="flex items-center gap-1 text-sm">
        <span className="text-gray-400 mr-1">Role:</span>
        {ROLES.map(r => (
          <button
            key={r.value}
            onClick={() => onRoleChange(r.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedRole === r.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
