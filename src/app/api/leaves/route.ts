import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLeaveRequests, createLeaveRequest, getUserLeaveBalance, checkLeaveOverlap } from '@/lib/db/leaves';
import { LeaveStatus, LeaveType } from '@prisma/client';

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
		}

		const searchParams = request.nextUrl.searchParams;
		const status = searchParams.get('status') as LeaveStatus | null;
		const userId = searchParams.get('userId');
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

		const filters: any = {};
		if (status) filters.status = status;
		if (userId) filters.userId = userId;
		if (startDate) filters.startDate = new Date(startDate);
		if (endDate) filters.endDate = new Date(endDate);

		// 직원은 자신의 연차만 조회 가능
		if (session.user.role !== 'ADMIN') {
			filters.userId = session.user.id;
		}

		const leaves = await getLeaveRequests(filters);

		return NextResponse.json(leaves);
	} catch (error) {
		console.error('Error fetching leaves:', error);
		return NextResponse.json({ error: '연차 목록 조회 중 오류가 발생했습니다' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
		}

		const body = await request.json();
		const { startDate, endDate, days, reason, leaveType } = body;

		if (!startDate || !endDate || !days || !reason) {
			return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 });
		}

		const parsedDays = parseFloat(days);

		if (isNaN(parsedDays) || parsedDays <= 0) {
			return NextResponse.json({ error: '휴가 일수는 0보다 커야 합니다' }, { status: 400 });
		}

		const start = new Date(startDate);
		const end = new Date(endDate);
		if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
			return NextResponse.json({ error: '올바른 날짜 범위를 입력해주세요' }, { status: 400 });
		}

		// 날짜 중복 확인 (PENDING + APPROVED)
		const overlap = await checkLeaveOverlap(
			session.user.id,
			new Date(startDate),
			new Date(endDate),
		);
		if (overlap.overlapping) {
			const fmt = (d: Date) =>
				new Date(d).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
			const conflictDesc = overlap.conflicts
				.map((c) => `${fmt(c.startDate)}~${fmt(c.endDate)}`)
				.join(', ');
			return NextResponse.json(
				{ error: `해당 기간에 이미 신청된 연차가 있습니다. (${conflictDesc})` },
				{ status: 409 },
			);
		}

		// 잔여 연차 초과 방지 (대기 중인 신청 포함)
		const balance = await getUserLeaveBalance(session.user.id);
		if (balance && parsedDays > balance.effectiveRemaining) {
			return NextResponse.json(
				{
					error: `잔여 연차가 부족합니다. (신청: ${parsedDays}일, 신청 가능: ${balance.effectiveRemaining}일)`,
				},
				{ status: 400 },
			);
		}

		const leave = await createLeaveRequest({
			userId: session.user.id,
			startDate: new Date(startDate),
			endDate: new Date(endDate),
			days: parsedDays,
			reason,
			leaveType: (leaveType as LeaveType) ?? 'ANNUAL',
		});

		// 관리자에게 알림 (실패해도 메인 로직에 영향 없음)
		try {
			const { createNotificationsForAdmins } = await import('@/lib/db/notifications');
			await createNotificationsForAdmins({
				title: '새 연차 신청',
				message: `${session.user.name}님이 연차를 신청했습니다.`,
				type: 'LEAVE_REQUEST',
				relatedId: leave.id,
			});
		} catch (notifError) {
			console.error('Notification error:', notifError);
		}

		return NextResponse.json(leave, { status: 201 });
	} catch (error) {
		console.error('Error creating leave request:', error);
		return NextResponse.json({ error: '연차 신청 중 오류가 발생했습니다' }, { status: 500 });
	}
}
