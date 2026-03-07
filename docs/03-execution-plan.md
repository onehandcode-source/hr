# HR 시스템 - 전체 실행 계획

## 개요

`02-improvements.md`에 정리된 개선 사항을 단계적으로 실행하는 계획입니다.
우선순위와 의존성을 고려하여 4개 Phase로 나누어 진행합니다.

---

## Phase 1. 안정화 (Stabilization)

> 핵심 비즈니스 로직 버그 수정 및 보안 강화

### 1-1. API 입력값 검증 (Zod 적용)

**목표**: 모든 API 엔드포인트에 서버 사이드 스키마 검증 추가

```
작업 순서:
1. zod 패키지 설치
2. /src/lib/validations/ 디렉터리 생성
3. 각 도메인별 스키마 정의
   - users.schema.ts
   - leaves.schema.ts
   - evaluations.schema.ts
4. 각 API 라우트에 검증 미들웨어 적용
5. 에러 응답 형식 표준화
```

**예상 파일 변경**: `src/app/api/**/*.ts`, `src/lib/validations/*.ts`

---

### 1-2. 공휴일 기반 연차 일수 정확 계산

**목표**: 휴가 신청 시 주말·공휴일을 제외한 실제 근무일 기준으로 차감

```
작업 순서:
1. src/lib/utils/holidays.ts 현황 파악
2. 날짜 범위 내 공휴일·주말 제외 순근무일 계산 함수 구현
3. 휴가 신청 API (POST /api/leaves) 에 적용
4. 프론트엔드 날짜 선택 시 예상 차감일 미리보기 표시
```

**예상 파일 변경**: `src/lib/utils/holidays.ts`, `src/app/api/leaves/route.ts`, `src/app/(dashboard)/employee/leaves/request/page.tsx`

---

### 1-3. 인증 보안 강화

**목표**: 비밀번호 정책 적용 및 로그인 시도 제한

```
작업 순서:
1. 비밀번호 최소 8자, 특수문자 포함 정책 Zod 스키마 적용
2. rate-limiter-flexible 또는 upstash/ratelimit 설치
3. /api/auth/[...nextauth] 에 로그인 시도 제한 적용 (5회/10분)
4. 세션 만료 감지 → 자동 로그아웃 + 토스트 알림
```

**예상 파일 변경**: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`

---

### 1-4. React Error Boundary 적용

**목표**: 컴포넌트 크래시 시 전체 화면 대신 에러 UI 표시

```
작업 순서:
1. src/components/common/ErrorBoundary.tsx 생성
2. 주요 페이지 레이아웃에 ErrorBoundary 래핑
3. 에러 발생 시 "새로고침" 버튼 포함한 Fallback UI 제공
```

**예상 파일 변경**: `src/components/common/ErrorBoundary.tsx`, `src/app/(dashboard)/layout.tsx`

---

## Phase 2. 핵심 기능 고도화 (Core Enhancement)

> 실제 운영에 필요한 누락 기능 추가

### 2-1. 연차 자동 부여 스케줄러

**목표**: 매년 1월 1일 또는 입사일 기준 연차 자동 충전

```
작업 순서:
1. Vercel Cron Jobs 또는 pg_cron 방식 결정
2. /api/cron/annual-leave-reset 엔드포인트 생성
3. 근속 기간별 연차 산정 로직 구현 (근로기준법 기준)
   - 1년 미만: 월 1일 (최대 11일)
   - 1년 이상: 15일 기본 + 2년마다 1일 추가 (최대 25일)
4. vercel.json에 cron 설정 추가
5. 관리자 대시보드에 수동 실행 버튼 추가
```

**예상 파일 변경**: `src/app/api/cron/annual-leave-reset/route.ts`, `vercel.json`, `src/lib/db/users.ts`

---

### 2-2. 이메일 알림 시스템

**목표**: 휴가 신청·승인·반려 시 이메일 발송

```
작업 순서:
1. Resend 또는 Nodemailer + SMTP 방식 결정
2. resend 패키지 설치 및 API 키 환경변수 설정
3. src/lib/email/ 디렉터리 생성
   - templates/leave-request.tsx (React Email 템플릿)
   - templates/leave-approved.tsx
   - templates/leave-rejected.tsx
   - sender.ts (발송 함수)
