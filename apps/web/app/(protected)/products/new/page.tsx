'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCategories, useCreateProduct } from '../../../../lib/hooks';
import { createProductSchema, CreateProductFormData, convertProductFormData } from '../../../../lib/schemas';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent, Spinner } from '../../../../components/ui';
import { BarcodeScanner } from '../../../../components/barcode-scanner';

export default function NewProductPage() {
  const router = useRouter();
  const { data: categoriesData } = useCategories();
  const createProduct = useCreateProduct();
  const [showScanner, setShowScanner] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      barcode: '',
      description: '',
      price: '0',
      cost: '0',
      categoryId: '',
      reorderLevel: '5',
      initialStock: '0',
    },
  });

  const barcodeValue = watch('barcode');

  const handleBarcodeScan = useCallback((scannedBarcode: string) => {
    setShowScanner(false);
    setValue('barcode', scannedBarcode);
  }, [setValue]);

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
    <>
      {showScanner && (
        <BarcodeScanner
          mode="import"
          title="Quét mã vạch sản phẩm"
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

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
                <Label htmlFor="barcode">Mã vạch</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    placeholder="Quét hoặc nhập mã vạch (tự động tạo nếu để trống)"
                    {...register('barcode')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowScanner(true)}
                    className="shrink-0"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Button>
                </div>
                {barcodeValue && (
                  <p className="text-sm text-muted-foreground">
                    Mã vạch: <span className="font-mono font-medium">{barcodeValue}</span>
                  </p>
                )}
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

              <div className="grid grid-cols-2 gap-4">
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
    </>
  );
}
