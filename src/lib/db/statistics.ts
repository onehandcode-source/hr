import { prisma } from '@/lib/prisma';

export async function getAdminChartData() {
	const currentYear = new Date().getFullYear();
	const yearStart = new Date(`${currentYear}-01-01`);
	const yearEnd = new Date(`${currentYear + 1}-01-01`);

	const [monthlyRaw, users, leaveTypeGroups] = await Promise.all([
		// 올해 월별 연차 신청
		prisma.annualLeave.findMany({
			where: { createdAt: { gte: yearStart, lt: yearEnd } },
			select: { createdAt: true, status: true },
		}),
		// 부서별 연차 사용률 계산용
		prisma.user.findMany({
			where: { isActive: true },
			select: { department: true, usedLeaves: true, totalLeaves: true },
		}),
		// 승인된 연차의 유형별 분포
		prisma.annualLeave.groupBy({
			by: ['leaveType'],
			where: { status: 'APPROVED' },
			_count: { id: true },
		}),
	]);

	// 월별 데이터 집계
	const monthlyMap: Record<number, { approved: number; pending: number; rejected: number }> = {};
	for (let m = 1; m <= 12; m++) {
		monthlyMap[m] = { approved: 0, pending: 0, rejected: 0 };
	}
	for (const leave of monthlyRaw) {
		const month = new Date(leave.createdAt).getMonth() + 1;
		if (leave.status === 'APPROVED') monthlyMap[month].approved++;
		else if (leave.status === 'PENDING') monthlyMap[month].pending++;
		else if (leave.status === 'REJECTED') monthlyMap[month].rejected++;
	}

	// 부서별 사용률 집계
	const deptMap: Record<string, { total: number; used: number }> = {};
	for (const user of users) {
		const dept = user.department || '미지정';
		if (!deptMap[dept]) deptMap[dept] = { total: 0, used: 0 };
		deptMap[dept].total += user.totalLeaves;
		deptMap[dept].used += user.usedLeaves;
	}

	return {
		monthlyLeaves: Object.entries(monthlyMap).map(([month, counts]) => ({
			month: `${month}월`,
			승인: counts.approved,
			대기: counts.pending,
			거부: counts.rejected,
		})),
		departmentLeaveRate: Object.entries(deptMap).map(([dept, data]) => ({
			department: dept,
			사용률: data.total > 0 ? Math.round((data.used / data.total) * 100) : 0,
		})),
		leaveTypeDistribution: leaveTypeGroups.map((g) => ({
			type: g.leaveType,
			count: g._count.id,
		})),
	};
}

export async function getAdminStatistics() {
	const [totalEmployees, pendingLeaves, completedEvaluations, recentLeaves] = await Promise.all([
		// 총 직원 수 (활성 사용자 전체)
		prisma.user.count({
			where: { isActive: true },
		}),

		// 대기 중인 연차 신청
		prisma.annualLeave.count({
			where: { status: 'PENDING' },
		}),

		// 완료된 평가 수
		prisma.evaluation.count({
			where: { status: 'COMPLETED' },
		}),

		// 최근 연차 신청 (최근 5개)
		prisma.annualLeave.findMany({
			take: 5,
			orderBy: { createdAt: 'desc' },
			include: {
				user: {
					select: {
						name: true,
						department: true,
					},
				},
			},
		}),
	]);

	return {
		totalEmployees,
		pendingLeaves,
		completedEvaluations,
		recentLeaves,
	};
}

export async function getEmployeeStatistics(userId: string) {
	const [user, leaveRequests, evaluations] = await Promise.all([
		// 사용자 정보
		prisma.user.findUnique({
			where: { id: userId },
			select: {
				totalLeaves: true,
				usedLeaves: true,
			},
		}),

		// 내 연차 신청 내역 (최근 5개)
		prisma.annualLeave.findMany({
			where: { userId },
			take: 5,
			orderBy: { createdAt: 'desc' },
		}),

		// 최근 평가
		prisma.evaluation.findFirst({
			where: { userId },
			orderBy: { createdAt: 'desc' },
			include: {
				scores: {
					include: {
						item: true,
					},
				},
			},
		}),
	]);

	return {
		leaveBalance: user
			? {
					totalLeaves: user.totalLeaves,
					usedLeaves: user.usedLeaves,
					remainingLeaves: user.totalLeaves - user.usedLeaves,
				}
			: null,
		recentLeaveRequests: leaveRequests,
		latestEvaluation: evaluations,
	};
}
