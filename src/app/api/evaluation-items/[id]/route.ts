import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
	getEvaluationItem,
	updateEvaluationItem,
	deleteEvaluationItem,
} from '@/lib/db/evaluations';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
		}

		const { id } = await params;
		const item = await getEvaluationItem(id);

		if (!item) {
			return NextResponse.json({ error: '평가 항목을 찾을 수 없습니다' }, { status: 404 });
		}

		return NextResponse.json(item);
	} catch (error) {
		console.error('Error fetching evaluation item:', error);
		return NextResponse.json({ error: '평가 항목 조회 중 오류가 발생했습니다' }, { status: 500 });
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

		const item = await updateEvaluationItem(id, body);

		return NextResponse.json(item);
	} catch (error) {
		console.error('Error updating evaluation item:', error);
		return NextResponse.json({ error: '평가 항목 수정 중 오류가 발생했습니다' }, { status: 500 });
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

		if (session.user.role !== 'ADMIN') {
			return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
		}

		const { id } = await params;
		await deleteEvaluationItem(id);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting evaluation item:', error);
		return NextResponse.json({ error: '평가 항목 삭제 중 오류가 발생했습니다' }, { status: 500 });
	}
}
