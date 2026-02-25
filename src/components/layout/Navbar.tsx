'use client';

import { signOut, useSession } from 'next-auth/react';
import {
	AppBar,
	Toolbar,
	Box,
	Avatar,
	Menu,
	MenuItem,
	IconButton,
	Typography,
	Divider,
} from '@mui/material';
import { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationBell from './NotificationBell';

interface NavbarProps {
	onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
	const { data: session } = useSession();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const handleLogout = async () => {
		setAnchorEl(null);
		await signOut({ callbackUrl: '/login' });
	};

	return (
		<AppBar
			position="fixed"
			elevation={0}
			sx={{
				width: { sm: 'calc(100% - 240px)' },
				ml: { sm: '240px' },
				bgcolor: 'rgba(248, 250, 252, 0.85)',
				backdropFilter: 'blur(12px)',
				borderBottom: '1px solid #e2e8f0',
				color: 'text.primary',
			}}
		>
			<Toolbar sx={{ gap: 2, minHeight: { xs: 56, sm: 64 } }}>
				{/* 모바일 햄버거 */}
				<IconButton
					edge="start"
					onClick={onMenuClick}
					sx={{ display: { sm: 'none' }, color: 'text.secondary' }}
				>
					<MenuIcon />
				</IconButton>

				<Box sx={{ flexGrow: 1 }} />

				{/* 알림 벨 */}
				{session && <NotificationBell />}

				{/* 우측 유저 영역 */}
				{session && (
					<Box
						onClick={(e) => setAnchorEl(e.currentTarget)}
						sx={{
							display: 'flex',
							alignItems: 'center',
							gap: 1,
							cursor: 'pointer',
							px: 1.5,
							py: 0.75,
							borderRadius: 2,
							border: '1px solid #e2e8f0',
							bgcolor: '#fff',
							'&:hover': { bgcolor: '#f8fafc' },
							transition: 'all 0.15s ease',
						}}
					>
						<Avatar
							sx={{
								width: 28,
								height: 28,
								bgcolor: 'primary.main',
								fontSize: '0.75rem',
								fontWeight: 700,
							}}
						>
							{session.user.name?.[0] ?? 'U'}
						</Avatar>
						<Box sx={{ display: { xs: 'none', sm: 'block' } }}>
							<Typography
								sx={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2, color: 'text.primary' }}
							>
								{session.user.name}
							</Typography>
							<Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.2 }}>
								{session.user.role === 'ADMIN' ? '관리자' : '직원'}
							</Typography>
						</Box>
						<KeyboardArrowDownIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
					</Box>
				)}

				<Menu
					anchorEl={anchorEl}
					open={Boolean(anchorEl)}
					onClose={() => setAnchorEl(null)}
					transformOrigin={{ horizontal: 'right', vertical: 'top' }}
					anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
					PaperProps={{
						sx: {
							mt: 1,
							minWidth: 200,
							borderRadius: 2,
							border: '1px solid #e2e8f0',
							boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.07)',
						},
					}}
				>
					<Box sx={{ px: 2, py: 1.5 }}>
						<Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
							{session?.user.name}
						</Typography>
						<Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
							{session?.user.email}
						</Typography>
					</Box>
					<Divider />
					<MenuItem
						onClick={handleLogout}
						sx={{ gap: 1.5, color: 'error.main', fontSize: '0.875rem', mt: 0.5 }}
					>
						<LogoutIcon fontSize="small" />
						로그아웃
					</MenuItem>
				</Menu>
			</Toolbar>
		</AppBar>
	);
}
