# HR 시스템 - 프로젝트 전체 개요

## 1. 프로젝트 소개

치과 의원 및 중소 의료기관을 위한 **인사관리(HR) 웹 애플리케이션**입니다.
직원의 연차·휴가 관리, 인사 평가, 대시보드 통계를 하나의 플랫폼에서 처리합니다.

---

## 2. 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript 5 |
| 스타일링 | Tailwind CSS 4 + shadcn/ui |
| 인증 | NextAuth.js 4 (Credentials + JWT) |
| ORM | Prisma 7 |
| DB | PostgreSQL (Vercel Postgres / Docker) |
| 상태관리 | Zustand 5 |
| 데이터 시각화 | Recharts 3 |
| 캘린더 | React Big Calendar |
| 애니메이션 | Framer Motion 12 |
| 알림 | Sonner (Toast) |

---

## 3. 주요 기능

### 관리자(ADMIN)

| 기능 | 설명 |
|------|------|
| 직원 관리 | 직원 등록·수정·비활성화, 연차 잔여일 수동 조정 |
| 휴가 승인 | 신청된 휴가 목록 확인, 승인 / 반려 처리 |
| 휴가 캘린더 | 전 직원의 휴가 일정 월별 캘린더 뷰 |
| 인사 평가 | 평가 항목 생성·수정, 직원별 점수 입력 및 결과 조회 |
| 대시보드 | 전체 직원 현황, 부서별 통계, 최근 휴가 신청 목록 |

### 직원(EMPLOYEE)

| 기능 | 설명 |
|------|------|
| 휴가 신청 | 연차·반차(오전/오후)·병가·특별휴가 신청 |
| 휴가 현황 | 본인 신청 내역 및 처리 상태 확인 |
| 캘린더 | 전 직원 휴가 일정 조회 |
| 인사 평가 조회 | 본인 평가 결과 열람 |
| 프로필 | 개인 정보 및 비밀번호 변경 |

---

## 4. 데이터베이스 스키마

```
User
 ├── id, loginId, name, password (bcrypt)
 ├── role (ADMIN | EMPLOYEE)
 ├── department, position, phone, email
 ├── annualLeaveBalance (연차 잔여일)
 └── isActive

AnnualLeave
 ├── userId → User
 ├── type (ANNUAL | HALF | HALF_AM | HALF_PM | SICK | SPECIAL)
 ├── status (PENDING | APPROVED | REJECTED | CANCELLED)
 ├── startDate, endDate, reason
 └── adminComment

Evaluation
 ├── userId → User
 ├── evaluatorId → User
 ├── period (평가 기간 문자열)
 ├── totalScore, notes
 └── EvaluationScore[] → EvaluationItem

EvaluationItem
 ├── name, description, maxScore
 ├── category (일반 | 임상 | 환자관리 | 감염관리 | 전문지식 | 근무태도)
 └── order, isActive

Notification
 ├── userId → User
 ├── type, title, message
 └── isRead
```

---

## 5. 프로젝트 구조

```
hr/
├── prisma/
│   ├── schema.prisma          # DB 스키마
│   ├── seed.ts                # 초기 데이터 삽입
│   └── migrations/            # 마이그레이션 파일 (5개)
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── admin/         # 관리자 페이지
│   │   │   └── employee/      # 직원 페이지
│   │   └── api/               # REST API 엔드포인트
│   ├── components/
│   │   ├── ui/                # shadcn/ui 기본 컴포넌트
│   │   ├── layout/            # Navbar, Sidebar, Shell
│   │   ├── auth/              # 인증 Provider
│   │   └── common/            # Charts, Calendar, Loading
│   ├── lib/
│   │   ├── auth.ts            # NextAuth 설정
│   │   ├── prisma.ts          # Prisma 클라이언트
│   │   ├── db/                # DB 쿼리 유틸 (leaves, evaluations, users 등)
│   │   └── utils/             # 날짜, 공휴일, 비밀번호 유틸
│   ├── types/                 # TypeScript 타입 정의
│   └── hooks/                 # 커스텀 React 훅
├── docker-compose.yml         # 로컬 PostgreSQL 환경
└── docs/                      # 프로젝트 문서
```

---

## 6. 인증 및 권한

- **로그인 방식**: ID / 비밀번호 (Credentials Provider)
- **세션**: JWT 기반 (NextAuth)
- **권한 분리**:
  - `ADMIN` → `/admin/*` 접근 가능
  - `EMPLOYEE` → `/employee/*` 접근 가능
  - 미인증 시 `/login` 리다이렉트
  - 권한 없는 접근 시 `/unauthorized` 리다이렉트

---

## 7. 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (.env.local)
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# 3. DB 마이그레이션
npx prisma migrate dev

# 4. 초기 데이터 삽입
npx tsx prisma/seed.ts

# 5. 개발 서버 실행
npm run dev
```

### 테스트 계정

| 역할 | ID | 비밀번호 |
|------|----|---------|
| 관리자 | admin | admin123 |
| 직원 1 | hong001 | password123 |
| 직원 2 | kim001 | password123 |
| 직원 3 | park001 | password123 |

---

## 8. 현재 배포 구성

- **로컬 개발**: Docker Compose (PostgreSQL 16-Alpine)
- **프로덕션 타겟**: Vercel (Next.js 최적화) + Vercel Postgres
- **빌드**: `npm run build` → `.next/` 정적 빌드 출력
