'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
	Drawer,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Typography,
	Box,
	Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ChecklistIcon from '@mui/icons-material/Checklist';
import CategoryIcon from '@mui/icons-material/Category';
import PeopleIcon from '@mui/icons-material/People';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const drawerWidth = 240;

const SIDEBAR_BG = '#0f172a';
const ACTIVE_BG = 'rgba(99, 102, 241, 0.15)';
const ACTIVE_COLOR = '#818cf8';
const TEXT_COLOR = '#94a3b8';
const HOVER_BG = 'rgba(255, 255, 255, 0.06)';

interface MenuItem {
	text: string;
	href: string;
	icon: React.ReactNode;
	roles?: string[]; // undefined = 모든 역할
}

const menuItems: MenuItem[] = [
	{ text: '대시보드', href: '/admin', icon: <DashboardIcon fontSize="small" />, roles: ['ADMIN'] },
	{
		text: '직원 관리',
		href: '/admin/employees',
		icon: <PeopleIcon fontSize="small" />,
		roles: ['ADMIN'],
	},
	{
		text: '연차 관리',
		href: '/admin/leaves',
		icon: <EventNoteIcon fontSize="small" />,
		roles: ['ADMIN'],
	},
	{
		text: '평가 항목',
		href: '/admin/evaluations/items',
		icon: <CategoryIcon fontSize="small" />,
		roles: ['ADMIN'],
	},
	{
		text: '직원 평가',
		href: '/admin/evaluations',
		icon: <AssessmentIcon fontSize="small" />,
		roles: ['ADMIN'],
	},
	{
		text: '전체 일정',
		href: '/admin/calendar',
		icon: <CalendarMonthIcon fontSize="small" />,
		roles: ['ADMIN'],
	},
	{
		text: '대시보드',
		href: '/employee',
		icon: <DashboardIcon fontSize="small" />,
		roles: ['EMPLOYEE'],
	},
	{
		text: '연차 신청',
		href: '/employee/leaves/request',
		icon: <AddCircleOutlineIcon fontSize="small" />,
		roles: ['EMPLOYEE'],
	},
	{
		text: '연차 달력',
		href: '/employee/leaves/calendar',
		icon: <CalendarTodayIcon fontSize="small" />,
		roles: ['EMPLOYEE'],
	},
	{
		text: '내 평가',
		href: '/employee/evaluations',
		icon: <ChecklistIcon fontSize="small" />,
		roles: ['EMPLOYEE'],
	},
	// 공통 메뉴 (roles 미지정 = 모든 역할)
	{ text: '프로필', href: '/profile', icon: <AccountCircleIcon fontSize="small" /> },
];

interface SidebarProps {
	mobileOpen: boolean;
	onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
	const { data: session } = useSession();
	const pathname = usePathname();

	if (!session) return null;

	const filteredMenuItems = menuItems.filter(
		(item) => item.roles === undefined || item.roles.includes(session.user.role),
	);

	const drawerContent = (
		<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: SIDEBAR_BG }}>
			{/* 로고 영역 */}
			<Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
				<Box
					sx={{
						width: 32,
						height: 32,
						borderRadius: 2,
						bgcolor: 'primary.main',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>HR</Typography>
				</Box>
				<Typography sx={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1rem' }}>
					HR 시스템
				</Typography>
			</Box>

			<Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

			{/* 메뉴 영역 */}
			<Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1.5 }}>
				<Typography
					sx={{
						px: 1.5,
						py: 0.5,
						fontSize: '0.7rem',
						fontWeight: 600,
						letterSpacing: '0.08em',
						textTransform: 'uppercase',
						color: 'rgba(148,163,184,0.5)',
						mb: 0.5,
					}}
				>
					{session.user.role === 'ADMIN' ? '관리자 메뉴' : '직원 메뉴'}
				</Typography>

				<List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
					{filteredMenuItems.map((item) => {
						const isActive = pathname === item.href;
						return (
							<ListItem key={item.href} disablePadding>
								<ListItemButton
									component={Link}
									href={item.href}
									onClick={onClose}
									sx={{
										borderRadius: 2,
										py: 1,
										px: 1.5,
										bgcolor: isActive ? ACTIVE_BG : 'transparent',
										color: isActive ? ACTIVE_COLOR : TEXT_COLOR,
										'&:hover': {
											bgcolor: isActive ? ACTIVE_BG : HOVER_BG,
											color: isActive ? ACTIVE_COLOR : '#e2e8f0',
										},
										transition: 'all 0.15s ease',
									}}
								>
									<ListItemIcon
										sx={{
											color: 'inherit',
											minWidth: 36,
										}}
									>
										{item.icon}
									</ListItemIcon>
									<ListItemText
										primary={item.text}
										primaryTypographyProps={{
											fontSize: '0.875rem',
											fontWeight: isActive ? 600 : 400,
										}}
									/>
									{isActive && (
										<Box
											sx={{
												width: 4,
												height: 4,
												borderRadius: '50%',
												bgcolor: ACTIVE_COLOR,
											}}
										/>
									)}
								</ListItemButton>
							</ListItem>
						);
					})}
				</List>
			</Box>

			{/* 하단 사용자 정보 */}
			<Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
			<Box sx={{ px: 2, py: 2 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
					<Box
						sx={{
							width: 32,
							height: 32,
							borderRadius: '50%',
							bgcolor: 'rgba(99,102,241,0.2)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexShrink: 0,
						}}
					>
						<Typography sx={{ color: ACTIVE_COLOR, fontWeight: 700, fontSize: '0.8rem' }}>
							{session.user.name?.[0] ?? 'U'}
						</Typography>
					</Box>
					<Box sx={{ overflow: 'hidden' }}>
						<Typography
							sx={{ color: '#f1f5f9', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3 }}
							noWrap
						>
							{session.user.name}
						</Typography>
						<Typography sx={{ color: TEXT_COLOR, fontSize: '0.7rem' }} noWrap>
							{session.user.role === 'ADMIN' ? '관리자' : '직원'}
						</Typography>
					</Box>
				</Box>
			</Box>
		</Box>
	);

	return (
		<>
			{/* 모바일 */}
			<Drawer
				variant="temporary"
				open={mobileOpen}
				onClose={onClose}
				ModalProps={{ keepMounted: true }}
				sx={{
					display: { xs: 'block', sm: 'none' },
					'& .MuiDrawer-paper': {
						width: drawerWidth,
						boxSizing: 'border-box',
						border: 'none',
					},
				}}
			>
				{drawerContent}
			</Drawer>

			{/* 데스크탑 */}
			<Drawer
				variant="permanent"
				sx={{
					display: { xs: 'none', sm: 'block' },
					width: drawerWidth,
					flexShrink: 0,
					'& .MuiDrawer-paper': {
						width: drawerWidth,
						boxSizing: 'border-box',
						border: 'none',
					},
				}}
				open
			>
				{drawerContent}
			</Drawer>
		</>
	);
}
