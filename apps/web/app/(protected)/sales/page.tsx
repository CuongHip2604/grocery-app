'use client';

import { useState } from 'react';
import { useSales, useVoidSale } from '../../../lib/hooks';
import { formatCurrency, formatDateTime } from '../../../lib/utils';
import { Button, Card, CardContent, Spinner, Badge } from '../../../components/ui';
import { Sale } from '../../../lib/api';

export default function SalesPage() {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [voidConfirm, setVoidConfirm] = useState<Sale | null>(null);

  const { data, isLoading } = useSales({ limit: '50' });
  const voidSale = useVoidSale();

  const sales = data?.data || [];

  const handleVoid = async () => {
    if (!voidConfirm) return;
    try {
      await voidSale.mutateAsync(voidConfirm.id);
      setVoidConfirm(null);
      setSelectedSale(null);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <>
      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Chi tiết đơn hàng</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSale(null)}>
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              {/* Order Info */}
              <div className="p-3 bg-muted rounded-md space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã đơn:</span>
                  <span className="font-mono text-sm">{selectedSale.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thời gian:</span>
                  <span>{formatDateTime(selectedSale.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thanh toán:</span>
                  <Badge variant={selectedSale.paymentType === 'CASH' ? 'default' : 'secondary'}>
                    {selectedSale.paymentType === 'CASH' ? 'Tiền mặt' : 'Ghi nợ'}
                  </Badge>
                </div>
                {selectedSale.customer && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Khách hàng:</span>
                    <span>{selectedSale.customer.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <Badge variant={selectedSale.status === 'COMPLETED' ? 'default' : 'destructive'}>
                    {selectedSale.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
                  </Badge>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium mb-2">Sản phẩm ({selectedSale.items.length})</h3>
                <div className="space-y-2">
                  {selectedSale.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <span>{item.product?.name || 'Sản phẩm'}</span>
                        <span className="text-muted-foreground"> x{item.quantity}</span>
                      </div>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(selectedSale.totalAmount)}</span>
                </div>
              </div>

              {/* Actions */}
              {selectedSale.status === 'COMPLETED' && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setVoidConfirm(selectedSale)}
                >
                  Hủy đơn hàng
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Void Confirmation Modal */}
      {voidConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-2">Xác nhận hủy đơn</h2>
            <p className="text-muted-foreground mb-4">
              Bạn có chắc muốn hủy đơn hàng này? Tồn kho sẽ được hoàn lại.
            </p>

            {voidSale.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
                {voidSale.error instanceof Error ? voidSale.error.message : 'Không thể hủy đơn'}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setVoidConfirm(null);
                  voidSale.reset();
                }}
              >
                Không
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={voidSale.isPending}
                onClick={handleVoid}
              >
                {voidSale.isPending && <Spinner size="sm" className="mr-2" />}
                Hủy đơn
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Lịch sử bán hàng</h1>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : sales.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            Chưa có giao dịch nào.
          </p>
        ) : (
          <div className="space-y-2">
            {sales.map((sale) => (
              <Card
                key={sale.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${sale.status === 'VOIDED' ? 'opacity-60' : ''}`}
                onClick={() => setSelectedSale(sale)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{formatCurrency(sale.totalAmount)}</p>
                        <Badge
                          variant={sale.paymentType === 'CASH' ? 'outline' : 'secondary'}
                          className="text-xs"
                        >
                          {sale.paymentType === 'CASH' ? 'Tiền mặt' : 'Ghi nợ'}
                        </Badge>
                        {sale.status === 'VOIDED' && (
                          <Badge variant="destructive" className="text-xs">Đã hủy</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sale.items.length} sản phẩm
                        {sale.customer && ` • ${sale.customer.name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(sale.createdAt)}
                      </p>
                    </div>
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
