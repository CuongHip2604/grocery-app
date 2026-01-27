'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProduct, useCategories, useUpdateProduct } from '../../../../lib/hooks';
import { updateProductSchema, UpdateProductFormData, convertUpdateProductFormData } from '../../../../lib/schemas';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent, Spinner } from '../../../../components/ui';
import { ProductQRCode } from '../../../../components/product-qrcode';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { data: productData, isLoading: isLoadingProduct } = useProduct(productId);
  const { data: categoriesData } = useCategories();
  const updateProduct = useUpdateProduct();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProductFormData>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '0',
      cost: '0',
      categoryId: '',
      reorderLevel: '5',
    },
  });

  // Populate form when product data loads
  useEffect(() => {
    if (productData?.data) {
      const product = productData.data;
      reset({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        cost: product.cost.toString(),
        categoryId: product.categoryId || '',
        reorderLevel: product.reorderLevel.toString(),
      });
    }
  }, [productData, reset]);

  async function onSubmit(data: UpdateProductFormData) {
    try {
      const payload = convertUpdateProductFormData(data);
      await updateProduct.mutateAsync({
        id: productId,
        data: {
          ...payload,
          categoryId: payload.categoryId || undefined,
        },
      });
      router.push('/products');
    } catch {
      // Error handled by mutation
    }
  }

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!productData?.data) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Không tìm thấy sản phẩm</p>
            <Button className="mt-4 w-full" onClick={() => router.push('/products')}>
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const product = productData.data;

  return (
    <div className="p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sửa sản phẩm</CardTitle>
          <ProductQRCode barcode={product.barcode} productName={product.name} />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {updateProduct.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {updateProduct.error instanceof Error ? updateProduct.error.message : 'Không thể cập nhật sản phẩm'}
              </div>
            )}

            {/* Current Stock Display */}
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Tồn kho hiện tại: <span className="font-semibold text-foreground">{product.inventory?.quantity ?? 0}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Để điều chỉnh tồn kho, vào trang Kho hàng.
              </p>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Mức đặt hàng lại</Label>
              <Input
                id="reorderLevel"
                type="number"
                min="0"
                {...register('reorderLevel')}
              />
              <p className="text-xs text-muted-foreground">
                Cảnh báo &quot;Sắp hết&quot; khi tồn kho ≤ mức này
              </p>
              {errors.reorderLevel && (
                <p className="text-sm text-destructive">{errors.reorderLevel.message}</p>
              )}
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
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || updateProduct.isPending || !isDirty}
              >
                {(isSubmitting || updateProduct.isPending) ? <Spinner size="sm" className="mr-2" /> : null}
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
