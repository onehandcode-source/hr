'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	IconButton,
	Badge,
	Popover,
	Box,
	Typography,
	List,
	ListItem,
	ListItemText,
	Divider,
	Button,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
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
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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

	const unreadCount = data?.unreadCount ?? 0;
	const notifications = data?.notifications ?? [];

	const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(e.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleNotificationClick = (notif: Notification) => {
		if (!notif.isRead) {
			readMutation.mutate(notif.id);
		}
	};

	return (
		<>
			<IconButton onClick={handleOpen} sx={{ color: 'text.secondary' }}>
				<Badge badgeContent={unreadCount} color="error" max={99}>
					<NotificationsIcon />
				</Badge>
			</IconButton>

			<Popover
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				PaperProps={{
					sx: {
						mt: 1,
						width: 360,
						maxHeight: 480,
						borderRadius: 2,
						border: '1px solid #e2e8f0',
						boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.07)',
					},
				}}
			>
				<Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
					<Typography fontWeight={600} fontSize="0.9rem">
						알림 {unreadCount > 0 && `(${unreadCount}개 미읽음)`}
					</Typography>
				</Box>

				{notifications.length === 0 ? (
					<Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
						<Typography color="text.secondary" fontSize="0.875rem">
							알림이 없습니다.
						</Typography>
					</Box>
				) : (
					<List disablePadding sx={{ overflowY: 'auto', maxHeight: 400 }}>
						{notifications.map((notif, idx) => (
							<Box key={notif.id}>
								<ListItem
									onClick={() => handleNotificationClick(notif)}
									sx={{
										py: 1.5,
										px: 2,
										cursor: 'pointer',
										bgcolor: notif.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
										'&:hover': { bgcolor: '#f8fafc' },
										alignItems: 'flex-start',
									}}
								>
									{!notif.isRead && (
										<Box
											sx={{
												width: 6,
												height: 6,
												borderRadius: '50%',
												bgcolor: 'primary.main',
												mt: 0.75,
												mr: 1,
												flexShrink: 0,
											}}
										/>
									)}
									<ListItemText
										primary={
											<Typography
												fontSize="0.8rem"
												fontWeight={notif.isRead ? 400 : 600}
												color="text.primary"
											>
												{notif.title}
											</Typography>
										}
										secondary={
											<Box>
												<Typography fontSize="0.75rem" color="text.secondary" sx={{ mt: 0.25 }}>
													{notif.message}
												</Typography>
												<Typography fontSize="0.7rem" color="text.disabled" sx={{ mt: 0.5 }}>
													{dayjs(notif.createdAt).fromNow()}
												</Typography>
											</Box>
										}
										sx={{ ml: notif.isRead ? 0 : 0 }}
									/>
								</ListItem>
								{idx < notifications.length - 1 && <Divider sx={{ borderColor: '#f1f5f9' }} />}
							</Box>
						))}
					</List>
				)}
			</Popover>
		</>
	);
}
