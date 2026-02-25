'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ko';
import { calculateWorkdays } from '@/lib/utils/date';

type LeaveType = 'ANNUAL' | 'HALF' | 'SICK' | 'SPECIAL';

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: '연차',
  HALF: '반차',
  SICK: '병가',
  SPECIAL: '경조사',
};

export default function LeaveRequestPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL');
  const [reason, setReason] = useState('');

  // 반차 선택 시 종료일을 시작일과 동일하게 설정
  useEffect(() => {
    if (leaveType === 'HALF' && startDate) {
      setEndDate(startDate);
    }
  }, [leaveType, startDate]);

  // 사용자 연차 잔여 조회
  const { data: leaveBalance } = useQuery({
    queryKey: ['leaveBalance', session?.user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/users/${session?.user?.id}/leave-balance`);
      if (!res.ok) throw new Error('Failed to fetch leave balance');
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create leave request');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
      toast.success('연차 신청이 완료되었습니다.');
      setStartDate(null);
      setEndDate(null);
      setReason('');
      setLeaveType('ANNUAL');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;

    if (leaveType === 'HALF') {
      return 0.5;
    }

    return calculateWorkdays(startDate.toDate(), endDate.toDate());
  };

  const isHalfDay = leaveType === 'HALF';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || (!isHalfDay && !endDate)) {
      toast.error('날짜를 선택해주세요.');
      return;
    }

    if (!isHalfDay && startDate.isAfter(endDate!)) {
      toast.error('종료일은 시작일 이후여야 합니다.');
      return;
    }

    if (!reason.trim()) {
      toast.error('사유를 입력해주세요.');
      return;
    }

    const days = calculateDays();
    const finalEndDate = isHalfDay ? startDate : endDate!;

    createMutation.mutate({
      startDate: startDate.toISOString(),
      endDate: finalEndDate.toISOString(),
      days,
      reason,
      leaveType,
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          연차 신청
        </Typography>

        {leaveBalance && (
          <Alert severity="info" sx={{ mb: 2 }}>
            총 연차: {leaveBalance.totalLeaves}일 | 사용: {leaveBalance.usedLeaves}일 |
            남은 연차: {leaveBalance.remainingLeaves}일
          </Alert>
        )}

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">연차 유형</FormLabel>
                  <RadioGroup
                    row
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  >
                    {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((type) => (
                      <FormControlLabel
                        key={type}
                        value={type}
                        control={<Radio />}
                        label={LEAVE_TYPE_LABELS[type]}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>

                <DatePicker
                  label="시작일"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />

                {!isHalfDay && (
                  <DatePicker
                    label="종료일"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    minDate={startDate || undefined}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
                )}

                {startDate && (isHalfDay || endDate) && (
                  <Alert severity="info">
                    신청 일수: {calculateDays()}일
                  </Alert>
                )}

                <TextField
                  label="사유"
                  multiline
                  rows={4}
                  fullWidth
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="연차 사유를 입력해주세요"
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? '신청 중...' : '신청하기'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
}
