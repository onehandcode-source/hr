'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { calculateWorkdays } from '@/lib/utils/date';
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

	// 반차 선택 시 종료일을 시작일과 동일하게 설정
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

		const days = calculateDays();
		const finalEndDate = isHalfDay ? startDate : endDate;

		createMutation.mutate({
			startDate: dayjs(startDate).toISOString(),
			endDate: dayjs(finalEndDate).toISOString(),
			days,
			reason,
			leaveType,
		});
	};

	return (
		<PageTransition>
			<div>
				<h1 className="text-2xl font-bold mb-4">연차 신청</h1>

				{leaveBalance && (
					<Alert className="mb-4">
						<AlertDescription>
							총 연차: {leaveBalance.totalLeaves}일 | 사용: {leaveBalance.usedLeaves}일 | 남은 연차:{' '}
							{leaveBalance.remainingLeaves}일
						</AlertDescription>
					</Alert>
				)}

				<Card>
					<CardContent className="p-6">
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

							{/* 종료일 (반차가 아닌 경우) */}
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
							{startDate && (isHalfDay || endDate) && (
								<Alert>
									<AlertDescription>신청 일수: {calculateDays()}일</AlertDescription>
								</Alert>
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

							<Button type="submit" size="lg" disabled={createMutation.isPending}>
								{createMutation.isPending ? '신청 중...' : '신청하기'}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
