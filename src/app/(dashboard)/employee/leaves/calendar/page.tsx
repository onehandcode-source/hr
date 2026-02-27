'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarRange } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function LeaveCalendarPage() {
	const {
		data: leaves,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['leaves', 'all-approved'],
		queryFn: async () => {
			const res = await fetch('/api/leaves/all');
			if (!res.ok) throw new Error('Failed to fetch leaves');
			return res.json() as Promise<LeaveEvent[]>;
		},
	});

	useEffect(() => {
		if (error) toast.error('데이터를 불러오는데 실패했습니다.');
	}, [error]);

	if (isLoading) {
		return <Loading />;
	}

	return (
		<PageTransition>
			<div>
				<div className="mb-6">
					<h1 className="text-2xl font-bold">연차 달력</h1>
					<p className="text-sm text-muted-foreground mt-0.5">팀 전체 연차 일정을 확인하세요</p>
				</div>
				<Card>
					<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
						<div className="p-1.5 rounded-md bg-primary/10">
							<CalendarRange className="h-4 w-4 text-primary" />
						</div>
						<CardTitle className="text-sm font-semibold">전체 연차 현황</CardTitle>
					</CardHeader>
					<CardContent className="p-4">
						<LeaveCalendarView leaves={leaves ?? []} />
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
