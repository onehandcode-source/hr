'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
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
} from '@mui/material';

interface Evaluation {
  id: string;
  period: string;
  status: string;
  totalScore: number;
  comment: string;
  createdAt: string;
  scores: Array<{
    score: number;
    comment: string;
    item: {
      title: string;
      category: string;
      maxScore: number;
      weight: number;
    };
  }>;
}

export default function EmployeeEvaluationsPage() {
  const { data: session } = useSession();

  const { data: evaluations, isLoading, error } = useQuery({
    queryKey: ['evaluations', 'my'],
    queryFn: async () => {
      const res = await fetch('/api/evaluations');
      if (!res.ok) throw new Error('Failed to fetch evaluations');
      return res.json() as Promise<Evaluation[]>;
    },
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (error) toast.error('데이터를 불러오는데 실패했습니다.');
  }, [error]);

  if (isLoading) {
    return <Typography>로딩 중...</Typography>;
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          내 평가
        </Typography>
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography>평가 결과가 없습니다.</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const groupScoresByCategory = (scores: Evaluation['scores']) => {
    return scores.reduce((acc, score) => {
      const category = score.item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(score);
      return acc;
    }, {} as Record<string, typeof scores>);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        내 평가
      </Typography>

      {evaluations.map((evaluation) => (
        <Card key={evaluation.id} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{evaluation.period} 평가</Typography>
              <Chip
                label={`총점: ${evaluation.totalScore?.toFixed(2) || 'N/A'}`}
                color="primary"
                size="medium"
              />
            </Box>

            {Object.entries(groupScoresByCategory(evaluation.scores)).map(([category, categoryScores]) => (
              <Box key={category} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {category}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>항목</TableCell>
                        <TableCell>점수</TableCell>
                        <TableCell>코멘트</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categoryScores.map((score, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{score.item.title}</TableCell>
                          <TableCell>
                            {score.score} / {score.item.maxScore}
                          </TableCell>
                          <TableCell>{score.comment || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}

            {evaluation.comment && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  종합 코멘트
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {evaluation.comment}
                </Typography>
              </>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              평가일: {new Date(evaluation.createdAt).toLocaleDateString('ko-KR')}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
