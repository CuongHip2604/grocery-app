'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, BrowserCodeReader, BarcodeFormat, IScannerControls } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';
import { Button } from './ui';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

// Helper to safely stop scanner
function stopScanner(controls: IScannerControls | null) {
  if (controls) {
    try {
      controls.stop();
    } catch (e) {
      console.debug('Error stopping scanner:', e);
    }
  }
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string>('');
  const [isStarting, setIsStarting] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const hasScannedRef = useRef(false);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isMounted = true;
    let localControls: IScannerControls | null = null;

    const initScanner = async () => {
      try {
        // Configure hints for better barcode detection
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.QR_CODE,  // QR code first (priority)
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_93,
          BarcodeFormat.CODABAR,
          BarcodeFormat.ITF,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints);

        // Get available video devices
        const devices = await BrowserCodeReader.listVideoInputDevices();

        if (devices.length === 0) {
          throw new Error('No camera found');
        }

        // Always prefer back camera (environment facing)
        const backCamera = devices.find((d: MediaDeviceInfo) =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );

        // Use back camera if found, otherwise use the last device (usually back camera on mobile)
        const deviceId = backCamera?.deviceId || devices[devices.length - 1].deviceId;

        if (!isMounted) return;

        // Start continuous decoding
        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          video,
          (result, err) => {
            if (!isMounted || hasScannedRef.current) return;

            if (result) {
              const code = result.getText();
              if (code && code.length >= 4) {
                hasScannedRef.current = true;
                playBeep();

                // Stop the scanner
                stopScanner(localControls);

                onScan(code);
              }
            }

            // Ignore decode errors (no barcode in view)
            if (err && err.name !== 'NotFoundException') {
              console.debug('Scan error:', err.message);
            }
          }
        );

        // Store controls for cleanup
        localControls = controls;

        if (isMounted) {
          controlsRef.current = controls;
          setIsStarting(false);
        } else {
          // Component unmounted during init, clean up
          stopScanner(controls);
        }
      } catch (err) {
        console.error('Scanner init error:', err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to start camera. Please ensure camera permissions are granted.'
          );
          setIsStarting(false);
        }
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      stopScanner(controlsRef.current);
      controlsRef.current = null;
    };
  }, [onScan, playBeep]);

  const handleClose = useCallback(() => {
    stopScanner(controlsRef.current);
    controlsRef.current = null;
    onClose();
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between bg-black/80 p-4">
          <h2 className="text-lg font-semibold text-white">Scan Barcode</h2>
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-white hover:bg-white/20">
            Close
          </Button>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {isStarting && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
              <p className="text-white">Starting camera...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black p-4">
              <p className="mb-4 text-center text-red-400">{error}</p>
              <Button onClick={handleClose}>Go Back</Button>
            </div>
          )}

          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />

          {!error && !isStarting && (
            <>
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

              {/* Instructions */}
              <div className="absolute bottom-8 left-0 right-0 text-center space-y-2">
                <p className="text-white bg-black/60 mx-auto px-4 py-2 rounded-lg inline-block">
                  Center QR code or barcode in the frame
                </p>
                <p className="text-xs text-white/60">
                  Hold steady • Good lighting • 10-30cm distance
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
