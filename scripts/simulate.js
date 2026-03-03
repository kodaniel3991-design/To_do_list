#!/usr/bin/env node
/**
 * TaskForce.AI 멀티 에이전트 시뮬레이션
 *
 * 시나리오: 쇼핑몰 "결제 시스템 v2.0" 개발
 * 에이전트: claude-backend, claude-frontend, claude-test, claude-devops
 *
 * 사용법: node scripts/simulate.js
 */
const API = 'http://localhost:3001';
const PROJECT = 'E-Commerce';

const COLORS = {
  reset:    '\x1b[0m',
  blue:     '\x1b[34m',
  green:    '\x1b[32m',
  yellow:   '\x1b[33m',
  cyan:     '\x1b[36m',
  magenta:  '\x1b[35m',
  red:      '\x1b[31m',
  gray:     '\x1b[90m',
  bold:     '\x1b[1m',
};

const AGENT_COLOR = {
  'claude-backend':  COLORS.blue,
  'claude-frontend': COLORS.cyan,
  'claude-test':     COLORS.green,
  'claude-devops':   COLORS.magenta,
};

const STATUS_ICON = {
  todo:        '⬜',
  claimed:     '🔵',
  in_progress: '🟡',
  review:      '🟣',
  done:        '✅',
};

function log(agent, icon, msg) {
  const color = AGENT_COLOR[agent] ?? COLORS.gray;
  const time  = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log(`${COLORS.gray}[${time}]${COLORS.reset} ${color}${COLORS.bold}${agent}${COLORS.reset}  ${icon} ${msg}`);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => null);
  if (!res || !res.ok) {
    console.error(`❌ API 오류: ${method} ${path}`);
    return null;
  }
  return res.json();
}

async function createTask({ title, description = '', priority, role }) {
  return api('POST', '/api/tasks', { title, description, priority, project: PROJECT, role });
}

async function move(taskId, status, agentName) {
  return api('PATCH', `/api/tasks/${taskId}`, { status, agentName });
}

async function comment(taskId, text, author) {
  return api('POST', `/api/tasks/${taskId}/comments`, { text, author });
}

// ─── 에이전트별 작업 시나리오 ────────────────────────────────────────────────

async function runBackendAgent(tasks) {
  const agent = 'claude-backend';

  // ─ Task 1: 결제 API
  log(agent, '🔵', `클레임: [${tasks.api.role}] ${tasks.api.title}`);
  await move(tasks.api.id, 'claimed', agent);
  await sleep(2000);

  log(agent, '🟡', '결제 API 설계 시작 — Stripe SDK 연동 검토 중');
  await move(tasks.api.id, 'in_progress', agent);
  await comment(tasks.api.id, 'Stripe SDK v5 연동 확인 완료. /api/payment/charge, /api/payment/refund 엔드포인트 설계 시작.', agent);
  await sleep(4000);

  // ─ Task 2: 웹훅 (동시 진행)
  log(agent, '🔵', `클레임: [${tasks.webhook.role}] ${tasks.webhook.title}`);
  await move(tasks.webhook.id, 'claimed', agent);
  await sleep(1500);
  await move(tasks.webhook.id, 'in_progress', agent);
  await comment(tasks.webhook.id, 'Stripe webhook 이벤트 처리 구현 시작. payment_intent.succeeded / payment_intent.failed 핸들러 작성 중.', agent);
  await sleep(3000);

  log(agent, '🟣', '결제 API 코드 리뷰 요청');
  await move(tasks.api.id, 'review', agent);
  await comment(tasks.api.id, '구현 완료. POST /api/payment/charge (idempotency key 적용), POST /api/payment/refund (7일 이내). 테스트 요청 드립니다.', agent);
  await sleep(2000);

  log(agent, '🟣', '웹훅 리뷰 요청');
  await move(tasks.webhook.id, 'review', agent);
  await comment(tasks.webhook.id, '웹훅 서명 검증 + 재시도 로직(exponential backoff) 구현 완료. 테스트 요청.', agent);
}

