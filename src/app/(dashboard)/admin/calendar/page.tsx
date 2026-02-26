'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import LeaveCalendarView from '@/components/common/LeaveCalendarView';
import PageTransition from '@/components/common/PageTransition';

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

export default function AdminCalendarPage() {
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
		return <p className="text-muted-foreground">로딩 중...</p>;
	}

	return (
		<PageTransition>
			<div>
				<h1 className="text-2xl font-bold mb-4">전체 직원 일정</h1>
				<Card className="mt-2">
					<CardContent className="p-4">
						<LeaveCalendarView leaves={leaves ?? []} title="모든 직원의 승인된 연차 현황" />
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
