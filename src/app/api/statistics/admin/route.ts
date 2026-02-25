import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminStatistics } from '@/lib/db/statistics';

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
		}

		if (session.user.role !== 'ADMIN') {
			return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
		}

		const statistics = await getAdminStatistics();

		return NextResponse.json(statistics);
	} catch (error) {
		console.error('Error fetching admin statistics:', error);
		return NextResponse.json({ error: '통계 조회 중 오류가 발생했습니다' }, { status: 500 });
	}
}
