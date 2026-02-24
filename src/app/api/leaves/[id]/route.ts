import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateLeaveRequestStatus, getLeaveRequest } from '@/lib/db/leaves';
import { LeaveStatus } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json(
        { error: '올바른 상태값을 입력해주세요' },
        { status: 400 }
      );
    }

    const leave = await updateLeaveRequestStatus(
      id,
      status as LeaveStatus,
      session.user.id,
      reviewNote
    );

    return NextResponse.json(leave);
  } catch (error) {
    console.error('Error updating leave status:', error);
    return NextResponse.json(
      { error: '연차 상태 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    return NextResponse.json(
      { error: '연차 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
