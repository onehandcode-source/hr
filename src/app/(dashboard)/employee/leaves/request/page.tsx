'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { CalendarPlus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { calculateWorkdays } from '@/lib/utils/date';
import { getHolidaysInRange } from '@/lib/utils/holidays';
import PageTransition from '@/components/common/PageTransition';

type LeaveType = 'ANNUAL' | 'HALF_AM' | 'HALF_PM' | 'SICK' | 'SPECIAL';

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
	ANNUAL: '연차',
	HALF_AM: '오전반차',
	HALF_PM: '오후반차',
	SICK: '병가',
	SPECIAL: '경조사',
};

const LEAVE_TYPE_HINTS: Partial<Record<LeaveType, string>> = {
	HALF_AM: '오전 09:00 ~ 13:00',
	HALF_PM: '오후 14:00 ~ 18:00',
};

export default function LeaveRequestPage() {
	const { data: session } = useSession();
	const queryClient = useQueryClient();

	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');
	const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL');
	const isHalfDay = leaveType === 'HALF_AM' || leaveType === 'HALF_PM';
	const [reason, setReason] = useState('');

	useEffect(() => {
		if (isHalfDay && startDate) {
			setEndDate(startDate);
		}
	}, [isHalfDay, startDate]);

	const { data: leaveBalance } = useQuery({
		queryKey: ['leaveBalance', session?.user?.id],
		queryFn: async () => {
			const res = await fetch(`/api/users/${session?.user?.id}/leave-balance`);
			if (!res.ok) throw new Error('Failed to fetch leave balance');
			return res.json();
		},
		enabled: !!session?.user?.id,
	});

	const { data: existingLeaves = [] } = useQuery({
		queryKey: ['leaves', session?.user?.id],
		queryFn: async () => {
			const res = await fetch('/api/leaves');
			if (!res.ok) throw new Error('Failed to fetch leaves');
			return res.json();
		},
		enabled: !!session?.user?.id,
	});

	const createMutation = useMutation({
		mutationFn: async (data: any) => {
			const res = await fetch('/api/leaves', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || 'Failed to create leave request');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['leaves'] });
			queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
			toast.success('연차 신청이 완료되었습니다.');
			setStartDate('');
			setEndDate('');
			setReason('');
			setLeaveType('ANNUAL');
		},
		onError: (err: Error) => {
			toast.error(err.message);
		},
	});

	const calculateDays = () => {
		if (!startDate) return 0;
		if (isHalfDay) return 0.5;
		if (!endDate) return 0;
		return calculateWorkdays(dayjs(startDate).toDate(), dayjs(endDate).toDate());
	};

	const calculatedDays = calculateDays();
	const effectiveRemaining = leaveBalance?.effectiveRemaining ?? leaveBalance?.remainingLeaves ?? Infinity;
	const isExceeding = !!leaveBalance && calculatedDays > 0 && calculatedDays > effectiveRemaining;

	// 선택 기간 내 공휴일 목록
	const holidaysInRange = useMemo(() => {
		if (!startDate || isHalfDay) return [];
		const finalEnd = endDate || startDate;
		return getHolidaysInRange(dayjs(startDate).toDate(), dayjs(finalEnd).toDate());
	}, [startDate, endDate, isHalfDay]);

	// 날짜 중복 검사 (PENDING + APPROVED 상태의 기존 연차와 비교)
	const conflictingLeave = (() => {
		if (!startDate) return null;
		const finalEnd = isHalfDay ? startDate : endDate;
		if (!finalEnd) return null;
		const newStart = dayjs(startDate).startOf('day');
		const newEnd = dayjs(finalEnd).startOf('day');
		return (existingLeaves as any[]).find((leave) => {
			if (leave.status !== 'PENDING' && leave.status !== 'APPROVED') return false;
			const s = dayjs(leave.startDate).startOf('day');
			const e = dayjs(leave.endDate).startOf('day');
			return newStart.valueOf() <= e.valueOf() && newEnd.valueOf() >= s.valueOf();
		}) ?? null;
	})();

	const isOverlapping = !!conflictingLeave;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!startDate || (!isHalfDay && !endDate)) {
			toast.error('날짜를 선택해주세요.');
			return;
		}
		if (!isHalfDay && dayjs(startDate).isAfter(dayjs(endDate))) {
			toast.error('종료일은 시작일 이후여야 합니다.');
			return;
		}
		if (!reason.trim()) {
			toast.error('사유를 입력해주세요.');
			return;
		}
		if (isOverlapping) {
			const fmt = (d: string) => dayjs(d).format('M월 D일');
			toast.error(`해당 기간에 이미 신청된 연차가 있습니다. (${fmt(conflictingLeave.startDate)}~${fmt(conflictingLeave.endDate)})`);
			return;
		}
		if (isExceeding) {
			toast.error(`잔여 연차가 부족합니다. (신청: ${calculatedDays}일, 신청 가능: ${effectiveRemaining}일)`);
			return;
		}
		const finalEndDate = isHalfDay ? startDate : endDate;
		createMutation.mutate({
			startDate: dayjs(startDate).toISOString(),
			endDate: dayjs(finalEndDate).toISOString(),
			days: calculatedDays,
			reason,
			leaveType,
		});
	};

	const previewError = isOverlapping || isExceeding;
	const hasPreview = startDate && (isHalfDay || endDate);

	return (
		<PageTransition>
			<div>
				<div className="mb-6">
					<h1 className="text-2xl font-bold">연차 신청</h1>
					<p className="text-sm text-muted-foreground mt-0.5">연차를 신청하고 승인을 받으세요</p>
				</div>

				{/* 잔여 연차 현황 */}
				{leaveBalance && (
					<div className="grid grid-cols-3 gap-3 mb-4">
						{[
							{ label: '총 연차', value: leaveBalance.totalLeaves, unit: '일', color: 'bg-indigo-500', textColor: 'text-indigo-600' },
							{ label: '사용 연차', value: leaveBalance.usedLeaves, unit: '일', color: 'bg-orange-500', textColor: 'text-orange-600' },
							{ label: '잔여 연차', value: leaveBalance.remainingLeaves, unit: '일', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
						].map((item) => (
							<Card key={item.label} className="overflow-hidden">
								<div className={`h-1 ${item.color}`} />
								<CardContent className="p-3 sm:p-4 text-center">
									<p className="text-xs text-muted-foreground mb-1">{item.label}</p>
									<p className={`text-2xl font-bold ${item.textColor}`}>
										{item.value}
										<span className="text-sm font-normal ml-0.5">{item.unit}</span>
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				)}

				<Card>
					<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
						<div className="p-1.5 rounded-md bg-primary/10">
							<CalendarPlus className="h-4 w-4 text-primary" />
						</div>
						<CardTitle className="text-sm font-semibold">신청서 작성</CardTitle>
					</CardHeader>
					<CardContent className="p-5">
						<form onSubmit={handleSubmit} className="flex flex-col gap-5">
							{/* 연차 유형 */}
							<div className="space-y-2">
								<Label>연차 유형</Label>
								<RadioGroup
									value={leaveType}
									onValueChange={(v) => setLeaveType(v as LeaveType)}
									className="flex flex-row flex-wrap gap-4"
								>
									{(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((type) => (
										<div key={type} className="flex items-center gap-2">
											<RadioGroupItem value={type} id={type} />
											<Label htmlFor={type}>{LEAVE_TYPE_LABELS[type]}</Label>
										</div>
									))}
								</RadioGroup>
								{LEAVE_TYPE_HINTS[leaveType] && (
									<p className="text-xs text-muted-foreground mt-1">
										{LEAVE_TYPE_HINTS[leaveType]}
									</p>
								)}
							</div>

							{/* 시작일 */}
							<div className="space-y-1.5">
								<Label htmlFor="startDate">시작일</Label>
								<Input
									id="startDate"
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									required
								/>
							</div>

							{/* 종료일 */}
							{!isHalfDay && (
								<div className="space-y-1.5">
									<Label htmlFor="endDate">종료일</Label>
									<Input
										id="endDate"
										type="date"
										value={endDate}
										min={startDate}
										onChange={(e) => setEndDate(e.target.value)}
										required
									/>
								</div>
							)}

							{/* 신청 일수 미리보기 */}
							{hasPreview && (
								<div className="space-y-2">
									<Alert className={previewError ? 'border-destructive bg-destructive/5' : 'border-primary/20 bg-primary/5'}>
										<AlertDescription className={previewError ? 'text-destructive' : ''}>
											<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
												<span>신청 일수: <strong>{calculatedDays}일</strong></span>
												{holidaysInRange.length > 0 && !isHalfDay && (
													<span className="text-muted-foreground text-xs">
														(공휴일 {holidaysInRange.length}일 제외)
													</span>
												)}
												{isOverlapping && conflictingLeave && (
													<span className="font-medium text-destructive">
														— 기간 중복 ({dayjs(conflictingLeave.startDate).format('M/D')}~{dayjs(conflictingLeave.endDate).format('M/D')} 이미 신청됨)
													</span>
												)}
												{!isOverlapping && isExceeding && (
													<span className="font-medium text-destructive">
														— 잔여 연차 초과 (신청 가능: {effectiveRemaining}일)
													</span>
												)}
											</div>
										</AlertDescription>
									</Alert>

									{/* 공휴일 상세 목록 */}
									{holidaysInRange.length > 0 && !isHalfDay && (
										<div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 px-4 py-3">
											<div className="flex items-center gap-1.5 mb-2">
												<Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
												<p className="text-xs font-medium text-blue-700 dark:text-blue-400">
													선택 기간 내 공휴일 {holidaysInRange.length}일 — 연차에서 자동 제외됩니다
												</p>
											</div>
											<div className="flex flex-wrap gap-1.5">
												{holidaysInRange.map(({ date, name }) => (
													<Badge
														key={date}
														variant="secondary"
														className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200"
													>
														{dayjs(date).format('M월 D일')} {name}
													</Badge>
												))}
											</div>
										</div>
									)}
								</div>
							)}

							{/* 사유 */}
							<div className="space-y-1.5">
								<Label htmlFor="reason">사유</Label>
								<Textarea
									id="reason"
									rows={4}
									required
									value={reason}
									onChange={(e) => setReason(e.target.value)}
									placeholder="연차 사유를 입력해주세요"
								/>
							</div>

							<Button type="submit" size="lg" disabled={createMutation.isPending || isOverlapping || isExceeding}>
								{createMutation.isPending ? '신청 중...' : '신청하기'}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
