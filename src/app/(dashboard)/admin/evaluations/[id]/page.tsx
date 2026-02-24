'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
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
  Chip,
  Divider,
  Button,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs';

interface EvaluationScore {
  id: string;
  score: number;
  comment?: string;
  item: {
    id: string;
    title: string;
    description?: string;
    category: string;
    maxScore: number;
    weight: number;
  };
}

interface Evaluation {
  id: string;
  period: string;
  status: string;
  totalScore: number;
  comment?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    department: string;
    position: string;
  };
  scores: EvaluationScore[];
}

export default function EvaluationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: evaluation, isLoading, error } = useQuery({
    queryKey: ['evaluation', id],
    queryFn: async () => {
      const res = await fetch(`/api/evaluations/${id}`);
      if (!res.ok) throw new Error('Failed to fetch evaluation');
      return res.json() as Promise<Evaluation>;
    },
  });

  useEffect(() => {
    if (error) toast.error('평가 데이터를 불러오는데 실패했습니다.');
  }, [error]);

  if (isLoading) {
    return <Typography>로딩 중...</Typography>;
  }

  if (!evaluation) {
    return null;
  }

  const groupedScores = evaluation.scores.reduce(
    (acc, score) => {
      const cat = score.item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(score);
      return acc;
    },
    {} as Record<string, EvaluationScore[]>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin/evaluations')}
          variant="outlined"
          size="small"
        >
          목록으로
        </Button>
        <Typography variant="h4" component="h1">
          평가 상세
        </Typography>
      </Box>

      {/* 기본 정보 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            기본 정보
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">직원명</Typography>
              <Typography variant="body1" fontWeight="medium">{evaluation.user.name}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">부서 / 직급</Typography>
              <Typography variant="body1">{evaluation.user.department} / {evaluation.user.position}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">평가 기간</Typography>
              <Typography variant="body1" fontWeight="medium">{evaluation.period}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">총점</Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                {evaluation.totalScore.toFixed(2)}점
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">상태</Typography>
              <Chip
                label={evaluation.status === 'COMPLETED' ? '완료' : '임시저장'}
                color={evaluation.status === 'COMPLETED' ? 'success' : 'default'}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">작성일</Typography>
              <Typography variant="body1">
                {dayjs(evaluation.createdAt).format('YYYY년 MM월 DD일')}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 항목별 점수 */}
      {Object.entries(groupedScores).map(([category, scores]) => (
        <Card key={category} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {category}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>항목</TableCell>
                    <TableCell>설명</TableCell>
                    <TableCell align="center">점수</TableCell>
                    <TableCell align="center">가중치</TableCell>
                    <TableCell>코멘트</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scores.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.item.title}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        {s.item.description}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${s.score} / ${s.item.maxScore}`}
                          size="small"
                          color={s.score >= s.item.maxScore * 0.8 ? 'success' : s.score >= s.item.maxScore * 0.5 ? 'warning' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">{s.item.weight}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {s.comment || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}

      {/* 종합 코멘트 */}
      {evaluation.comment && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              종합 코멘트
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {evaluation.comment}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
