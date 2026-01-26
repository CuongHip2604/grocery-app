'use client';

import Link from 'next/link';
import { useDashboard } from '../../../lib/hooks';
import { formatCurrency } from '../../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent, Badge, Spinner, Button } from '../../../components/ui';

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <header>
        <h1 className="text-2xl font-bold">Tổng quan</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Doanh thu hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboard?.data.today.revenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.data.today.sales || 0} đơn hàng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Công nợ phải thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(dashboard?.data.receivables.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.data.receivables.customerCount || 0} khách hàng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Công nợ phải trả
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(dashboard?.data.payables.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.data.payables.paymentCount || 0} chờ thanh toán
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sắp hết hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.data.inventory.lowStockCount || 0}
            </div>
            {(dashboard?.data.inventory.lowStockCount || 0) > 0 && (
              <Badge variant="destructive" className="mt-1">Cần chú ý</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/scan">
            <Button variant="outline" className="h-auto w-full flex-col gap-1 py-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m10 8h4M4 8h2m10-4h4m-6 4V4" />
              </svg>
              <span className="text-sm">Quét & Bán</span>
            </Button>
          </Link>
          <Link href="/products/new">
            <Button variant="outline" className="h-auto w-full flex-col gap-1 py-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm">Thêm sản phẩm</span>
            </Button>
          </Link>
          <Link href="/customers">
            <Button variant="outline" className="h-auto w-full flex-col gap-1 py-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm">Thu tiền</span>
            </Button>
          </Link>
          <Link href="/inventory">
            <Button variant="outline" className="h-auto w-full flex-col gap-1 py-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm">Kiểm kho</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
