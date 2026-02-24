'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { formatDateKorean } from '@/lib/utils/date';
import LeaveCalendarView from '@/components/common/LeaveCalendarView';

interface LeaveEvent {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  user: {
    name: string;
    department: string;
  };
}

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['statistics', 'admin'],
    queryFn: async () => {
      const res = await fetch('/api/statistics/admin');
      if (!res.ok) throw new Error('Failed to fetch statistics');
      return res.json();
    },
  });

  const { data: allLeaves } = useQuery({
    queryKey: ['leaves', 'all-approved'],
    queryFn: async () => {
      const res = await fetch('/api/leaves/all');
      if (!res.ok) throw new Error('Failed to fetch leaves');
      return res.json() as Promise<LeaveEvent[]>;
    },
  });

  useEffect(() => {
    if (error) toast.error('통계 데이터를 불러오는데 실패했습니다.');
  }, [error]);

  if (isLoading) {
    return <Typography>로딩 중...</Typography>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '대기중';
      case 'APPROVED':
        return '승인';
      case 'REJECTED':
        return '거부';
      default:
        return status;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        관리자 대시보드
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                총 직원 수
              </Typography>
              <Typography variant="h3">{stats?.totalEmployees || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                대기 중인 연차 신청
              </Typography>
              <Typography variant="h3">{stats?.pendingLeaves || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                완료된 평가
              </Typography>
              <Typography variant="h3">{stats?.completedEvaluations || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          최근 연차 신청
        </Typography>
        <Card>
          <CardContent>
            {stats?.recentLeaves && stats.recentLeaves.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>직원명</TableCell>
                      <TableCell>부서</TableCell>
                      <TableCell>시작일</TableCell>
                      <TableCell>종료일</TableCell>
                      <TableCell>일수</TableCell>
                      <TableCell>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.recentLeaves.map((leave: any) => (
                      <TableRow key={leave.id}>
                        <TableCell>{leave.user.name}</TableCell>
                        <TableCell>{leave.user.department}</TableCell>
                        <TableCell>{formatDateKorean(new Date(leave.startDate))}</TableCell>
                        <TableCell>{formatDateKorean(new Date(leave.endDate))}</TableCell>
                        <TableCell>{leave.days}일</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(leave.status)}
                            color={getStatusColor(leave.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">최근 연차 신청이 없습니다.</Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* 전체 직원 일정 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          전체 직원 일정
        </Typography>
        <Card>
          <CardContent>
            <LeaveCalendarView
              leaves={allLeaves ?? []}
              title="승인된 연차 현황"
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
