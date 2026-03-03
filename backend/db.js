const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const DB_PATH = path.join(__dirname, 'taskforce.db');
const db = new Database(DB_PATH);

// ─── 성능 설정 ────────────────────────────────────────────────────────────
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── 스키마 ───────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'todo',
    priority    TEXT NOT NULL DEFAULT 'medium',
    project     TEXT NOT NULL,
    role        TEXT NOT NULL,
    agent_name  TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS comments (
    id         TEXT PRIMARY KEY,
    task_id    TEXT NOT NULL,
    text       TEXT NOT NULL,
    author     TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS status_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id     TEXT NOT NULL,
    from_status TEXT NOT NULL,
    to_status   TEXT NOT NULL,
    changed_by  TEXT NOT NULL,
    changed_at  TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );
`);

// ─── 시드 데이터 (DB가 비어있을 때만) ─────────────────────────────────────
const isEmpty = db.prepare('SELECT COUNT(*) as cnt FROM tasks').get().cnt === 0;
if (isEmpty) {
  const seedProjects = ['TaskForce AI', 'E-Commerce', 'Mobile App'];
  const insertProject = db.prepare('INSERT OR IGNORE INTO projects (name) VALUES (?)');
  seedProjects.forEach(p => insertProject.run(p));

  const seedTasks = [
    { title: '백엔드 API 엔드포인트 통합 테스트', priority: 'critical', project: 'TaskForce AI', role: 'test',     status: 'done', agentName: 'claude-test-backend',  hoursAgo: 25, commentCount: 4 },
    { title: '프론트엔드 페이지 렌더링 및 라우팅 테스트',  priority: 'critical', project: 'TaskForce AI', role: 'test',     status: 'done', agentName: 'claude-test-frontend', hoursAgo: 25, commentCount: 4 },
    { title: '보안 이슈 수정 (HIGH+MEDIUM 6건)',        priority: 'critical', project: 'TaskForce AI', role: 'backend',  status: 'done', agentName: 'claude-security',      hoursAgo: 26, commentCount: 4 },
    { title: '[BUG] 프론트엔드 AI API 호출 시 Authorization 헤더 누락', priority: 'critical', project: 'TaskForce AI', role: 'frontend', status: 'done', agentName: 'claude-frontend', hoursAgo: 27, commentCount: 3 },
    { title: 'WebSocket 실시간 협업 시스템 구현',        priority: 'high',     project: 'TaskForce AI', role: 'backend',  status: 'done', agentName: 'claude-backend',      hoursAgo: 30, commentCount: 5 },
    { title: '칸반 보드 UI 컴포넌트 개발',              priority: 'high',     project: 'TaskForce AI', role: 'frontend', status: 'done', agentName: 'claude-frontend',     hoursAgo: 32, commentCount: 2 },
    { title: 'CI/CD 파이프라인 설정',                  priority: 'medium',   project: 'TaskForce AI', role: 'devops',   status: 'done', agentName: 'claude-devops',       hoursAgo: 35, commentCount: 1 },
  ];

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, project, role, agent_name, created_at, updated_at)
    VALUES (@id, @title, @description, @status, @priority, @project, @role, @agentName, @createdAt, @updatedAt)
  `);
  const insertComment = db.prepare(`
    INSERT INTO comments (id, task_id, text, author, created_at) VALUES (@id, @taskId, @text, @author, @createdAt)
  `);
  const insertHistory = db.prepare(`
    INSERT INTO status_history (task_id, from_status, to_status, changed_by, changed_at)
    VALUES (@taskId, @from, @to, @by, @at)
  `);

  const now = Date.now();
  for (const s of seedTasks) {
    const id = uuidv4();
    const createdAt = new Date(now - s.hoursAgo * 3600000).toISOString();
    insertTask.run({ id, title: s.title, description: '', status: s.status, priority: s.priority, project: s.project, role: s.role, agentName: s.agentName, createdAt, updatedAt: createdAt });
    for (let i = 0; i < s.commentCount; i++) {
      insertComment.run({ id: uuidv4(), taskId: id, text: `Comment ${i + 1}`, author: s.agentName, createdAt: new Date(now - (s.hoursAgo - i) * 3600000).toISOString() });
    }
    insertHistory.run({ taskId: id, from: 'todo', to: s.status, by: s.agentName, at: createdAt });
  }
}

// ─── Helper: task 행을 클라이언트 형식으로 변환 ────────────────────────────
function rowToTask(row) {
  const comments = db.prepare('SELECT id, text, author, created_at as createdAt FROM comments WHERE task_id = ? ORDER BY created_at ASC').all(row.id);
  const statusHistory = db.prepare('SELECT from_status as "from", to_status as "to", changed_by as "by", changed_at as "at" FROM status_history WHERE task_id = ? ORDER BY changed_at ASC').all(row.id);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    project: row.project,
    role: row.role,
    agentName: row.agent_name,
    comments,
    statusHistory,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── DB 함수들 ─────────────────────────────────────────────────────────────

function getProjects() {
  return db.prepare('SELECT name FROM projects ORDER BY id').all().map(r => r.name);
}

function getTasks({ project, role, status } = {}) {
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];
  if (project && project !== 'All Projects') { sql += ' AND project = ?'; params.push(project); }
  if (role && role !== 'all')                 { sql += ' AND role = ?';    params.push(role); }
  if (status)                                 { sql += ' AND status = ?';  params.push(status); }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params).map(rowToTask);
}

function getTask(id) {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return row ? rowToTask(row) : null;
}

function createTask({ title, description = '', priority = 'medium', project = 'TaskForce AI', role = 'backend' }) {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, project, role, agent_name, created_at, updated_at)
    VALUES (?, ?, ?, 'todo', ?, ?, ?, NULL, ?, ?)
  `).run(id, title, description, priority, project, role, now, now);

  // 프로젝트 자동 등록
  db.prepare('INSERT OR IGNORE INTO projects (name) VALUES (?)').run(project);

  return getTask(id);
}

function updateTask(id, { status, agentName, title, description, priority, role }) {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) return null;

  if (status && status !== task.status) {
    db.prepare(`
      INSERT INTO status_history (task_id, from_status, to_status, changed_by, changed_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, task.status, status, agentName ?? task.agent_name ?? 'unknown', new Date().toISOString());
  }

  const fields = [];
  const values = [];
  if (status      !== undefined) { fields.push('status = ?');      values.push(status); }
  if (agentName   !== undefined) { fields.push('agent_name = ?');  values.push(agentName); }
  if (title       !== undefined) { fields.push('title = ?');       values.push(title); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (priority    !== undefined) { fields.push('priority = ?');    values.push(priority); }
  if (role        !== undefined) { fields.push('role = ?');        values.push(role); }

  if (fields.length > 0) {
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
  }

  return getTask(id);
}

function deleteTask(id) {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}

function addComment(taskId, { text, author = 'user' }) {
  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
  if (!task) return null;

  const id = uuidv4();
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO comments (id, task_id, text, author, created_at) VALUES (?, ?, ?, ?, ?)').run(id, taskId, text, author, createdAt);
  db.prepare('UPDATE tasks SET updated_at = ? WHERE id = ?').run(createdAt, taskId);

  return { id, text, author, createdAt };
}

module.exports = { getProjects, getTasks, getTask, createTask, updateTask, deleteTask, addComment };
