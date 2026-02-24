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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface EvaluationItem {
  id: string;
  title: string;
  description: string;
  category: string;
  maxScore: number;
  weight: number;
  order: number;
  isActive: boolean;
}

export default function EvaluationItemsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EvaluationItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    maxScore: 5,
    weight: 1.0,
    order: 0,
  });

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['evaluation-items'],
    queryFn: async () => {
      const res = await fetch('/api/evaluation-items');
      if (!res.ok) throw new Error('Failed to fetch items');
      return res.json() as Promise<EvaluationItem[]>;
    },
  });

  useEffect(() => {
    if (error) toast.error('데이터를 불러오는데 실패했습니다.');
  }, [error]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/evaluation-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-items'] });
      toast.success('항목이 추가되었습니다.');
      handleCloseDialog();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/evaluation-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-items'] });
      toast.success('항목이 수정되었습니다.');
      handleCloseDialog();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/evaluation-items/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-items'] });
      toast.success('항목이 삭제되었습니다.');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleOpenDialog = (item?: EvaluationItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        category: item.category,
        maxScore: item.maxScore,
        weight: item.weight,
        order: item.order,
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        maxScore: 5,
        weight: 1.0,
        order: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };

  const groupedItems = items?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, EvaluationItem[]>);

  if (isLoading) {
    return <Typography>로딩 중...</Typography>;
  }


  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          평가 항목 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          항목 추가
        </Button>
      </Box>

      {Object.entries(groupedItems || {}).map(([category, categoryItems]) => (
        <Card key={category} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {category}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>항목명</TableCell>
                    <TableCell>설명</TableCell>
                    <TableCell>최대점수</TableCell>
                    <TableCell>가중치</TableCell>
                    <TableCell>순서</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.title}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.maxScore}</TableCell>
                      <TableCell>{item.weight}</TableCell>
                      <TableCell>{item.order}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.isActive ? '활성' : '비활성'}
                          color={item.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(item.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? '평가 항목 수정' : '평가 항목 추가'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="항목명"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="설명"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              label="카테고리"
              fullWidth
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="예: 업무능력, 협업능력, 태도"
            />
            <TextField
              label="최대 점수"
              type="number"
              fullWidth
              required
              value={formData.maxScore}
              onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
            />
            <TextField
              label="가중치"
              type="number"
              fullWidth
              required
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
              inputProps={{ step: 0.1 }}
            />
            <TextField
              label="순서"
              type="number"
              fullWidth
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingItem ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
