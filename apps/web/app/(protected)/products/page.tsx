'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProducts } from '../../../lib/hooks';
import { formatCurrency } from '../../../lib/utils';
import { Button, Input, Card, CardContent, Spinner, Badge } from '../../../components/ui';
import { ProductQRCode } from '../../../components/product-qrcode';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params: Record<string, string> = {
    page: page.toString(),
    limit: '20',
  };
  if (search) {
    params.search = search;
  }

  const { data, isLoading } = useProducts(params);
  const products = data?.data || [];
  const hasMore = data ? data.meta.page * data.meta.limit < data.meta.total : false;

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Sản phẩm</h1>
        <div className="flex gap-2">
          <Link href="/products/import">
            <Button size="sm" variant="outline">Nhập Excel</Button>
          </Link>
          <Link href="/products/new">
            <Button size="sm">Thêm mới</Button>
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <Input
          type="search"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {isLoading && products.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : products.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Không tìm thấy sản phẩm.
        </p>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <Card key={product.id} className="transition-colors hover:bg-accent">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Link href={`/products/${product.id}`} className="flex-1 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{product.name}</p>
                        {product.inventory && product.inventory.quantity <= product.reorderLevel && (
                          <Badge variant="destructive" className="text-xs">Sắp hết</Badge>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(product.price)}</p>
                      <p className="text-sm text-muted-foreground">
                        Tồn kho: {product.inventory?.quantity ?? 0}
                      </p>
                    </div>
                  </Link>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ProductQRCode barcode={product.barcode} productName={product.name} iconOnly />
                  </div>
                </div>
              </CardContent>
            </Card>
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
