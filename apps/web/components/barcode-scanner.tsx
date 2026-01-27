'use client';

import { useState, useCallback } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from './ui';

export type ScanMode = 'sell' | 'import';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  mode?: ScanMode;
  title?: string;
}

export function BarcodeScanner({
  onScan,
  onClose,
  mode = 'sell',
  title
}: BarcodeScannerProps) {
  const [error, setError] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);

  const displayTitle = title || (mode === 'import' ? 'Quét mã để nhập hàng' : 'Quét mã để bán hàng');

  const playBeep = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 1000;
      gainNode.gain.value = 0.1;
      oscillator.start();
      setTimeout(() => oscillator.stop(), 100);
    } catch {
      // Ignore audio errors
    }
  }, []);

  const handleScan = useCallback((result: { rawValue: string }[]) => {
    if (result && result.length > 0 && !isPaused) {
      const code = result[0].rawValue;
      if (code && code.length >= 4) {
        setIsPaused(true);
        playBeep();
        onScan(code);
      }
    }
  }, [isPaused, onScan, playBeep]);

  const handleError = useCallback((err: unknown) => {
    console.error('Scanner error:', err);
    if (err instanceof Error) {
      if (err.name === 'NotAllowedError') {
        setError('Không có quyền truy cập camera. Vui lòng cấp quyền camera.');
      } else if (err.name === 'NotFoundError') {
        setError('Không tìm thấy camera.');
      } else {
        setError(err.message);
      }
    } else {
      setError('Không thể khởi động camera.');
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between bg-black/80 p-4">
          <h2 className="text-lg font-semibold text-white">{displayTitle}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            Đóng
          </Button>
        </div>

        {/* Scanner */}
        <div className="relative flex-1 overflow-hidden">
          {error ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black p-4">
              <p className="mb-4 text-center text-red-400">{error}</p>
              <Button onClick={onClose}>Quay lại</Button>
            </div>
          ) : (
            <>
              <Scanner
                onScan={handleScan}
                onError={handleError}
                constraints={{
                  facingMode: 'environment',
                }}
                styles={{
                  container: {
                    width: '100%',
                    height: '100%',
                  },
                  video: {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  },
                }}
                components={{
                  torch: true,
                }}
              />

              {/* Scanning overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-64 w-64 border-2 border-white/70 rounded-lg overflow-hidden">
                  {/* Animated scan line */}
                  <div className="absolute left-2 right-2 h-1 bg-red-500 rounded shadow-lg shadow-red-500/50 animate-scan" />
                  {/* Corner markers */}
                  <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                  <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                </div>
              </div>

              {/* Mode indicator */}
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  mode === 'import'
                    ? 'bg-blue-500 text-white'
                    : 'bg-green-500 text-white'
                }`}>
                  {mode === 'import' ? 'Nhập hàng' : 'Bán hàng'}
                </span>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-8 left-0 right-0 text-center space-y-2">
                <p className="text-white bg-black/60 mx-auto px-4 py-2 rounded-lg inline-block">
                  Đưa mã vạch hoặc QR code vào khung hình
                </p>
                <p className="text-xs text-white/60">
                  Giữ yên • Đủ ánh sáng • Khoảng cách 10-30cm
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0%, 100% {
            top: 10%;
          }
          50% {
            top: 85%;
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
