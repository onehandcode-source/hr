import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEvaluationItems, createEvaluationItem } from '@/lib/db/evaluations';

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
		}

		const searchParams = request.nextUrl.searchParams;
		const isActive = searchParams.get('isActive');
		const category = searchParams.get('category');

		const filters: any = {};
		if (isActive !== null) filters.isActive = isActive === 'true';
		if (category) filters.category = category;

		const items = await getEvaluationItems(filters);

		return NextResponse.json(items);
	} catch (error) {
		console.error('Error fetching evaluation items:', error);
		return NextResponse.json({ error: '평가 항목 조회 중 오류가 발생했습니다' }, { status: 500 });
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
		const { title, description, category, maxScore, weight, order } = body;

		if (!title || !category) {
			return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 });
		}

		const item = await createEvaluationItem({
			title,
			description,
			category,
			maxScore: maxScore || 5,
			weight: weight || 1.0,
			order: order || 0,
		});

		return NextResponse.json(item, { status: 201 });
	} catch (error) {
		console.error('Error creating evaluation item:', error);
		return NextResponse.json({ error: '평가 항목 생성 중 오류가 발생했습니다' }, { status: 500 });
	}
}
