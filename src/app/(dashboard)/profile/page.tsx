'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
} from '@mui/material';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await fetch(`/api/users/${session?.user?.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '비밀번호 변경 실패');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    passwordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        프로필
      </Typography>

      {/* 기본 정보 카드 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            기본 정보
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography color="text.secondary" sx={{ minWidth: 80 }}>이름</Typography>
              <Typography fontWeight={600}>{session?.user?.name}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography color="text.secondary" sx={{ minWidth: 80 }}>이메일</Typography>
              <Typography>{session?.user?.email}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography color="text.secondary" sx={{ minWidth: 80 }}>부서</Typography>
              <Typography>{session?.user?.department || '-'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography color="text.secondary" sx={{ minWidth: 80 }}>직급</Typography>
              <Typography>{session?.user?.position || '-'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography color="text.secondary" sx={{ minWidth: 80 }}>권한</Typography>
              <Typography>{session?.user?.role === 'ADMIN' ? '관리자' : '직원'}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 카드 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            비밀번호 변경
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <form onSubmit={handlePasswordChange}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
              <TextField
                label="현재 비밀번호"
                type="password"
                fullWidth
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <TextField
                label="새 비밀번호 (8자 이상)"
                type="password"
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <TextField
                label="새 비밀번호 확인"
                type="password"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                type="submit"
                variant="contained"
                disabled={passwordMutation.isPending}
                sx={{ alignSelf: 'flex-start' }}
              >
                {passwordMutation.isPending ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
