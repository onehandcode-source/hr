import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { markNotificationAsRead } from '@/lib/db/notifications';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
    }

    const { id } = await params;
    await markNotificationAsRead(id, session.user.id);

    return NextResponse.json({ message: '읽음 처리되었습니다' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: '읽음 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
