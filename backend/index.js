const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST', 'PATCH', 'DELETE'] }
});

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// ─── Routes ────────────────────────────────────────────────────────────────

app.get('/api/projects', (_req, res) => {
  res.json(db.getProjects());
});

app.get('/api/tasks', (req, res) => {
  res.json(db.getTasks(req.query));
});

app.post('/api/tasks', (req, res) => {
  const { title, description, priority, project, role } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const task = db.createTask({ title, description, priority, project, role });
  io.emit('task:created', task);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const task = db.updateTask(req.params.id, req.body);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  io.emit('task:updated', task);
  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const ok = db.deleteTask(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Task not found' });

  io.emit('task:deleted', { id: req.params.id });
  res.json({ ok: true });
});

app.post('/api/tasks/:id/comments', (req, res) => {
  const { text, author } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  const comment = db.addComment(req.params.id, { text, author });
  if (!comment) return res.status(404).json({ error: 'Task not found' });

  const task = db.getTask(req.params.id);
  io.emit('task:updated', task);
  res.status(201).json(comment);
});

// ─── Socket.io ─────────────────────────────────────────────────────────────
io.on('connection', socket => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// ─── Start ─────────────────────────────────────────────────────────────────
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`TaskForce backend running on http://localhost:${PORT}`);
});
