import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getNotifications, getUnreadCount } from '@/lib/db/notifications';

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
		}

		const [notifications, unreadCount] = await Promise.all([
			getNotifications(session.user.id),
			getUnreadCount(session.user.id),
		]);

		return NextResponse.json({ notifications, unreadCount });
	} catch (error) {
		console.error('Error fetching notifications:', error);
		return NextResponse.json({ error: '알림 조회 중 오류가 발생했습니다' }, { status: 500 });
	}
}
