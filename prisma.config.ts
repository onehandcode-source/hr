import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// 로컬 개발 환경: .env.local 로드
dotenv.config({ path: ".env.local" });

const migrationUrl =
	process.env.POSTGRES_URL_NON_POOLING || // Vercel Neon 표준
	process.env.POSTGRES_PRISMA_URL || // Vercel Neon 대체
	process.env.DATABASE_URL; // 일반 PostgreSQL 폴백

if (!migrationUrl) {
	throw new Error(
		"Migration DB URL not found. Set POSTGRES_URL_NON_POOLING in environment variables.",
	);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationUrl,
  },
});
