'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { formatDateKorean } from '@/lib/utils/date';

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: '연차',
  HALF: '반차',
  SICK: '병가',
  SPECIAL: '경조사',
};

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  leaveType: string;
  createdAt: string;
  user: {
    name: string;
    department: string;
    position: string;
  };
  reviewNote?: string;
}

export default function AdminLeavesPage() {
  const queryClient = useQueryClient();
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null);

  const { data: leaves, isLoading, error } = useQuery({
    queryKey: ['leaves', 'admin'],
    queryFn: async () => {
      const res = await fetch('/api/leaves?status=PENDING');
      if (!res.ok) throw new Error('Failed to fetch leaves');
      return res.json() as Promise<LeaveRequest[]>;
    },
  });

  useEffect(() => {
    if (error) toast.error('데이터를 불러오는데 실패했습니다.');
  }, [error]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
      const res = await fetch(`/api/leaves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNote: note }),
      });
      if (!res.ok) throw new Error('Failed to update leave');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success(variables.status === 'APPROVED' ? '연차가 승인되었습니다.' : '연차가 거부되었습니다.');
      handleCloseDialog();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleOpenDialog = (leave: LeaveRequest, action: 'APPROVED' | 'REJECTED') => {
    setSelectedLeave(leave);
    setActionType(action);
    setReviewNote('');
  };

  const handleCloseDialog = () => {
    setSelectedLeave(null);
    setActionType(null);
    setReviewNote('');
  };

  const handleSubmit = () => {
    if (!selectedLeave || !actionType) return;
    updateMutation.mutate({
      id: selectedLeave.id,
      status: actionType,
      note: reviewNote,
    });
  };

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

  if (isLoading) {
    return <Typography>로딩 중...</Typography>;
  }


  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        연차 관리
      </Typography>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>직원명</TableCell>
                  <TableCell>부서/직급</TableCell>
                  <TableCell>종류</TableCell>
                  <TableCell>시작일</TableCell>
                  <TableCell>종료일</TableCell>
                  <TableCell>일수</TableCell>
                  <TableCell>사유</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves && leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      대기 중인 연차 신청이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves?.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell>{leave.user.name}</TableCell>
                      <TableCell>
                        {leave.user.department} / {leave.user.position}
                      </TableCell>
                      <TableCell>
                        {LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
                      </TableCell>
                      <TableCell>{formatDateKorean(new Date(leave.startDate))}</TableCell>
                      <TableCell>{formatDateKorean(new Date(leave.endDate))}</TableCell>
                      <TableCell>{leave.days}일</TableCell>
                      <TableCell>{leave.reason}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(leave.status)}
                          color={getStatusColor(leave.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {leave.status === 'PENDING' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleOpenDialog(leave, 'APPROVED')}
                            >
                              승인
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleOpenDialog(leave, 'REJECTED')}
                            >
                              거부
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLeave} onClose={handleCloseDialog}>
        <DialogTitle>
          연차 {actionType === 'APPROVED' ? '승인' : '거부'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="메모 (선택사항)"
            fullWidth
            multiline
            rows={3}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleSubmit} variant="contained">
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
