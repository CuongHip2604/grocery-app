'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Trash2 } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useBulkImportCategories } from '../../../lib/hooks';
import { categorySchema, CategoryFormData } from '../../../lib/schemas';
import { Button, Input, Label, Card, CardContent, Spinner } from '../../../components/ui';
import { Category } from '../../../lib/api';

type ModalMode = 'create' | 'edit' | null;

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; name: string; error: string }[];
}

export default function CategoriesPage() {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { data, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const bulkImportCategories = useBulkImportCategories();

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

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;

    // Parse the text - each line is a category
    // Format: "name" or "name | description"
    const lines = bulkText.trim().split('\n').filter(line => line.trim());
    const categories = lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        name: parts[0],
        description: parts[1] || undefined,
      };
    }).filter(c => c.name);

    if (categories.length === 0) return;

    try {
      const result = await bulkImportCategories.mutateAsync(categories);
      setImportResult(result.data);
    } catch {
      // Error handled by mutation
    }
  };

  const closeBulkImport = () => {
    setShowBulkImport(false);
    setBulkText('');
    setImportResult(null);
    bulkImportCategories.reset();
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

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Nhập nhiều danh mục</h2>
              <Button variant="ghost" size="sm" onClick={closeBulkImport}>
                X
              </Button>
            </div>

            {!importResult ? (
              <>
                <div className="rounded-md bg-muted p-3 text-sm mb-4">
                  <p className="font-medium mb-1">Hướng dẫn:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Mỗi dòng là một danh mục</li>
                    <li>Định dạng: <code className="bg-background px-1 rounded">Tên | Mô tả</code></li>
                    <li>Mô tả là tùy chọn</li>
                  </ul>
                  <p className="mt-2 text-muted-foreground">Ví dụ:</p>
                  <pre className="bg-background p-2 rounded mt-1 text-xs">
{`Đồ uống | Nước ngọt, nước suối
Bánh kẹo | Bánh, kẹo, snack
Gia vị`}
                  </pre>
                </div>

                <div className="space-y-2 mb-4">
                  <Label htmlFor="bulk-text">Danh sách danh mục</Label>
                  <textarea
                    id="bulk-text"
                    className="w-full min-h-[150px] p-3 border rounded-md text-sm font-mono resize-y"
                    placeholder="Nhập danh mục, mỗi dòng một danh mục..."
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                </div>

                {bulkImportCategories.error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
                    {bulkImportCategories.error instanceof Error ? bulkImportCategories.error.message : 'Không thể nhập'}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={closeBulkImport}>
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={!bulkText.trim() || bulkImportCategories.isPending}
                    onClick={handleBulkImport}
                  >
                    {bulkImportCategories.isPending && <Spinner size="sm" className="mr-2" />}
                    Nhập danh mục
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-md bg-green-500/10 p-4 mb-4">
                  <p className="text-lg font-semibold text-green-600">Nhập hoàn tất!</p>
                  <p className="text-sm mt-1">
                    Thành công: <span className="font-medium">{importResult.success}</span>
                  </p>
                  {importResult.failed > 0 && (
                    <p className="text-sm text-destructive">
                      Thất bại: <span className="font-medium">{importResult.failed}</span>
                    </p>
                  )}
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium">Lỗi:</p>
                    <div className="border rounded-md max-h-32 overflow-y-auto">
                      {importResult.errors.map((err, i) => (
                        <div key={i} className="p-2 text-sm border-b last:border-0">
                          <span className="text-muted-foreground">Dòng {err.row}:</span>{' '}
                          <span className="font-medium">{err.name}</span> -{' '}
                          <span className="text-destructive">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setBulkText('');
                      setImportResult(null);
                    }}
                  >
                    Nhập thêm
                  </Button>
                  <Button type="button" className="flex-1" onClick={closeBulkImport}>
                    Đóng
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Danh mục</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowBulkImport(true)}>
              Nhập nhiều
            </Button>
            <Button size="sm" onClick={openCreate}>
              Thêm mới
            </Button>
          </div>
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
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground mr-2">
                      {category.productCount || 0} sản phẩm
                    </span>
                    <button
                      onClick={() => openEdit(category)}
                      className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Sửa"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(category)}
                      className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
