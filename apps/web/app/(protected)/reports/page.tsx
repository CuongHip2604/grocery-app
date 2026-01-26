'use client';

import { useState, useMemo } from 'react';
import { useSalesReport, useProfitLoss } from '../../../lib/hooks';
import { formatCurrency } from '../../../lib/utils';
import { Button, Card, CardHeader, CardTitle, CardContent, Spinner, Badge } from '../../../components/ui';

type ReportType = 'sales' | 'profit-loss';
type Period = 'today' | 'week' | 'month';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [period, setPeriod] = useState<Period>('today');

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'today':
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [period]);

  const { data: salesData, isLoading: salesLoading } = useSalesReport(startDate, endDate);
  const { data: profitLossData, isLoading: profitLossLoading } = useProfitLoss(startDate, endDate);

  const isLoading = reportType === 'sales' ? salesLoading : profitLossLoading;
  const salesReport = salesData?.data;
  const profitLoss = profitLossData?.data;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Báo cáo</h1>

      <div className="flex gap-2">
        <Button
          variant={reportType === 'sales' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setReportType('sales')}
        >
          Doanh thu
        </Button>
        <Button
          variant={reportType === 'profit-loss' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setReportType('profit-loss')}
        >
          Lãi & Lỗ
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={period === 'today' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setPeriod('today')}
        >
          Hôm nay
        </Button>
        <Button
          variant={period === 'week' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setPeriod('week')}
        >
          Tuần này
        </Button>
        <Button
          variant={period === 'month' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setPeriod('month')}
        >
          Tháng này
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : reportType === 'sales' && salesReport ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Tổng doanh thu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {formatCurrency(salesReport.totalRevenue)}
              </p>
              <p className="text-sm text-muted-foreground">
                {salesReport.totalOrders} đơn hàng | TB: {formatCurrency(salesReport.averageOrderValue)}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Tiền mặt</p>
                <p className="text-xl font-bold">
                  {formatCurrency(salesReport.cashSales.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {salesReport.cashSales.count} đơn
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Ghi nợ</p>
                <p className="text-xl font-bold text-warning">
                  {formatCurrency(salesReport.creditSales.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {salesReport.creditSales.count} đơn
                </p>
              </CardContent>
            </Card>
          </div>

          {salesReport.topProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sản phẩm bán chạy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {salesReport.topProducts.slice(0, 5).map((item, index) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>
                      {index + 1}. {item.product.name}
                    </span>
                    <span className="text-muted-foreground">
                      {item.quantity} đã bán
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : reportType === 'profit-loss' && profitLoss ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Lợi nhuận ròng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${profitLoss.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(profitLoss.netProfit)}
              </p>
              <Badge variant={profitLoss.netMargin >= 0 ? 'success' : 'destructive'}>
                {profitLoss.netMargin.toFixed(1)}% biên lợi nhuận
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex justify-between">
                <span>Doanh thu</span>
                <span className="font-semibold">{formatCurrency(profitLoss.revenue)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Giá vốn hàng bán</span>
                <span>-{formatCurrency(profitLoss.costOfGoodsSold)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Lợi nhuận gộp</span>
                <span className="font-semibold">{formatCurrency(profitLoss.grossProfit)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Chi phí</span>
                <span>-{formatCurrency(profitLoss.expenses)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Lợi nhuận ròng</span>
                <span className={profitLoss.netProfit >= 0 ? 'text-success' : 'text-destructive'}>
                  {formatCurrency(profitLoss.netProfit)}
                </span>
              </div>
            </CardContent>
          </Card>

          {profitLoss.expensesByCategory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Chi phí theo danh mục</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profitLoss.expensesByCategory.map((item) => (
                  <div key={item.category} className="flex justify-between text-sm">
                    <span>{item.category}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
