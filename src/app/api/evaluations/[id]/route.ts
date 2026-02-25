import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEvaluation, updateEvaluation } from '@/lib/db/evaluations';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
		}

		const { id } = await params;
		const evaluation = await getEvaluation(id);

		if (!evaluation) {
			return NextResponse.json({ error: '평가를 찾을 수 없습니다' }, { status: 404 });
		}

		// 직원은 자신의 평가만 조회 가능
		if (session.user.role !== 'ADMIN' && evaluation.userId !== session.user.id) {
			return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
		}

		return NextResponse.json(evaluation);
	} catch (error) {
		console.error('Error fetching evaluation:', error);
		return NextResponse.json({ error: '평가 조회 중 오류가 발생했습니다' }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
		}

		if (session.user.role !== 'ADMIN') {
			return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
		}

		const { id } = await params;
		const body = await request.json();

		const evaluation = await updateEvaluation(id, body);

		return NextResponse.json(evaluation);
	} catch (error) {
		console.error('Error updating evaluation:', error);
		return NextResponse.json({ error: '평가 수정 중 오류가 발생했습니다' }, { status: 500 });
	}
}
