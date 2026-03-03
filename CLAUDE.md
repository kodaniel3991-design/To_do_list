# TaskForce.AI — Claude Code 에이전트 가이드

## 프로젝트 개요
이 프로젝트는 AI 에이전트들이 협력하는 칸반 보드(TaskForce.AI)입니다.
**Claude Code 에이전트는 반드시 이 가이드에 따라 작업을 수행해야 합니다.**

## 서버 정보
- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:3000
- **DB**: `backend/taskforce.db` (SQLite)

---

## 에이전트 작업 흐름

### 1단계 — 작업 목록 확인
```bash
# 전체 태스크 조회
curl -s http://localhost:3001/api/tasks

# To Do 태스크만 조회 (내가 처리할 수 있는 것)
curl -s "http://localhost:3001/api/tasks?status=todo"

# 내 역할(role)의 태스크만 조회
curl -s "http://localhost:3001/api/tasks?status=todo&role=backend"
```

### 2단계 — 태스크 클레임 (작업 시작 선언)
```bash
# 태스크를 클레임 (다른 에이전트가 중복 작업하지 않도록)
curl -s -X PATCH http://localhost:3001/api/tasks/{TASK_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "claimed", "agentName": "claude-{역할}"}'
```

### 3단계 — 작업 진행
```bash
# In Progress로 전환
curl -s -X PATCH http://localhost:3001/api/tasks/{TASK_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress", "agentName": "claude-{역할}"}'
```

### 4단계 — 리뷰 요청 또는 완료
```bash
# 리뷰 요청
curl -s -X PATCH http://localhost:3001/api/tasks/{TASK_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "review", "agentName": "claude-{역할}"}'

# 완료 처리
curl -s -X PATCH http://localhost:3001/api/tasks/{TASK_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "done", "agentName": "claude-{역할}"}'
```

### 5단계 — 코멘트 추가 (작업 기록)
```bash
curl -s -X POST http://localhost:3001/api/tasks/{TASK_ID}/comments \
  -H "Content-Type: application/json" \
  -d '{"text": "작업 내용 요약", "author": "claude-{역할}"}'
```

---

## 새 태스크 생성
```bash
curl -s -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "태스크 제목",
    "description": "상세 설명",
    "priority": "high",
    "project": "TaskForce AI",
    "role": "backend"
  }'
```

**priority**: `critical` | `high` | `medium` | `low`
**role**: `backend` | `frontend` | `test` | `devops`

---

## 에이전트 역할 정의
| agentName | 담당 |
|-----------|------|
| `claude-backend` | API, DB, 서버 로직 |
| `claude-frontend` | React 컴포넌트, UI |
| `claude-test` | 테스트 작성 및 실행 |
| `claude-devops` | 빌드, 배포, 환경 설정 |
| `claude-security` | 보안 이슈 점검 및 수정 |

---

## 에이전트 작업 규칙
1. **반드시 클레임 후 작업** — `claimed` 상태로 변경 후 작업 시작
2. **중복 작업 금지** — `claimed` 또는 `in_progress` 태스크는 건드리지 않음
3. **완료 시 코멘트 필수** — 무엇을 했는지 코멘트에 기록
4. **신규 태스크 발견 시 등록** — 작업 중 발견한 버그나 개선사항은 새 태스크로 등록

---

## 도우미 스크립트
`scripts/` 폴더의 스크립트를 활용하세요:
```bash
# 사용 가능한 태스크 목록
node scripts/list-tasks.js

# 태스크 클레임
node scripts/claim-task.js {TASK_ID} {AGENT_NAME}

# 태스크 완료
node scripts/complete-task.js {TASK_ID} {AGENT_NAME} "완료 메시지"
```
