import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { markAllNotificationsAsRead } from '@/lib/db/notifications';

export async function PATCH() {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
		}

		await markAllNotificationsAsRead(session.user.id);

		return NextResponse.json({ message: '전체 읽음 처리되었습니다' });
	} catch (error) {
		console.error('Error marking all notifications as read:', error);
		return NextResponse.json({ error: '읽음 처리 중 오류가 발생했습니다' }, { status: 500 });
	}
}
