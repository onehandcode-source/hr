'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Users, Clock, ClipboardCheck, ClipboardList, CalendarRange } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { formatDateKorean } from '@/lib/utils/date';
import LeaveCalendarView from '@/components/common/LeaveCalendarView';
import PageTransition from '@/components/common/PageTransition';
import Loading from '@/components/common/Loading';

interface LeaveEvent {
	id: string;
	startDate: string;
	endDate: string;
	days: number;
	user: {
		name: string;
		department: string;
	};
}

const statusClass: Record<string, string> = {
	PENDING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
	APPROVED: 'bg-green-100 text-green-800 hover:bg-green-100',
	REJECTED: 'bg-red-100 text-red-800 hover:bg-red-100',
};
const statusText: Record<string, string> = {
	PENDING: '대기중',
	APPROVED: '승인',
	REJECTED: '거부',
};

const cardVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.25 } }),
};

export default function AdminDashboard() {
	const {
		data: stats,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['statistics', 'admin'],
		queryFn: async () => {
			const res = await fetch('/api/statistics/admin');
			if (!res.ok) throw new Error('Failed to fetch statistics');
			return res.json();
		},
	});

	const { data: allLeaves } = useQuery({
		queryKey: ['leaves', 'all-approved'],
		queryFn: async () => {
			const res = await fetch('/api/leaves/all');
			if (!res.ok) throw new Error('Failed to fetch leaves');
			return res.json() as Promise<LeaveEvent[]>;
		},
	});

	useEffect(() => {
		if (error) toast.error('통계 데이터를 불러오는데 실패했습니다.');
	}, [error]);

	if (isLoading) {
		return <Loading />;
	}

	const statCards = [
		{
			label: '총 직원 수',
			value: stats?.totalEmployees || 0,
			unit: '명',
			icon: Users,
			topColor: 'bg-blue-500',
			iconBg: 'bg-blue-50',
			iconColor: 'text-blue-500',
		},
		{
			label: '대기 중인 연차 신청',
			value: stats?.pendingLeaves || 0,
			unit: '건',
			icon: Clock,
			topColor: 'bg-amber-500',
			iconBg: 'bg-amber-50',
			iconColor: 'text-amber-500',
		},
		{
			label: '완료된 평가',
			value: stats?.completedEvaluations || 0,
			unit: '건',
			icon: ClipboardCheck,
			topColor: 'bg-emerald-500',
			iconBg: 'bg-emerald-50',
			iconColor: 'text-emerald-500',
		},
	];

	return (
		<PageTransition>
			<div>
				{/* 페이지 헤더 */}
				<div className="mb-6">
					<h1 className="text-2xl font-bold">관리자 대시보드</h1>
					<p className="text-sm text-muted-foreground mt-0.5">HR 시스템 현황을 한눈에 확인하세요</p>
				</div>

				{/* 요약 카드 */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					{statCards.map((card, i) => {
						const Icon = card.icon;
						return (
							<motion.div
								key={card.label}
								custom={i}
								variants={cardVariants}
								initial="hidden"
								animate="visible"
								className="h-full"
							>
								<Card className="overflow-hidden h-full">
									<div className={`h-1 ${card.topColor}`} />
									<CardContent className="p-5 flex flex-col justify-center min-h-[110px]">
										<div className="flex justify-between items-start">
											<div>
												<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
													{card.label}
												</p>
												<div className="flex items-end gap-1 mt-2">
													<span className="text-3xl font-bold">{card.value}</span>
													<span className="text-sm text-muted-foreground mb-0.5">{card.unit}</span>
												</div>
											</div>
											<div className={`p-2.5 rounded-xl ${card.iconBg}`}>
												<Icon className={`h-5 w-5 ${card.iconColor}`} />
											</div>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						);
					})}
				</div>

				{/* 최근 연차 신청 */}
				<div className="mb-6">
					<Card>
						<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
							<div className="p-1.5 rounded-md bg-primary/10">
								<ClipboardList className="h-4 w-4 text-primary" />
							</div>
							<CardTitle className="text-sm font-semibold">최근 연차 신청</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							{stats?.recentLeaves && stats.recentLeaves.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow className="bg-muted/40 hover:bg-muted/40">
											<TableHead>직원명</TableHead>
											<TableHead>부서</TableHead>
											<TableHead>시작일</TableHead>
											<TableHead>종료일</TableHead>
											<TableHead>일수</TableHead>
											<TableHead>상태</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{stats.recentLeaves.map((leave: any) => (
											<TableRow key={leave.id}>
												<TableCell className="font-medium">{leave.user.name}</TableCell>
												<TableCell className="text-muted-foreground">{leave.user.department}</TableCell>
												<TableCell>{formatDateKorean(new Date(leave.startDate))}</TableCell>
												<TableCell>{formatDateKorean(new Date(leave.endDate))}</TableCell>
												<TableCell>{leave.days}일</TableCell>
												<TableCell>
													<Badge className={statusClass[leave.status] ?? ''}>
														{statusText[leave.status] ?? leave.status}
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<p className="text-sm text-muted-foreground p-5">최근 연차 신청이 없습니다.</p>
							)}
						</CardContent>
					</Card>
				</div>

				{/* 전체 직원 일정 */}
				<div>
					<Card>
						<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
							<div className="p-1.5 rounded-md bg-primary/10">
								<CalendarRange className="h-4 w-4 text-primary" />
							</div>
							<CardTitle className="text-sm font-semibold">전체 직원 일정</CardTitle>
						</CardHeader>
						<CardContent className="p-4">
							<LeaveCalendarView leaves={allLeaves ?? []} />
						</CardContent>
					</Card>
				</div>
			</div>
		</PageTransition>
	);
}
