'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

interface Notification {
	id: string;
	title: string;
	message: string;
	type: string;
	isRead: boolean;
	createdAt: string;
}

export default function NotificationBell() {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const { data } = useQuery({
		queryKey: ['notifications'],
		queryFn: async () => {
			const res = await fetch('/api/notifications');
			if (!res.ok) throw new Error('Failed to fetch notifications');
			return res.json() as Promise<{ notifications: Notification[]; unreadCount: number }>;
		},
		refetchInterval: 30_000,
	});

	const readMutation = useMutation({
		mutationFn: async (id: string) => {
			await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
		},
	});

	const readAllMutation = useMutation({
		mutationFn: async () => {
			await fetch('/api/notifications/read-all', { method: 'PATCH' });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
		},
	});

	const unreadCount = data?.unreadCount ?? 0;
	const notifications = data?.notifications ?? [];

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="icon" className="relative text-slate-500">
					<Bell className="h-5 w-5" />
					{unreadCount > 0 && (
						<span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 sm:w-96 p-0 max-h-[480px] overflow-hidden flex flex-col">
				<div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
					<p className="font-semibold text-sm">
						알림 {unreadCount > 0 && <span className="text-primary">({unreadCount}개 미읽음)</span>}
					</p>
					{unreadCount > 0 && (
						<button
							onClick={() => readAllMutation.mutate()}
							disabled={readAllMutation.isPending}
							className="text-xs text-primary hover:underline disabled:opacity-50"
						>
							전체 읽음
						</button>
					)}
				</div>

				{notifications.length === 0 ? (
					<div className="px-4 py-8 text-center text-sm text-muted-foreground">
						알림이 없습니다.
					</div>
				) : (
					<ul className="overflow-y-auto">
						{notifications.map((notif, idx) => (
							<li key={notif.id}>
								<button
									onClick={() => {
										if (!notif.isRead) readMutation.mutate(notif.id);
									}}
									className="w-full text-left px-4 py-3 flex gap-2 hover:bg-slate-50 transition-colors"
									style={{ backgroundColor: notif.isRead ? undefined : 'rgba(99,102,241,0.05)' }}
								>
									{!notif.isRead && (
										<span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
									)}
									<div className={notif.isRead ? '' : 'ml-0'}>
										<p
											className="text-[0.8rem] text-slate-900 leading-snug"
											style={{ fontWeight: notif.isRead ? 400 : 600 }}
										>
											{notif.title}
										</p>
										<p className="text-[0.75rem] text-slate-500 mt-0.5">{notif.message}</p>
										<p className="text-[0.7rem] text-slate-400 mt-1">
											{dayjs(notif.createdAt).fromNow()}
										</p>
									</div>
								</button>
								{idx < notifications.length - 1 && <div className="border-b border-slate-100" />}
							</li>
						))}
					</ul>
				)}
			</PopoverContent>
		</Popover>
	);
}
