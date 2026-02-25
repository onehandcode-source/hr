import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserLeaveBalance } from '@/lib/db/leaves';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
		}

		const { id } = await params;

		// 직원은 자신의 정보만 조회 가능
		if (session.user.role !== 'ADMIN' && session.user.id !== id) {
			return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
		}

		const balance = await getUserLeaveBalance(id);

		if (!balance) {
			return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
		}

		return NextResponse.json(balance);
	} catch (error) {
		console.error('Error fetching leave balance:', error);
		return NextResponse.json({ error: '연차 잔여 조회 중 오류가 발생했습니다' }, { status: 500 });
	}
}
