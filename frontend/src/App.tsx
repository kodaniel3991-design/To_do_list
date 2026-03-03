import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Task, Status, Role, NewTaskPayload } from './types';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import KanbanBoard from './components/KanbanBoard';
import NewTaskModal from './components/NewTaskModal';

const API = '/api';
const SOCKET_URL = 'http://localhost:3001';

let socket: Socket | null = null;

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [selectedRole, setSelectedRole] = useState<Role | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [connected, setConnected] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetch(`${API}/tasks`)
      .then(r => r.json())
      .then(setTasks)
      .catch(console.error);

    fetch(`${API}/projects`)
      .then(r => r.json())
      .then(setProjects)
      .catch(console.error);
  }, []);

  // Socket.io
  useEffect(() => {
    socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('task:created', (task: Task) => {
      setTasks(prev => [task, ...prev]);
    });

    socket.on('task:updated', (updated: Task) => {
      setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    });

    socket.on('task:deleted', ({ id }: { id: string }) => {
      setTasks(prev => prev.filter(t => t.id !== id));
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  const handleStatusChange = useCallback(async (id: string, status: Status) => {
    try {
      const res = await fetch(`${API}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update task');
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`${API}/tasks/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleCreate = useCallback(async (payload: NewTaskPayload) => {
    try {
      await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (selectedProject !== 'All Projects' && t.project !== selectedProject) return false;
    if (selectedRole !== 'all' && t.role !== selectedRole) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header tasks={filteredTasks} connected={connected} onNewTask={() => setShowModal(true)} />
      <FilterBar
        projects={projects}
        selectedProject={selectedProject}
        selectedRole={selectedRole}
        onProjectChange={setSelectedProject}
        onRoleChange={setSelectedRole}
      />
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          tasks={filteredTasks}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </div>

      {showModal && (
        <NewTaskModal
          projects={projects.length > 0 ? projects : ['TaskForce AI']}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
