'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCategories, useCreateProduct } from '../../../../lib/hooks';
import { createProductSchema, CreateProductFormData, convertProductFormData } from '../../../../lib/schemas';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent, Spinner } from '../../../../components/ui';

export default function NewProductPage() {
  const router = useRouter();
  const { data: categoriesData } = useCategories();
  const createProduct = useCreateProduct();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '0',
      cost: '0',
      categoryId: '',
      reorderLevel: '10',
      initialStock: '0',
    },
  });

  async function onSubmit(data: CreateProductFormData) {
    try {
      const payload = convertProductFormData(data);
      await createProduct.mutateAsync({
        ...payload,
        categoryId: payload.categoryId || undefined,
      });
      router.push('/products');
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Thêm sản phẩm mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {createProduct.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {createProduct.error instanceof Error ? createProduct.error.message : 'Không thể tạo sản phẩm'}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Tên *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input id="description" {...register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Giá nhập *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('cost')}
                />
                {errors.cost && (
                  <p className="text-sm text-destructive">{errors.cost.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Giá bán *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('price')}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Danh mục</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('categoryId')}
              >
                <option value="">Không có danh mục</option>
                {categoriesData?.data.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reorderLevel">Mức đặt lại</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  min="0"
                  {...register('reorderLevel')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialStock">Tồn kho ban đầu</Label>
                <Input
                  id="initialStock"
                  type="number"
                  min="0"
                  {...register('initialStock')}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                Hủy
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting || createProduct.isPending}>
                {(isSubmitting || createProduct.isPending) ? <Spinner size="sm" className="mr-2" /> : null}
                Tạo sản phẩm
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