async function runFrontendAgent(tasks) {
  const agent = 'claude-frontend';
  await sleep(1500); // 백엔드 API 설계 후 시작

  log(agent, '🔵', `클레임: [${tasks.checkout.role}] ${tasks.checkout.title}`);
  await move(tasks.checkout.id, 'claimed', agent);
  await sleep(2000);

  log(agent, '🟡', '결제 UI 개발 시작');
  await move(tasks.checkout.id, 'in_progress', agent);
  await comment(tasks.checkout.id, 'CheckoutForm 컴포넌트 작성 시작. Stripe Elements 카드 입력 폼, 실시간 유효성 검사 적용 예정.', agent);
  await sleep(3500);

  log(agent, '🔵', `클레임: [${tasks.orderComplete.role}] ${tasks.orderComplete.title}`);
  await move(tasks.orderComplete.id, 'claimed', agent);
  await sleep(1000);
  await move(tasks.orderComplete.id, 'in_progress', agent);
  await comment(tasks.orderComplete.id, '주문 완료 페이지 개발 시작. 결제 성공/실패 분기 처리 + 주문 번호 표시 구현.', agent);
  await sleep(3000);

  log(agent, '🟣', '결제 UI 리뷰 요청');
  await move(tasks.checkout.id, 'review', agent);
  await comment(tasks.checkout.id, 'CheckoutForm, CardElement, PaymentSummary 컴포넌트 구현 완료. 로딩/에러 상태 처리 포함. 디자인 리뷰 요청.', agent);
  await sleep(1500);

  log(agent, '🟣', '주문완료 페이지 리뷰 요청');
  await move(tasks.orderComplete.id, 'review', agent);
  await comment(tasks.orderComplete.id, '성공/실패/취소 3가지 케이스 처리 완료. confetti 애니메이션 추가. 모바일 반응형 적용.', agent);
}

async function runTestAgent(tasks, waitMs) {
  const agent = 'claude-test';
  await sleep(waitMs); // 백엔드+프론트엔드 in_progress 이후 시작

  log(agent, '🔵', `클레임: [${tasks.apiTest.role}] ${tasks.apiTest.title}`);
  await move(tasks.apiTest.id, 'claimed', agent);
  await sleep(1500);

  log(agent, '🟡', 'API 테스트 시나리오 작성 중');
  await move(tasks.apiTest.id, 'in_progress', agent);
  await comment(tasks.apiTest.id, '테스트 케이스 설계: 정상결제(KRW/USD), 실패(잔액부족/카드만료), 환불, 중복결제 방지(idempotency) 총 24개.', agent);
  await sleep(3500);

  log(agent, '🔵', `클레임: [${tasks.e2e.role}] ${tasks.e2e.title}`);
  await move(tasks.e2e.id, 'claimed', agent);
  await sleep(1000);
  await move(tasks.e2e.id, 'in_progress', agent);
  await comment(tasks.e2e.id, 'Playwright E2E 시나리오 작성 시작. 결제 플로우 전체(장바구니 → 결제 → 주문완료) 자동화.', agent);
  await sleep(3000);

  log(agent, '🟣', 'API 테스트 완료 — 리뷰 요청');
  await move(tasks.apiTest.id, 'review', agent);
  await comment(tasks.apiTest.id, '24개 테스트 중 24개 통과 ✅. 커버리지 94%. 결제 API 검증 완료.', agent);

  log(agent, '✅', '결제 API 최종 승인');
  await move(tasks.apiTest.id, 'done', agent);
  await sleep(1000);

  log(agent, '🟣', 'E2E 테스트 완료 — 리뷰 요청');
  await move(tasks.e2e.id, 'review', agent);
  await comment(tasks.e2e.id, 'E2E 시나리오 8개 전부 통과. Chrome/Firefox/Safari 크로스 브라우저 검증 완료.', agent);
}

async function runDevopsAgent(tasks, waitMs) {
  const agent = 'claude-devops';
  await sleep(waitMs);

  log(agent, '🔵', `클레임: [${tasks.deploy.role}] ${tasks.deploy.title}`);
  await move(tasks.deploy.id, 'claimed', agent);
  await sleep(1500);

  log(agent, '🟡', 'CI/CD 파이프라인 설정 중');
  await move(tasks.deploy.id, 'in_progress', agent);
  await comment(tasks.deploy.id, 'GitHub Actions 워크플로 작성 시작. Staging 자동 배포 + Production 수동 승인 게이트 설계.', agent);
  await sleep(3500);

  log(agent, '🟣', '배포 파이프라인 리뷰 요청');
  await move(tasks.deploy.id, 'review', agent);
  await comment(tasks.deploy.id, 'Docker 이미지 빌드 + ECR 푸시 + ECS 롤링 배포 파이프라인 완성. Secrets Manager 연동으로 Stripe 키 보안 처리.', agent);
}

