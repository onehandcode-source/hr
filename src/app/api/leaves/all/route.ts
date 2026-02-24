import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
    }

    const leaves = await prisma.annualLeave.findMany({
      where: { status: 'APPROVED' },
      include: {
        user: {
          select: {
            name: true,
            department: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json(leaves);
  } catch (error) {
    console.error('Error fetching all leaves:', error);
    return NextResponse.json(
      { error: '연차 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
