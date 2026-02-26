import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUsers, createUser } from '@/lib/db/users';
import { hashPassword } from '@/lib/utils/password';

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
		}

		if (session.user.role !== 'ADMIN') {
			return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
		}

		const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';
		const users = await getUsers(includeInactive);

		return NextResponse.json(users);
	} catch (error) {
		console.error('Error fetching users:', error);
		return NextResponse.json({ error: '사용자 목록 조회 중 오류가 발생했습니다' }, { status: 500 });
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
		const { loginId, email, password, name, department, position, hireDate, totalLeaves } = body;

		if (!loginId || !email || !password || !name) {
			return NextResponse.json({ error: '아이디, 이메일, 비밀번호, 이름은 필수입니다' }, { status: 400 });
		}

		if (password.length < 8) {
			return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다' }, { status: 400 });
		}

		const hashedPw = await hashPassword(password);

		const user = await createUser({
			loginId,
			email,
			password: hashedPw,
			name,
			department,
			position,
			hireDate: hireDate ? new Date(hireDate) : undefined,
			totalLeaves: totalLeaves ? parseInt(totalLeaves) : 15,
		});

		// 비밀번호 제외하고 반환
		const { password: _, ...userWithoutPassword } = user;
		return NextResponse.json(userWithoutPassword, { status: 201 });
	} catch (error: any) {
		console.error('Error creating user:', error);
		if (error.code === 'P2002') {
			return NextResponse.json({ error: '이미 사용 중인 아이디 또는 이메일입니다' }, { status: 409 });
		}
		return NextResponse.json({ error: '사용자 생성 중 오류가 발생했습니다' }, { status: 500 });
	}
}
