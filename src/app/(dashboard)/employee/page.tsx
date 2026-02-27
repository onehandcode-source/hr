'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
	CalendarDays,
	TrendingDown,
	Sparkles,
	ClipboardList,
	CalendarRange,
	Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { LeaveBalanceDonut } from '@/components/common/DashboardCharts';
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

const LEAVE_TYPE_LABELS: Record<string, string> = {
	ANNUAL: '연차',
	HALF: '반차',
	HALF_AM: '오전반차',
	HALF_PM: '오후반차',
	SICK: '병가',
	SPECIAL: '경조사',
};

const statusClass: Record<string, string> = {
	PENDING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
	APPROVED: 'bg-green-100 text-green-800 hover:bg-green-100',
	REJECTED: 'bg-red-100 text-red-800 hover:bg-red-100',
	CANCELLED: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
};
const statusText: Record<string, string> = {
	PENDING: '대기중',
	APPROVED: '승인',
	REJECTED: '거부',
	CANCELLED: '취소',
};

const cardVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.25 } }),
};

export default function EmployeeDashboard() {
	const queryClient = useQueryClient();

	const {
		data: stats,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['statistics', 'employee'],
		queryFn: async () => {
			const res = await fetch('/api/statistics/employee');
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

	const cancelMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch(`/api/leaves/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || '취소 실패');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['statistics', 'employee'] });
			queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
			toast.success('연차 신청이 취소되었습니다.');
		},
		onError: (err: Error) => {
			toast.error(err.message);
		},
	});

	if (isLoading) {
		return <Loading />;
	}

	const statCards = [
		{
			label: '총 연차',
			value: stats?.leaveBalance?.totalLeaves || 0,
			unit: '일',
			icon: CalendarDays,
			topColor: 'bg-indigo-500',
			iconBg: 'bg-indigo-50',
			iconColor: 'text-indigo-500',
		},
		{
			label: '사용한 연차',
			value: stats?.leaveBalance?.usedLeaves || 0,
			unit: '일',
			icon: TrendingDown,
			topColor: 'bg-orange-500',
			iconBg: 'bg-orange-50',
			iconColor: 'text-orange-500',
		},
		{
			label: '남은 연차',
			value: stats?.leaveBalance?.remainingLeaves || 0,
			unit: '일',
			icon: Sparkles,
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
					<h1 className="text-2xl font-bold">직원 대시보드</h1>
					<p className="text-sm text-muted-foreground mt-0.5">내 연차 현황과 팀 일정을 확인하세요</p>
				</div>

				{/* 요약 카드 — 3 stat + 1 donut, 동일 높이 */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

					{/* 도넛 차트 카드 */}
					{stats?.leaveBalance && (
						<motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible" className="h-full">
							<Card className="overflow-hidden h-full">
								<div className="h-1 bg-primary" />
								<CardContent className="p-4 flex flex-col justify-center min-h-[110px]">
									<LeaveBalanceDonut
										used={stats.leaveBalance.usedLeaves}
										remaining={stats.leaveBalance.remainingLeaves}
									/>
								</CardContent>
							</Card>
						</motion.div>
					)}
				</div>

				{/* 최근 평가 결과 */}
				{stats?.latestEvaluation && (
					<div className="mb-6">
						<Card className="overflow-hidden">
							<div className="h-1 bg-violet-500" />
							<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
								<div className="p-1.5 rounded-md bg-violet-50">
									<Star className="h-4 w-4 text-violet-500" />
								</div>
								<CardTitle className="text-sm font-semibold">최근 평가 결과</CardTitle>
								<Badge variant="outline" className="ml-auto text-xs">
									{stats.latestEvaluation.period}
								</Badge>
							</CardHeader>
							<CardContent className="p-5">
								<div className="flex items-end gap-2">
									<span className="text-4xl font-bold text-primary">
										{stats.latestEvaluation.totalScore?.toFixed(2) ?? 'N/A'}
									</span>
									<span className="text-sm text-muted-foreground mb-1">점</span>
								</div>
								{stats.latestEvaluation.comment && (
									<p className="text-sm text-muted-foreground mt-3 border-l-2 border-muted pl-3 leading-relaxed">
										{stats.latestEvaluation.comment}
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				)}

				{/* 내 연차 신청 내역 */}
				<div className="mb-6">
					<Card>
						<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
							<div className="p-1.5 rounded-md bg-primary/10">
								<ClipboardList className="h-4 w-4 text-primary" />
							</div>
							<CardTitle className="text-sm font-semibold">내 연차 신청 내역</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							{stats?.recentLeaveRequests && stats.recentLeaveRequests.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow className="bg-muted/40 hover:bg-muted/40">
											<TableHead>종류</TableHead>
											<TableHead>시작일</TableHead>
											<TableHead>종료일</TableHead>
											<TableHead>일수</TableHead>
											<TableHead className="hidden sm:table-cell">사유</TableHead>
											<TableHead>상태</TableHead>
											<TableHead>작업</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{stats.recentLeaveRequests.map((leave: any) => (
											<TableRow key={leave.id}>
												<TableCell className="font-medium">
													{LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
												</TableCell>
												<TableCell>{formatDateKorean(new Date(leave.startDate))}</TableCell>
												<TableCell>{formatDateKorean(new Date(leave.endDate))}</TableCell>
												<TableCell>{leave.days}일</TableCell>
												<TableCell className="hidden sm:table-cell text-muted-foreground max-w-[160px] truncate">
													{leave.reason}
												</TableCell>
												<TableCell>
													<Badge className={statusClass[leave.status] ?? ''}>
														{statusText[leave.status] ?? leave.status}
													</Badge>
												</TableCell>
												<TableCell>
													{leave.status === 'PENDING' && (
														<Button
															size="sm"
															variant="outline"
															className="text-destructive border-destructive hover:bg-destructive/10"
															onClick={() => cancelMutation.mutate(leave.id)}
															disabled={cancelMutation.isPending}
														>
															취소
														</Button>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<p className="text-sm text-muted-foreground p-5">연차 신청 내역이 없습니다.</p>
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
