#!/usr/bin/env node
/**
 * Claude Code TodoWrite Hook → TaskForce.AI 자동 동기화
 *
 * Claude가 TodoWrite를 호출할 때마다 TaskForce 보드에 태스크를 자동 생성/업데이트합니다.
 * .claude/settings.json의 PostToolUse 훅에서 호출됩니다.
 *
 * 상태 매핑:
 *   Claude pending    → TaskForce todo
 *   Claude in_progress → TaskForce in_progress
 *   Claude completed  → TaskForce done
 */
const API = 'http://localhost:3001';
const fs = require('fs');
const path = require('path');

const MAP_FILE = path.join(__dirname, '.todo-task-map.json');

const STATUS_MAP = {
  pending:     'todo',
  in_progress: 'in_progress',
  completed:   'done',
};

function loadMap() {
  try { return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')); }
  catch { return {}; }
}

function saveMap(map) {
  try { fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2)); }
  catch { /* 저장 실패 무시 */ }
}

async function syncTodo(todo, map) {
  const tfStatus = STATUS_MAP[todo.status];
  if (!tfStatus) return;

  const existingId = map[todo.content];

  if (existingId) {
    // 기존 태스크 상태 업데이트
    await fetch(`${API}/api/tasks/${existingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: tfStatus, agentName: 'claude-code' }),
    }).catch(() => null);
  } else {
    // 새 태스크 생성 (status는 일단 todo로 생성됨)
    const res = await fetch(`${API}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: todo.content,
        priority: 'medium',
        project: 'Claude Session',
        role: 'all',
      }),
    }).catch(() => null);

    if (res && res.ok) {
      const task = await res.json();
      map[todo.content] = task.id;

      // todo가 아닌 상태면 바로 업데이트
      if (tfStatus !== 'todo') {
        await fetch(`${API}/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: tfStatus, agentName: 'claude-code' }),
        }).catch(() => null);
      }
    }
  }
}

async function main() {
  const input = await new Promise(resolve => {
    let buf = '';
    process.stdin.on('data', chunk => { buf += chunk; });
    process.stdin.on('end', () => resolve(buf));
    setTimeout(() => resolve(buf), 5000);
  });

  try {
    const data = JSON.parse(input);
    const todos = data.tool_input?.todos ?? [];
    if (!todos.length) return;

    const map = loadMap();
    await Promise.all(todos.map(todo => syncTodo(todo, map)));
    saveMap(map);
  } catch {
    // 백엔드 미실행 등 에러는 조용히 무시 — Claude 작업 방해 안 함
  }
}

main().catch(() => {});
