# HR 시스템

Next.js 기반 직원 연차 관리 및 인사평가 시스템입니다.

## 기술 스택

- **Frontend**: Next.js 14+ (App Router), TypeScript, React 19
- **UI**: Material-UI (MUI), Tailwind CSS
- **Database**: Vercel Postgres
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query

## 주요 기능

### 관리자
- 연차 신청 목록 조회 및 승인/거부
- 평가 항목 관리 (CRUD)
- 직원별 평가 작성 및 관리

### 직원
- 연차 신청 (연차/반차)
- 전체 직원 연차 달력 조회
- 내 평가 결과 조회

## 설치 방법

### 1. 의존성 설치
npm install

### 2. 환경 변수 설정
.env.local 파일 생성 후 Vercel Postgres URL 추가

### 3. 데이터베이스 마이그레이션
npx prisma migrate dev --name init
npx prisma db seed

### 4. 개발 서버 실행
npm run dev

**테스트 계정:**
- 관리자: admin@company.com / admin123
- 직원: john@company.com / password123
