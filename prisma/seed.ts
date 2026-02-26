import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import seedData from './seed-data.json';

const adapter = new PrismaPg({ connectionString: process.env.POSTGRES_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log('🌱 Seeding database...');

	// 사용자 생성
	const createdUsers = await Promise.all(
		seedData.users.map(async (user) => {
			return prisma.user.upsert({
				where: { email: user.email },
				update: {},
				create: {
					loginId: user.loginId,
					email: user.email,
					password: await hash(user.password, 10),
					name: user.name,
					role: user.role as 'ADMIN' | 'EMPLOYEE',
					department: user.department,
					position: user.position,
					totalLeaves: user.totalLeaves,
				},
			});
		}),
	);
	console.log(`✅ Users created: ${createdUsers.length}`);

	// 평가 항목 생성
	const createdItems = await Promise.all(
		seedData.evaluationItems.map((item) =>
			prisma.evaluationItem.upsert({
				where: { id: item.id },
				update: {},
				create: {
					id: item.id,
					title: item.title,
					description: item.description,
					category: item.category,
					maxScore: item.maxScore,
					weight: item.weight,
					order: item.order,
				},
			}),
		),
	);
	console.log(`✅ Evaluation items created: ${createdItems.length}`);
}

main()
	.catch((e) => {
		console.error('❌ Error seeding database:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