4. 휴가 신청/승인/반려 API에 이메일 발송 로직 추가
5. 관리자 이메일 설정 페이지 추가
```

**예상 파일 변경**: `src/lib/email/**`, `src/app/api/leaves/**`

---

### 2-3. 페이지네이션 및 검색 필터

**목표**: 직원·휴가 목록 대용량 데이터 처리

```
작업 순서:
1. 공통 페이지네이션 컴포넌트 생성 (src/components/common/Pagination.tsx)
2. 직원 목록 API에 page, limit, search 쿼리 파라미터 추가
3. 휴가 목록 API에 status, dateRange, userId 필터 추가
4. 프론트엔드 목록 페이지에 검색 입력창 + 페이지네이션 UI 적용
```

**예상 파일 변경**: `src/app/api/users/route.ts`, `src/app/api/leaves/route.ts`, `src/components/common/Pagination.tsx`

---

### 2-4. 휴가 유형 확장

**목표**: 경조사·육아휴직 등 추가 유형 지원

```
작업 순서:
1. Prisma 스키마 LeaveType enum 확장
   (CONDOLENCE, MATERNITY, PATERNITY, CHILDCARE 추가)
2. DB 마이그레이션 실행
3. 휴가 신청 폼 드롭다운에 신규 유형 추가
4. 관리자 휴가 목록에 필터 옵션 추가
5. 유형별 차감 일수 규칙 정의
```

**예상 파일 변경**: `prisma/schema.prisma`, `src/app/(dashboard)/employee/leaves/request/page.tsx`

---

## Phase 3. 사용자 경험 개선 (UX Improvement)

> UI 완성도 및 접근성 향상

### 3-1. 모바일 반응형 완성

```
작업 순서:
1. 모든 페이지 모바일(375px) 브레이크포인트 테스트
2. 테이블 → 카드 리스트로 전환 (모바일에서)
3. 캘린더 모바일 뷰 최적화 (주간뷰 기본 설정)
4. 사이드바 → 바텀 네비게이션 전환 (모바일)
```

### 3-2. 빈 상태 및 로딩 개선

```
작업 순서:
1. 공통 EmptyState 컴포넌트 생성
2. 공통 Skeleton 컴포넌트 정의 (테이블용, 카드용)
3. 각 페이지의 로딩·빈 상태 일관성 적용
```

### 3-3. 다크 모드

```
작업 순서:
1. next-themes 설치
2. ThemeProvider 설정
3. Tailwind CSS dark: 클래스 전체 적용
4. 헤더에 테마 토글 버튼 추가
```

### 3-4. 리포트 내보내기

```
작업 순서:
1. @react-pdf/renderer 또는 xlsx 패키지 설치
2. 휴가 현황 PDF/Excel 내보내기 API 구현
3. 관리자 페이지에 "내보내기" 버튼 추가
```

---

## Phase 4. 품질 및 운영 (Quality & Operations)

> 장기 유지보수성 및 운영 안정성 확보

### 4-1. 테스트 코드 작성

```
작업 순서:
1. vitest + @testing-library/react 설치
2. 핵심 유틸 함수 Unit Test 작성
   - 날짜 계산, 공휴일 제외, 연차 산정
3. API 라우트 Integration Test 작성
4. playwright 설치 및 주요 사용자 시나리오 E2E Test
   - 로그인 → 휴가 신청 → 관리자 승인 플로우
```

### 4-2. CI/CD 파이프라인

```
작업 순서:
1. .github/workflows/ci.yml 작성
   - PR 시 lint + test 자동 실행
2. .github/workflows/deploy.yml 작성
   - main 브랜치 push 시 Vercel 자동 배포
3. 환경 변수 GitHub Secrets 설정 가이드 문서화
```

### 4-3. 로깅 및 모니터링

```
작업 순서:
1. pino 설치 및 서버 사이드 구조화 로깅 적용
2. Sentry 설치 → 클라이언트·서버 에러 수집
3. Vercel Analytics 활성화
```

### 4-4. API 문서화

```
작업 순서:
1. swagger-jsdoc + swagger-ui-next.js 설치
2. 각 API 라우트에 JSDoc 주석 추가
3. /api-docs 페이지 생성 (개발 환경 전용)
```

---

## 마일스톤 요약

| Phase | 기간 | 주요 산출물 |
|-------|------|------------|
| Phase 1 - 안정화 | 1~2주 | Zod 검증, 보안 강화, Error Boundary |
| Phase 2 - 기능 고도화 | 3~4주 | 이메일 알림, 스케줄러, 페이지네이션, 휴가 유형 확장 |
| Phase 3 - UX 개선 | 2~3주 | 모바일 완성, 다크 모드, 리포트 내보내기 |
| Phase 4 - 품질/운영 | 2~3주 | 테스트, CI/CD, 로깅, API 문서화 |

---

## 기술 의존성 맵

```
Phase 1 완료
    ↓
Phase 2 시작 가능 (Phase 1의 Zod 스키마를 재사용)
    ↓
Phase 3 와 Phase 4는 독립적으로 병렬 진행 가능
```

---

## 환경 변수 추가 예정 목록

```env
# Phase 1
NEXTAUTH_SECRET=...
RATE_LIMIT_MAX=5
RATE_LIMIT_WINDOW=600

# Phase 2
RESEND_API_KEY=...
FROM_EMAIL=noreply@yourdomain.com
CRON_SECRET=...

# Phase 4
SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_DSN=...
```
