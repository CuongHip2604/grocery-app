'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCustomers } from '../../../lib/hooks';
import { useDebounce } from '../../../lib/use-debounce';
import { formatCurrency } from '../../../lib/utils';
import { Button, Input, Card, CardContent, Spinner, Badge } from '../../../components/ui';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const params: Record<string, string> = {
    page: page.toString(),
    limit: '20',
  };
  if (debouncedSearch) {
    params.search = debouncedSearch;
  }

  const { data, isLoading } = useCustomers(params);
  const customers = data?.data || [];
  const hasMore = data ? data.meta.page * data.meta.limit < data.meta.total : false;

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Khách hàng</h1>
        <Link href="/customers/debtors">
          <Button variant="outline" size="sm">Báo cáo công nợ</Button>
        </Link>
      </div>

      <div className="mb-4">
        <Input
          type="search"
          placeholder="Tìm khách hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && customers.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : customers.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Không tìm thấy khách hàng.
        </p>
      ) : (
        <div className="space-y-2">
          {customers.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`} className="block">
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex-1">
                    <p className="font-medium">{customer.name}</p>
                  </div>
                  <div className="text-right">
                    {customer.balance > 0 ? (
                      <Badge variant="warning">
                        Nợ {formatCurrency(customer.balance)}
                      </Badge>
                    ) : (
                      <Badge variant="success">Không nợ</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {(hasMore || page > 1) && (
        <div className="mt-4 flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
