import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEvaluations, createEvaluation } from '@/lib/db/evaluations';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const period = searchParams.get('period');

    const filters: any = {};
    if (userId) filters.userId = userId;
    if (period) filters.period = period;

    // 직원은 자신의 평가만 조회 가능
    if (session.user.role !== 'ADMIN') {
      filters.userId = session.user.id;
    }

    const evaluations = await getEvaluations(filters);

    return NextResponse.json(evaluations);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { error: '평가 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, period, scores, comment } = body;

    if (!userId || !period || !scores || !Array.isArray(scores)) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    const evaluation = await createEvaluation({
      userId,
      period,
      evaluatedBy: session.user.id,
      scores,
      comment,
    });

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error: any) {
    console.error('Error creating evaluation:', error);

    // Unique constraint error handling
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '해당 직원의 해당 기간 평가가 이미 존재합니다' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '평가 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
