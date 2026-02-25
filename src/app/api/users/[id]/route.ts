import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateUser } from '@/lib/db/users';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const body = await request.json();
    const { name, department, position, hireDate, totalLeaves, isActive } = body;

    const user = await updateUser(id, {
      ...(name !== undefined && { name }),
      ...(department !== undefined && { department }),
      ...(position !== undefined && { position }),
      ...(hireDate !== undefined && { hireDate: new Date(hireDate) }),
      ...(totalLeaves !== undefined && { totalLeaves: parseInt(totalLeaves) }),
      ...(isActive !== undefined && { isActive }),
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: '사용자 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
