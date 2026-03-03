#!/usr/bin/env node
/**
 * TaskForce 태스크 목록 조회
 * 사용법: node scripts/list-tasks.js [status] [role]
 * 예시:  node scripts/list-tasks.js todo backend
 */
const API = 'http://localhost:3001';

async function main() {
  const [,, status, role] = process.argv;
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (role)   params.set('role', role);

  const url = `${API}/api/tasks${params.size ? '?' + params : ''}`;
  const res = await fetch(url).catch(() => null);
  if (!res) return console.error('❌ 백엔드 서버에 연결할 수 없습니다 (http://localhost:3001)');

  const tasks = await res.json();
  if (!tasks.length) return console.log('📭 해당하는 태스크가 없습니다.');

  const STATUS_ICON = { todo: '⬜', claimed: '🔵', in_progress: '🟡', review: '🟣', done: '✅' };
  const PRIORITY_ICON = { critical: '🔴', high: '🟠', medium: '🟡', low: '⚪' };

  console.log(`\n📋 TaskForce 태스크 목록 (${tasks.length}건)\n`);
  tasks.forEach(t => {
    const s = STATUS_ICON[t.status] ?? '❓';
    const p = PRIORITY_ICON[t.priority] ?? '';
    const agent = t.agentName ? ` [${t.agentName}]` : '';
    console.log(`${s} ${p} [${t.role}] ${t.title}${agent}`);
    console.log(`   ID: ${t.id}`);
  });
  console.log();
}

main();
