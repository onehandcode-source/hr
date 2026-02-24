import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEmployeeStatistics } from '@/lib/db/statistics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
    }

    const statistics = await getEmployeeStatistics(session.user.id);

    return NextResponse.json(statistics);
  } catch (error) {
    console.error('Error fetching employee statistics:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
