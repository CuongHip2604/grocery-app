'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useImportExcel } from '../../../../lib/hooks';
import { Button, Card, CardHeader, CardTitle, CardContent, Spinner } from '../../../../components/ui';

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; name: string; error: string }[];
}

export default function ImportProductsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const importExcel = useImportExcel();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      const result = await importExcel.mutateAsync(file);
      setImportResult(result.data);
    } catch {
      // Error handled by mutation
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    importExcel.reset();
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nhập sản phẩm từ Excel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instructions */}
          <div className="rounded-md bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Yêu cầu định dạng Excel:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Cột bắt buộc: <code className="bg-background px-1 rounded">name</code>, <code className="bg-background px-1 rounded">price</code>, <code className="bg-background px-1 rounded">cost</code></li>
              <li>Cột tùy chọn: <code className="bg-background px-1 rounded">description</code>, <code className="bg-background px-1 rounded">reorderLevel</code>, <code className="bg-background px-1 rounded">initialStock</code></li>
              <li>Dòng đầu tiên phải là tiêu đề</li>
              <li>Mã vạch sẽ được tự động tạo cho mỗi sản phẩm</li>
            </ul>
            <div className="mt-3 overflow-x-auto">
              <p className="font-medium mb-1">Ví dụ:</p>
              <table className="text-xs border">
                <thead className="bg-background">
                  <tr>
                    <th className="border px-2 py-1">name</th>
                    <th className="border px-2 py-1">price</th>
                    <th className="border px-2 py-1">cost</th>
                    <th className="border px-2 py-1">initialStock</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1">Gạo 5kg</td>
                    <td className="border px-2 py-1">125000</td>
                    <td className="border px-2 py-1">100000</td>
                    <td className="border px-2 py-1">50</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Đường 1kg</td>
                    <td className="border px-2 py-1">25000</td>
                    <td className="border px-2 py-1">20000</td>
                    <td className="border px-2 py-1">100</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {!importResult ? (
            <>
              {/* File Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Chọn file Excel</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90
                    cursor-pointer"
                />
              </div>

              {/* Error */}
              {importExcel.error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {importExcel.error instanceof Error ? importExcel.error.message : 'Không thể nhập file'}
                </div>
              )}

              {/* Selected File */}
              {file && (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm">
                    <span className="text-muted-foreground">File đã chọn:</span>{' '}
                    <span className="font-medium">{file.name}</span>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  Hủy
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleImport}
                  disabled={!file || importExcel.isPending}
                >
                  {importExcel.isPending && <Spinner size="sm" className="mr-2" />}
                  Nhập sản phẩm
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Import Result */}
              <div className="rounded-md bg-success/10 p-4">
                <p className="text-lg font-semibold text-success">Nhập hoàn tất!</p>
                <p className="text-sm mt-1">
                  Nhập thành công: <span className="font-medium">{importResult.success}</span>
                </p>
                {importResult.failed > 0 && (
                  <p className="text-sm text-destructive">
                    Thất bại: <span className="font-medium">{importResult.failed}</span>
                  </p>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Lỗi:</p>
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="p-2 text-sm border-b last:border-0">
                        <span className="text-muted-foreground">Dòng {err.row}:</span>{' '}
                        <span className="font-medium">{err.name}</span> -{' '}
                        <span className="text-destructive">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleReset}
                >
                  Nhập thêm
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => router.push('/products')}
                >
                  Xem sản phẩm
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
