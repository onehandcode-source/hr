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
  Toolbar,
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

const drawerWidth = 240;

interface MenuItem {
  text: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  {
    text: '대시보드',
    href: '/admin',
    icon: <DashboardIcon />,
    roles: ['ADMIN'],
  },
  {
    text: '연차 관리',
    href: '/admin/leaves',
    icon: <EventNoteIcon />,
    roles: ['ADMIN'],
  },
  {
    text: '평가 항목',
    href: '/admin/evaluations/items',
    icon: <CategoryIcon />,
    roles: ['ADMIN'],
  },
  {
    text: '직원 평가',
    href: '/admin/evaluations',
    icon: <AssessmentIcon />,
    roles: ['ADMIN'],
  },
  {
    text: '전체 일정',
    href: '/admin/calendar',
    icon: <CalendarMonthIcon />,
    roles: ['ADMIN'],
  },
  {
    text: '대시보드',
    href: '/employee',
    icon: <DashboardIcon />,
    roles: ['EMPLOYEE'],
  },
  {
    text: '연차 신청',
    href: '/employee/leaves/request',
    icon: <AddCircleOutlineIcon />,
    roles: ['EMPLOYEE'],
  },
  {
    text: '연차 달력',
    href: '/employee/leaves/calendar',
    icon: <CalendarTodayIcon />,
    roles: ['EMPLOYEE'],
  },
  {
    text: '내 평가',
    href: '/employee/evaluations',
    icon: <ChecklistIcon />,
    roles: ['EMPLOYEE'],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles?.includes(session.user.role)
  );

  const drawerContent = (
    <>
      <Toolbar />
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.href} disablePadding>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={pathname === item.href}
              onClick={onClose}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <>
      {/* 모바일: temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* 데스크탑: permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
