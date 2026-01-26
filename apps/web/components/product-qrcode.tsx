'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from './ui';

interface ProductQRCodeProps {
  barcode: string;
  productName: string;
  size?: number;
  iconOnly?: boolean;
}

export function ProductQRCode({ barcode, productName, size = 200, iconOnly = false }: ProductQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, barcode, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    }
  }, [isOpen, barcode, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_qrcode.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    if (!canvasRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const imgSrc = canvasRef.current.toDataURL('image/png');
    printWindow.document.write(`
      <html>
        <head>
          <title>${productName} - QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .product-name {
              margin-top: 16px;
              font-size: 14px;
              font-weight: 500;
            }
            .barcode {
              margin-top: 4px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <img src="${imgSrc}" />
          <div class="product-name">${productName}</div>
          <div class="barcode">${barcode}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={iconOnly ? "icon" : "sm"}
        className={iconOnly ? "h-8 w-8" : ""}
        onClick={() => setIsOpen(true)}
      >
        <svg className={iconOnly ? "h-4 w-4" : "h-4 w-4 mr-1"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m10 8h4M4 8h2m10-4h4m-6 4V4" />
        </svg>
        {!iconOnly && "QR Code"}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Mã QR sản phẩm</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                X
              </Button>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <canvas ref={canvasRef} className="border rounded-md" />

              <div className="text-center">
                <p className="font-medium">{productName}</p>
                <p className="text-sm text-muted-foreground">{barcode}</p>
              </div>

              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1" onClick={handleDownload}>
                  Tải xuống
                </Button>
                <Button variant="outline" className="flex-1" onClick={handlePrint}>
                  In
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