// ─── 최종 승인 (모든 리뷰 → done) ────────────────────────────────────────────

async function finalApproval(tasks) {
  await sleep(1000);
  const toClose = [tasks.api, tasks.webhook, tasks.checkout, tasks.orderComplete, tasks.e2e, tasks.deploy];
  for (const t of toClose) {
    const latest = await api('GET', `/api/tasks/${t.id}`);
    if (latest && latest.status !== 'done') {
      await move(t.id, 'done', 'claude-lead');
      await comment(t.id, '최종 검토 완료. 코드 품질 및 테스트 커버리지 기준 충족. 승인 ✅', 'claude-lead');
      log('claude-lead', '✅', `승인 완료: ${latest.title}`);
      await sleep(600);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. 백엔드 서버 확인
  const check = await api('GET', '/api/projects');
  if (!check) {
    console.error('❌ 백엔드 서버(http://localhost:3001)에 연결할 수 없습니다.\nnpm run dev 를 먼저 실행하세요.');
    process.exit(1);
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`${COLORS.bold}  🚀 TaskForce.AI 멀티 에이전트 시뮬레이션${COLORS.reset}`);
  console.log(`  시나리오: E-Commerce 결제 시스템 v2.0 개발`);
  console.log(`  에이전트: claude-backend / claude-frontend / claude-test / claude-devops`);
  console.log(`${'─'.repeat(60)}\n`);
  console.log(`  👉 브라우저에서 확인: ${COLORS.cyan}http://localhost:3000${COLORS.reset}`);
  console.log(`     → Project: ${COLORS.bold}E-Commerce${COLORS.reset} 선택\n`);

  await sleep(2000);

  // 2. 태스크 생성
  console.log(`${COLORS.gray}[태스크 생성 중...]${COLORS.reset}`);
  const [api_, webhook, checkout, orderComplete, apiTest, e2e, deploy] = await Promise.all([
    createTask({ title: '결제 API 엔드포인트 구현 (Stripe 연동)',         priority: 'critical', role: 'backend'  }),
    createTask({ title: '결제 웹훅(Webhook) 이벤트 처리 로직',           priority: 'high',     role: 'backend'  }),
    createTask({ title: '결제 UI 컴포넌트 개발 (CheckoutForm)',           priority: 'critical', role: 'frontend' }),
    createTask({ title: '주문 완료 페이지 개발 (성공/실패/취소 처리)',     priority: 'high',     role: 'frontend' }),
    createTask({ title: '결제 API 통합 테스트 (24개 케이스)',             priority: 'high',     role: 'test'     }),
    createTask({ title: 'E2E 결제 플로우 자동화 테스트 (Playwright)',     priority: 'high',     role: 'test'     }),
    createTask({ title: 'CI/CD 파이프라인 + Docker ECS 배포 설정',       priority: 'medium',   role: 'devops'   }),
  ]);

  const tasks = { api: api_, webhook, checkout, orderComplete, apiTest, e2e, deploy };
  console.log(`${COLORS.green}✅ 7개 태스크 생성 완료${COLORS.reset}\n`);
  console.log(`${COLORS.gray}[${'─'.repeat(56)}]${COLORS.reset}`);

  await sleep(1500);

  // 3. 에이전트 병렬 실행
  await Promise.all([
    runBackendAgent(tasks),
    runFrontendAgent(tasks),
    runTestAgent(tasks, 7000),    // 백엔드+프론트 작업 일정 후 시작
    runDevopsAgent(tasks, 9000),  // 중반 이후 시작
  ]);

  // 4. 최종 승인
  console.log(`\n${COLORS.gray}[최종 검토 진행 중...]${COLORS.reset}`);
  await finalApproval(tasks);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`${COLORS.bold}${COLORS.green}  🎉 시뮬레이션 완료!${COLORS.reset}`);
  console.log(`  E-Commerce 결제 시스템 v2.0 — 전체 7개 태스크 Done ✅`);
  console.log(`${'─'.repeat(60)}\n`);
}

main().catch(console.error);