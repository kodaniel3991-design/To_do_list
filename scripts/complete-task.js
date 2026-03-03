#!/usr/bin/env node
/**
 * 태스크 완료 처리 (상태 변경 + 코멘트 추가)
 * 사용법: node scripts/complete-task.js {TASK_ID} {AGENT_NAME} "완료 메시지"
 * 예시:  node scripts/complete-task.js abc-123 claude-backend "API 엔드포인트 구현 완료"
 */
const API = 'http://localhost:3001';

async function main() {
  const [,, taskId, agentName, message = '작업 완료'] = process.argv;
  if (!taskId || !agentName) {
    console.error('사용법: node scripts/complete-task.js {TASK_ID} {AGENT_NAME} "완료 메시지"');
    process.exit(1);
  }

  // 1. 상태를 done으로 변경
  const res = await fetch(`${API}/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'done', agentName }),
  }).catch(() => null);

  if (!res) return console.error('❌ 백엔드 서버에 연결할 수 없습니다');
  if (!res.ok) return console.error('❌ 상태 변경 실패:', await res.json());

  // 2. 완료 코멘트 추가
  await fetch(`${API}/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message, author: agentName }),
  });

  const task = await res.json();
  console.log(`✅ 완료 처리: [${task.role}] ${task.title}`);
  console.log(`   ${agentName}: "${message}"`);
}

main();
