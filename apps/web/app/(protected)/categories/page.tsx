'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../../lib/hooks';
import { categorySchema, CategoryFormData } from '../../../lib/schemas';
import { Button, Input, Label, Card, CardContent, Spinner } from '../../../components/ui';
import { Category } from '../../../lib/api';

type ModalMode = 'create' | 'edit' | null;

export default function CategoriesPage() {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);

  const { data, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const categories = data?.data || [];

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  const openCreate = () => {
    setModalMode('create');
    setSelectedCategory(null);
    form.reset({ name: '', description: '' });
  };

  const openEdit = (category: Category) => {
    setModalMode('edit');
    setSelectedCategory(category);
    form.reset({ name: category.name, description: category.description || '' });
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedCategory(null);
    form.reset();
    createCategory.reset();
    updateCategory.reset();
  };

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      if (modalMode === 'create') {
        await createCategory.mutateAsync({
          name: data.name,
          description: data.description || undefined,
        });
      } else if (modalMode === 'edit' && selectedCategory) {
        await updateCategory.mutateAsync({
          id: selectedCategory.id,
          data: {
            name: data.name,
            description: data.description || undefined,
          },
        });
      }
      closeModal();
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCategory.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch {
      // Error handled by mutation
    }
  };

  const mutationError = modalMode === 'create' ? createCategory.error : updateCategory.error;
  const isPending = modalMode === 'create' ? createCategory.isPending : updateCategory.isPending;

  return (
    <>
      {/* Create/Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {modalMode === 'create' ? 'Danh mục mới' : 'Sửa danh mục'}
              </h2>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                X
              </Button>
            </div>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {mutationError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {mutationError instanceof Error ? mutationError.message : 'Đã xảy ra lỗi'}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Tên *</Label>
                <Input
                  id="name"
                  placeholder="VD: Đồ uống"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả (tùy chọn)</Label>
                <Input
                  id="description"
                  placeholder="VD: Nước ngọt, nước suối..."
                  {...form.register('description')}
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                  Hủy
                </Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending && <Spinner size="sm" className="mr-2" />}
                  {modalMode === 'create' ? 'Tạo' : 'Lưu'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-2">Xóa danh mục</h2>
            <p className="text-muted-foreground mb-4">
              Bạn có chắc muốn xóa &quot;{deleteConfirm.name}&quot;?
              {deleteConfirm.productCount && deleteConfirm.productCount > 0 && (
                <span className="block mt-2 text-destructive">
                  Danh mục này có {deleteConfirm.productCount} sản phẩm và không thể xóa.
                </span>
              )}
            </p>

            {deleteCategory.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
                {deleteCategory.error instanceof Error ? deleteCategory.error.message : 'Không thể xóa'}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDeleteConfirm(null);
                  deleteCategory.reset();
                }}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                disabled={deleteCategory.isPending || (deleteConfirm.productCount !== undefined && deleteConfirm.productCount > 0)}
                onClick={handleDelete}
              >
                {deleteCategory.isPending && <Spinner size="sm" className="mr-2" />}
                Xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Danh mục</h1>
          <Button size="sm" onClick={openCreate}>
            Thêm mới
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : categories.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            Chưa có danh mục. Tạo danh mục đầu tiên.
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <Card key={category.id} className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex-1">
                    <p className="font-medium">{category.name}</p>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {category.productCount || 0} sản phẩm
                    </span>
                    <Button variant="outline" size="sm" onClick={() => openEdit(category)}>
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm(category)}
                    >
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
