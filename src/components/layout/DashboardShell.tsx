'use client';

import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar onMenuClick={() => setMobileOpen(true)} />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          minHeight: '100vh',
          bgcolor: 'background.default',
          minWidth: 0,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '56px !important', sm: '64px !important' } }} />
        {children}
      </Box>
    </Box>
  );
}
