'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCustomerLedger, useRecordPayment } from '../../../../lib/hooks';
import { recordPaymentSchema, RecordPaymentFormData } from '../../../../lib/schemas';
import { formatCurrency, formatDateTime } from '../../../../lib/utils';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Spinner, Badge } from '../../../../components/ui';
import { LedgerEntry } from '../../../../lib/api';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { data: ledgerData, isLoading } = useCustomerLedger(customerId);
  const recordPayment = useRecordPayment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecordPaymentFormData>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      amount: '',
      description: '',
    },
  });

  async function onSubmit(data: RecordPaymentFormData) {
    try {
      await recordPayment.mutateAsync({
        customerId,
        amount: Number(data.amount),
        description: data.description,
      });
      reset();
    } catch {
      // Error handled by mutation
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const ledger = ledgerData?.data;

  if (!ledger) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Không tìm thấy khách hàng</p>
        <Button variant="link" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        ← Quay lại
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{ledger.customer.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Công nợ:</span>
            {ledger.customer.balance > 0 ? (
              <Badge variant="warning">{formatCurrency(ledger.customer.balance)}</Badge>
            ) : (
              <Badge variant="success">Không nợ</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {ledger.customer.balance > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ghi nhận thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {recordPayment.error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {recordPayment.error instanceof Error ? recordPayment.error.message : 'Không thể ghi nhận thanh toán'}
                </div>
              )}
              {recordPayment.isSuccess && (
                <div className="rounded-md bg-success/10 p-3 text-sm text-success">
                  Đã ghi nhận thanh toán thành công!
                </div>
              )}
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={ledger.customer.balance}
                placeholder="Số tiền thanh toán"
                {...register('amount')}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
              <Input
                placeholder="Ghi chú (tùy chọn)"
                {...register('description')}
              />
              <Button type="submit" className="w-full" disabled={recordPayment.isPending}>
                {recordPayment.isPending ? <Spinner size="sm" className="mr-2" /> : null}
                Ghi nhận thanh toán
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-2 text-lg font-semibold">Lịch sử giao dịch</h2>
        {ledger.entries.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">
            Chưa có giao dịch nào.
          </p>
        ) : (
          <div className="space-y-2">
            {ledger.entries.map((entry: LedgerEntry) => (
              <Card key={entry.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium">
                      {entry.type === 'CHARGE' ? 'Ghi nợ' : 'Thanh toán'}
                    </p>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground">
                        {entry.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={entry.type === 'CHARGE' ? 'text-destructive' : 'text-success'}>
                      {entry.type === 'CHARGE' ? '+' : '-'}
                      {formatCurrency(entry.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Còn nợ: {formatCurrency(entry.balance)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
