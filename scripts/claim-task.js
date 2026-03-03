#!/usr/bin/env node
/**
 * 태스크 클레임 (작업 시작 선언)
 * 사용법: node scripts/claim-task.js {TASK_ID} {AGENT_NAME}
 * 예시:  node scripts/claim-task.js abc-123 claude-backend
 */
const API = 'http://localhost:3001';

async function main() {
  const [,, taskId, agentName] = process.argv;
  if (!taskId || !agentName) {
    console.error('사용법: node scripts/claim-task.js {TASK_ID} {AGENT_NAME}');
    process.exit(1);
  }

  const res = await fetch(`${API}/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'claimed', agentName }),
  }).catch(() => null);

  if (!res) return console.error('❌ 백엔드 서버에 연결할 수 없습니다');
  if (!res.ok) return console.error('❌ 실패:', await res.json());

  const task = await res.json();
  console.log(`✅ 클레임 완료: [${task.role}] ${task.title}`);
  console.log(`   담당: ${task.agentName} → 상태: ${task.status}`);
}

main();
