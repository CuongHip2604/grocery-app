'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInventory, useInventorySummary, useRestockProduct, useAdjustInventory } from '../../../lib/hooks';
import { useDebounce } from '../../../lib/use-debounce';
import { restockSchema, RestockFormData, adjustInventorySchema, AdjustInventoryFormData } from '../../../lib/schemas';
import { formatCurrency } from '../../../lib/utils';
import { Button, Input, Label, Card, CardContent, Spinner, Badge } from '../../../components/ui';
import { InventoryItem } from '../../../lib/api';

type AdjustMode = 'restock' | 'adjust' | 'set';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<AdjustMode>('restock');
  const debouncedSearch = useDebounce(search, 300);

  const params: Record<string, string> = { limit: '50' };
  if (debouncedSearch) params.search = debouncedSearch;
  if (filter === 'low') params.lowStock = 'true';

  const { data: inventoryData, isLoading } = useInventory(params);
  const { data: summaryData } = useInventorySummary();

  const restockProduct = useRestockProduct();
  const adjustInventory = useAdjustInventory();

  const inventory = inventoryData?.data || [];
  const summary = summaryData?.data;

  const restockForm = useForm<RestockFormData>({
    resolver: zodResolver(restockSchema),
    defaultValues: { quantity: '', notes: '' },
  });

  const adjustForm = useForm<AdjustInventoryFormData>({
    resolver: zodResolver(adjustInventorySchema),
    defaultValues: { quantity: '', isAbsolute: false, reason: '' },
  });

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustMode('restock');
    restockForm.reset({ quantity: '', notes: '' });
    adjustForm.reset({ quantity: '', isAbsolute: false, reason: '' });
  };

  const handleClose = () => {
    setSelectedItem(null);
    restockForm.reset();
    adjustForm.reset();
  };

  const handleRestock = async (data: RestockFormData) => {
    if (!selectedItem) return;
    try {
      await restockProduct.mutateAsync({
        productId: selectedItem.productId,
        quantity: Number(data.quantity),
        notes: data.notes || undefined,
      });
      handleClose();
    } catch {
      // Error handled by mutation
    }
  };

  const handleAdjust = async (data: AdjustInventoryFormData) => {
    if (!selectedItem) return;
    try {
      await adjustInventory.mutateAsync({
        productId: selectedItem.productId,
        quantity: Number(data.quantity),
        isAbsolute: adjustMode === 'set',
        reason: data.reason || undefined,
      });
      handleClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <>
      {/* Stock Adjustment Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Điều chỉnh tồn kho</h2>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                ✕
              </Button>
            </div>

            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="font-medium">{selectedItem.product.name}</p>
              <p className="text-lg font-bold mt-1">Tồn kho hiện tại: {selectedItem.quantity}</p>
            </div>

            {/* Mode Selection */}
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={adjustMode === 'restock' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setAdjustMode('restock')}
              >
                Nhập thêm
              </Button>
              <Button
                type="button"
                variant={adjustMode === 'adjust' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setAdjustMode('adjust')}
              >
                Điều chỉnh +/-
              </Button>
              <Button
                type="button"
                variant={adjustMode === 'set' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setAdjustMode('set')}
              >
                Đặt chính xác
              </Button>
            </div>

            {adjustMode === 'restock' ? (
              <form onSubmit={restockForm.handleSubmit(handleRestock)} className="space-y-4">
                {restockProduct.error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {restockProduct.error instanceof Error ? restockProduct.error.message : 'Không thể nhập thêm'}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="restock-quantity">Số lượng thêm *</Label>
                  <Input
                    id="restock-quantity"
                    type="number"
                    min="1"
                    placeholder="Nhập số lượng"
                    {...restockForm.register('quantity')}
                  />
                  {restockForm.formState.errors.quantity && (
                    <p className="text-sm text-destructive">{restockForm.formState.errors.quantity.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restock-notes">Ghi chú (tùy chọn)</Label>
                  <Input
                    id="restock-notes"
                    placeholder="VD: Nhập từ nhà cung cấp"
                    {...restockForm.register('notes')}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                    Hủy
                  </Button>
                  <Button type="submit" className="flex-1" disabled={restockProduct.isPending}>
                    {restockProduct.isPending && <Spinner size="sm" className="mr-2" />}
                    Nhập kho
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={adjustForm.handleSubmit(handleAdjust)} className="space-y-4">
                {adjustInventory.error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {adjustInventory.error instanceof Error ? adjustInventory.error.message : 'Không thể điều chỉnh'}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="adjust-quantity">
                    {adjustMode === 'set' ? 'Số lượng mới *' : 'Điều chỉnh *'}
                  </Label>
                  <Input
                    id="adjust-quantity"
                    type="number"
                    min={adjustMode === 'set' ? '0' : undefined}
                    placeholder={adjustMode === 'set' ? 'Nhập số lượng mới' : 'VD: -5 hoặc +10'}
                    {...adjustForm.register('quantity')}
                  />
                  {adjustForm.formState.errors.quantity && (
                    <p className="text-sm text-destructive">{adjustForm.formState.errors.quantity.message}</p>
                  )}
                  {adjustMode === 'adjust' && (
                    <p className="text-xs text-muted-foreground">
                      Dùng số âm để trừ (VD: -5 cho hư hỏng/mất mát)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adjust-reason">Lý do (tùy chọn)</Label>
                  <Input
                    id="adjust-reason"
                    placeholder="VD: Kiểm kê, Hư hỏng, v.v."
                    {...adjustForm.register('reason')}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                    Hủy
                  </Button>
                  <Button type="submit" className="flex-1" disabled={adjustInventory.isPending}>
                    {adjustInventory.isPending && <Spinner size="sm" className="mr-2" />}
                    {adjustMode === 'set' ? 'Đặt số lượng' : 'Áp dụng'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Kho hàng</h1>

        {summary && (
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{summary.totalSKUs}</p>
                <p className="text-xs text-muted-foreground">Tổng SKU</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</p>
                <p className="text-xs text-muted-foreground">Giá trị tồn kho</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-warning">{summary.lowStockCount}</p>
                <p className="text-xs text-muted-foreground">Sắp hết</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{summary.outOfStockCount}</p>
                <p className="text-xs text-muted-foreground">Hết hàng</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Input
          type="search"
          placeholder="Tìm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Tất cả
          </Button>
          <Button
            variant={filter === 'low' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('low')}
          >
            Sắp hết
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : inventory.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            Không tìm thấy sản phẩm.
          </p>
        ) : (
          <div className="space-y-2">
            {inventory.map((item) => (
              <Card
                key={item.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${item.isLowStock ? 'border-warning' : ''}`}
                onClick={() => handleOpenAdjust(item)}
              >
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.product.name}</p>
                      {item.isLowStock && (
                        <Badge variant="warning" className="text-xs">Sắp hết</Badge>
                      )}
                      {item.quantity === 0 && (
                        <Badge variant="destructive" className="text-xs">Hết</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{item.quantity}</p>
                    <p className="text-xs text-muted-foreground">
                      Mức đặt lại: {item.product.reorderLevel}
                    </p>
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
