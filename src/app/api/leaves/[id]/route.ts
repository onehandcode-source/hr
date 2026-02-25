import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateLeaveRequestStatus, getLeaveRequest, cancelLeaveRequest } from '@/lib/db/leaves';
import { LeaveStatus } from '@prisma/client';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
		}

		// 관리자만 연차 승인/거부 가능
		if (session.user.role !== 'ADMIN') {
			return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
		}

		const { id } = await params;
		const body = await request.json();
		const { status, reviewNote } = body;

		if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
			return NextResponse.json({ error: '올바른 상태값을 입력해주세요' }, { status: 400 });
		}

		const leaveBeforeUpdate = await getLeaveRequest(id);

		const leave = await updateLeaveRequestStatus(
			id,
			status as LeaveStatus,
			session.user.id,
			reviewNote,
		);

		// 직원에게 알림
		try {
			const { createNotification } = await import('@/lib/db/notifications');
			if (leaveBeforeUpdate) {
				const statusText = status === 'APPROVED' ? '승인' : '거부';
				await createNotification({
					userId: leaveBeforeUpdate.userId,
					title: `연차 신청 ${statusText}`,
					message: `연차 신청이 ${statusText}되었습니다.${reviewNote ? ` (${reviewNote})` : ''}`,
					type: 'LEAVE_STATUS',
					relatedId: id,
				});
			}
		} catch (notifError) {
			console.error('Notification error:', notifError);
		}

		return NextResponse.json(leave);
	} catch (error) {
		console.error('Error updating leave status:', error);
		return NextResponse.json(
			{ error: '연차 상태 업데이트 중 오류가 발생했습니다' },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
		}

		const { id } = await params;

		const leave = await cancelLeaveRequest(id, session.user.id);

		// 관리자에게 알림
		try {
			const { createNotificationsForAdmins } = await import('@/lib/db/notifications');
			await createNotificationsForAdmins({
				title: '연차 신청 취소',
				message: `${session.user.name}님이 연차 신청을 취소했습니다.`,
				type: 'LEAVE_CANCEL',
				relatedId: id,
			});
		} catch (notifError) {
			console.error('Notification error:', notifError);
		}

		return NextResponse.json(leave);
	} catch (error: any) {
		console.error('Error cancelling leave:', error);
		return NextResponse.json(
			{ error: error.message || '연차 취소 중 오류가 발생했습니다' },
			{ status: error.message?.includes('권한') ? 403 : 400 },
		);
	}
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
		}

		const { id } = await params;
		const leave = await getLeaveRequest(id);

		if (!leave) {
			return NextResponse.json({ error: '연차 신청을 찾을 수 없습니다' }, { status: 404 });
		}

		// 직원은 자신의 연차만 조회 가능
		if (session.user.role !== 'ADMIN' && leave.userId !== session.user.id) {
			return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
		}

		return NextResponse.json(leave);
	} catch (error) {
		console.error('Error fetching leave:', error);
		return NextResponse.json({ error: '연차 조회 중 오류가 발생했습니다' }, { status: 500 });
	}
}
