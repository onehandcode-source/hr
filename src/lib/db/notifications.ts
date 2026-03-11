import { prisma } from '@/lib/prisma';

interface NotificationData {
	title: string;
	message: string;
	type: string;
	relatedId?: string;
}

export async function createNotification(data: NotificationData & { userId: string }) {
	return prisma.notification.create({
		data: {
			userId: data.userId,
			title: data.title,
			message: data.message,
			type: data.type,
			relatedId: data.relatedId,
		},
	});
}

export async function createNotificationsForAdmins(data: NotificationData) {
	const admins = await prisma.user.findMany({
		where: { role: 'ADMIN', isActive: true },
		select: { id: true },
	});

	if (admins.length === 0) return;

	return prisma.notification.createMany({
		data: admins.map((admin) => ({
			userId: admin.id,
			title: data.title,
			message: data.message,
			type: data.type,
			relatedId: data.relatedId,
		})),
	});
}

export async function getNotifications(userId: string) {
	return prisma.notification.findMany({
		where: { userId },
		orderBy: { createdAt: 'desc' },
		take: 20,
	});
}

export async function markNotificationAsRead(id: string, userId: string) {
	return prisma.notification.updateMany({
		where: { id, userId },
		data: { isRead: true },
	});
}

export async function markAllNotificationsAsRead(userId: string) {
	return prisma.notification.updateMany({
		where: { userId, isRead: false },
		data: { isRead: true },
	});
}

export async function getUnreadCount(userId: string) {
	return prisma.notification.count({
		where: { userId, isRead: false },
	});
}
