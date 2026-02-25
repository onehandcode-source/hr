import { prisma } from '@/lib/prisma';

// 평가 항목 관리
export async function getEvaluationItems(filters?: { isActive?: boolean; category?: string }) {
	const where: any = {};

	if (filters?.isActive !== undefined) {
		where.isActive = filters.isActive;
	}

	if (filters?.category) {
		where.category = filters.category;
	}

	return prisma.evaluationItem.findMany({
		where,
		orderBy: [{ category: 'asc' }, { order: 'asc' }],
	});
}

export async function getEvaluationItem(id: string) {
	return prisma.evaluationItem.findUnique({
		where: { id },
	});
}

export async function createEvaluationItem(data: {
	title: string;
	description?: string;
	category: string;
	maxScore: number;
	weight: number;
	order: number;
}) {
	return prisma.evaluationItem.create({
		data: {
			...data,
			isActive: true,
		},
	});
}

export async function updateEvaluationItem(
	id: string,
	data: {
		title?: string;
		description?: string;
		category?: string;
		maxScore?: number;
		weight?: number;
		order?: number;
		isActive?: boolean;
	},
) {
	return prisma.evaluationItem.update({
		where: { id },
		data,
	});
}

export async function deleteEvaluationItem(id: string) {
	return prisma.evaluationItem.delete({
		where: { id },
	});
}

// 평가 관리
export async function getEvaluations(filters?: { userId?: string; period?: string }) {
	const where: any = {};

	if (filters?.userId) {
		where.userId = filters.userId;
	}

	if (filters?.period) {
		where.period = filters.period;
	}

	return prisma.evaluation.findMany({
		where,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					department: true,
					position: true,
				},
			},
			scores: {
				include: {
					item: true,
				},
			},
		},
		orderBy: {
			createdAt: 'desc',
		},
	});
}

export async function getEvaluation(id: string) {
	return prisma.evaluation.findUnique({
		where: { id },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					department: true,
					position: true,
				},
			},
			scores: {
				include: {
					item: true,
				},
			},
		},
	});
}

export async function createEvaluation(data: {
	userId: string;
	period: string;
	evaluatedBy: string;
	scores: Array<{
		itemId: string;
		score: number;
		comment?: string;
	}>;
	comment?: string;
}) {
	// 총점 계산
	const items = await prisma.evaluationItem.findMany({
		where: {
			id: { in: data.scores.map((s) => s.itemId) },
		},
	});

	const totalScore = data.scores.reduce((sum, score) => {
		const item = items.find((i) => i.id === score.itemId);
		const weight = item?.weight || 1;
		return sum + score.score * weight;
	}, 0);

	const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
	const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

	return prisma.evaluation.create({
		data: {
			userId: data.userId,
			period: data.period,
			evaluatedBy: data.evaluatedBy,
			status: 'COMPLETED',
			totalScore: normalizedScore,
			comment: data.comment,
			scores: {
				create: data.scores.map((score) => ({
					itemId: score.itemId,
					score: score.score,
					comment: score.comment,
				})),
			},
		},
		include: {
			scores: {
				include: {
					item: true,
				},
			},
		},
	});
}

export async function updateEvaluation(
	id: string,
	data: {
		scores?: Array<{
			itemId: string;
			score: number;
			comment?: string;
		}>;
		comment?: string;
		status?: string;
	},
) {
	// 기존 평가 삭제 후 새로 생성
	if (data.scores) {
		await prisma.evaluationScore.deleteMany({
			where: { evaluationId: id },
		});

		// 총점 재계산
		const items = await prisma.evaluationItem.findMany({
			where: {
				id: { in: data.scores.map((s) => s.itemId) },
			},
		});

		const totalScore = data.scores.reduce((sum, score) => {
			const item = items.find((i) => i.id === score.itemId);
			const weight = item?.weight || 1;
			return sum + score.score * weight;
		}, 0);

		const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
		const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

		return prisma.evaluation.update({
			where: { id },
			data: {
				totalScore: normalizedScore,
				comment: data.comment,
				status: data.status,
				scores: {
					create: data.scores.map((score) => ({
						itemId: score.itemId,
						score: score.score,
						comment: score.comment,
					})),
				},
			},
			include: {
				scores: {
					include: {
						item: true,
					},
				},
			},
		});
	}

	return prisma.evaluation.update({
		where: { id },
		data: {
			comment: data.comment,
			status: data.status,
		},
	});
}

export { getAllUsers as getUsers } from './users';
