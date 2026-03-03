export type Status = 'todo' | 'claimed' | 'in_progress' | 'review' | 'done';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Role = 'backend' | 'frontend' | 'test' | 'devops' | 'all';

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface StatusChange {
  from: string;
  to: string;
  by: string;
  at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  project: string;
  role: Role;
  agentName: string | null;
  comments: Comment[];
  statusHistory: StatusChange[];
  createdAt: string;
  updatedAt: string;
}

export interface NewTaskPayload {
  title: string;
  description?: string;
  priority: Priority;
  project: string;
  role: Role;
}
