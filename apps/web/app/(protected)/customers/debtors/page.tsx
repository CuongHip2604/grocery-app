'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebtors } from '../../../../lib/hooks';
import { formatCurrency } from '../../../../lib/utils';
import { Button, Card, CardContent, Spinner, Badge } from '../../../../components/ui';

export default function DebtorsPage() {
  const router = useRouter();
  const { data, isLoading } = useDebtors();

  const report = data?.data;

  return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        ← Quay lại
      </Button>

      <h1 className="text-xl font-bold">Báo cáo công nợ</h1>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : !report ? (
        <p className="py-8 text-center text-muted-foreground">
          Không thể tải báo cáo.
        </p>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(report.totalOutstanding)}
                </p>
                <p className="text-sm text-muted-foreground">Tổng công nợ</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{report.customerCount}</p>
                <p className="text-sm text-muted-foreground">Khách đang nợ</p>
              </CardContent>
            </Card>
          </div>

          {/* Customer List */}
          {report.customers.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Không có khách hàng nào đang nợ.
            </p>
          ) : (
            <div className="space-y-2">
              <h2 className="font-semibold">Danh sách khách nợ</h2>
              {report.customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  className="block"
                >
                  <Card className="transition-colors hover:bg-accent">
                    <CardContent className="flex items-center justify-between p-3">
                      <div className="flex-1">
                        <p className="font-medium">{customer.name}</p>
                      </div>
                      <Badge variant="warning" className="text-base">
                        {formatCurrency(customer.balance)}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
