#!/usr/bin/env node
/**
 * 태스크 상태 업데이트
 * 사용법: node scripts/update-task.js {TASK_ID} {STATUS} {AGENT_NAME} ["메시지"]
 * 예시:  node scripts/update-task.js abc-123 in_progress claude-backend "작업 시작"
 * status: todo | claimed | in_progress | review | done
 */
const API = 'http://localhost:3001';

async function main() {
  const [,, taskId, status, agentName, message] = process.argv;
  if (!taskId || !status || !agentName) {
    console.error('사용법: node scripts/update-task.js {TASK_ID} {STATUS} {AGENT_NAME} ["메시지"]');
    process.exit(1);
  }

  const res = await fetch(`${API}/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, agentName }),
  }).catch(() => null);

  if (!res) return console.error('❌ 백엔드 서버에 연결할 수 없습니다');
  if (!res.ok) return console.error('❌ 실패:', await res.json());

  const task = await res.json();
  console.log(`🔄 상태 변경: ${task.title}`);
  console.log(`   ${agentName}: ${status}`);

  if (message) {
    await fetch(`${API}/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message, author: agentName }),
    });
    console.log(`   💬 코멘트: "${message}"`);
  }
}

main();
