'use client';

import { useState, useRef, useCallback } from 'react';
import { api, Product, Customer, PricingUnit } from '../../../lib/api';
import { useCreateSale, useSearchCustomers, useCreateCustomer } from '../../../lib/hooks';
import { formatCurrency, formatPriceWithUnit, formatWeight, calculateWeightBasedPrice, getPricingUnitLabel } from '../../../lib/utils';
import { Button, Input, Card, CardContent, Spinner, Badge } from '../../../components/ui';
import { BarcodeScanner } from '../../../components/barcode-scanner';

interface CartItem {
  product: Product;
  quantity: number; // For weight-based products, this is in kg
}

interface WeightInputState {
  isOpen: boolean;
  product: Product | null;
  weight: string;
  editingProductId?: string; // If set, we're editing an existing cart item
}

export default function ScanPage() {
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT'>('CASH');
  const [success, setSuccess] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [weightInput, setWeightInput] = useState<WeightInputState>({
    isOpen: false,
    product: null,
    weight: '',
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);

  const createSale = useCreateSale();
  const createCustomer = useCreateCustomer();
  const { data: customersData } = useSearchCustomers(customerSearch);
  const customers = customersData?.data || [];
  const [showSuggestions, setShowSuggestions] = useState(false);

  const lookupProduct = useCallback(async (barcodeValue?: string) => {
    const code = (barcodeValue || barcode).trim();
    if (!code) return;

    console.log('Looking up barcode:', code);
    setIsLookingUp(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.getProductByBarcode(code);
      const product = response.data;

      // For weight-based products, show weight input modal
      if (product.isWeightBased) {
        setWeightInput({
          isOpen: true,
          product,
          weight: '',
        });
        setBarcode('');
        setTimeout(() => weightInputRef.current?.focus(), 100);
      } else {
        // Regular products: add to cart directly
        setCart((prev) => {
          const existing = prev.find((item) => item.product.id === product.id);
          if (existing) {
            return prev.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }
          return [...prev, { product, quantity: 1 }];
        });
        setBarcode('');
        setSuccess(`Đã thêm: ${product.name}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tìm thấy sản phẩm';
      setError(`Mã: "${code}" - ${message}`);
    } finally {
      setIsLookingUp(false);
      inputRef.current?.focus();
    }
  }, [barcode]);

  const handleBarcodeScan = useCallback((scannedBarcode: string) => {
    setShowScanner(false);
    lookupProduct(scannedBarcode);
  }, [lookupProduct]);

  const handleWeightSubmit = useCallback(() => {
    if (!weightInput.product) return;

    const weight = parseFloat(weightInput.weight);
    if (isNaN(weight) || weight <= 0) {
      setError('Vui lòng nhập cân nặng hợp lệ');
      return;
    }

    const product = weightInput.product;

    if (weightInput.editingProductId) {
      // Editing existing cart item
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === weightInput.editingProductId
            ? { ...item, quantity: weight }
            : item
        )
      );
      setSuccess(`Đã cập nhật: ${product.name} - ${formatWeight(weight)}`);
    } else {
      // Adding new item
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + weight }
              : item
          );
        }
        return [...prev, { product, quantity: weight }];
      });
      setSuccess(`Đã thêm: ${product.name} - ${formatWeight(weight)}`);
    }

    setWeightInput({ isOpen: false, product: null, weight: '' });
    inputRef.current?.focus();
  }, [weightInput]);

  const openWeightEditor = useCallback((item: CartItem) => {
    setWeightInput({
      isOpen: true,
      product: item.product,
      weight: item.quantity.toString(),
      editingProductId: item.product.id,
    });
    setTimeout(() => weightInputRef.current?.focus(), 100);
  }, []);

  const closeWeightModal = useCallback(() => {
    setWeightInput({ isOpen: false, product: null, weight: '' });
    inputRef.current?.focus();
  }, []);

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  const total = cart.reduce((sum, item) => {
    if (item.product.isWeightBased) {
      return sum + calculateWeightBasedPrice(
        item.product.price,
        item.product.pricingUnit,
        item.quantity
      );
    }
    return sum + item.product.price * item.quantity;
  }, 0);

  async function completeSale() {
    if (cart.length === 0) return;

    setError('');
    setSuccess('');

    try {
      let customerId: string | undefined;

      // For credit sales, we need a customer
      if (paymentType === 'CREDIT') {
        if (selectedCustomer) {
          // Use existing customer
          customerId = selectedCustomer.id;
        } else if (customerSearch.trim()) {
          // Create new customer with the entered name
          const newCustomer = await createCustomer.mutateAsync({
            name: customerSearch.trim(),
          });
          customerId = newCustomer.data.id;
        }
      }

      await createSale.mutateAsync({
        paymentType,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        customerId,
      });
      setSuccess(`Bán hàng thành công! Tổng: ${formatCurrency(total)}`);
      setCart([]);
      setSelectedCustomer(null);
      setPaymentType('CASH');
      setCustomerSearch('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bán hàng thất bại');
    }
  }

  return (
    <>
      {showScanner && (
        <BarcodeScanner
          key={scannerKey}
          mode="sell"
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Weight Input Modal */}
      {weightInput.isOpen && weightInput.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-4 space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg">{weightInput.product.name}</h3>
                <p className="text-muted-foreground">
                  {formatPriceWithUnit(weightInput.product.price, weightInput.product.pricingUnit)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cân nặng (kg)</label>
                <Input
                  ref={weightInputRef}
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="Nhập cân nặng (VD: 0.5)"
                  value={weightInput.weight}
                  onChange={(e) => setWeightInput((prev) => ({ ...prev, weight: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleWeightSubmit()}
                />
                <p className="text-xs text-muted-foreground">
                  VD: 0.5 = 500g, 1.25 = 1kg 250g
                </p>
              </div>

              {weightInput.weight && !isNaN(parseFloat(weightInput.weight)) && parseFloat(weightInput.weight) > 0 && (
                <div className="rounded-md bg-muted p-3 text-center">
                  <p className="text-sm text-muted-foreground">Thành tiền</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(
                      calculateWeightBasedPrice(
                        weightInput.product.price,
                        weightInput.product.pricingUnit,
                        parseFloat(weightInput.weight)
                      )
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatWeight(parseFloat(weightInput.weight))}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeWeightModal}
                >
                  Hủy
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleWeightSubmit}
                  disabled={!weightInput.weight || isNaN(parseFloat(weightInput.weight)) || parseFloat(weightInput.weight) <= 0}
                >
                  {weightInput.editingProductId ? 'Cập nhật' : 'Thêm'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex min-h-[calc(100vh-5rem)] flex-col p-4">
        <h1 className="mb-4 text-xl font-bold">Quét & Bán</h1>

        {success && (
          <div className="mb-4 rounded-md bg-success/10 p-3 text-sm text-success">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Nhập mã vạch thủ công"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookupProduct()}
              autoFocus
            />
            <Button onClick={() => lookupProduct()} disabled={isLookingUp || !barcode.trim()}>
              {isLookingUp ? <Spinner size="sm" /> : 'Thêm'}
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              setScannerKey(k => k + 1);
              setShowScanner(true);
            }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Quét bằng camera
          </Button>
        </div>

        <div className="flex-1 space-y-2 overflow-auto">
          {cart.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Chưa có sản phẩm. Quét mã vạch để thêm sản phẩm.
            </p>
          ) : (
            cart.map((item) => {
              const isWeightProduct = item.product.isWeightBased;
              const itemSubtotal = isWeightProduct
                ? calculateWeightBasedPrice(item.product.price, item.product.pricingUnit, item.quantity)
                : item.product.price * item.quantity;

              return (
                <Card key={item.product.id}>
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      {isWeightProduct ? (
                        <p className="text-sm text-muted-foreground">
                          {formatPriceWithUnit(item.product.price, item.product.pricingUnit)} • {formatWeight(item.quantity)} = {formatCurrency(itemSubtotal)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.product.price)} / cái × {item.quantity} = {formatCurrency(itemSubtotal)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isWeightProduct ? (
                        // Weight-based: Edit button
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWeightEditor(item)}
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Sửa
                        </Button>
                      ) : (
                        // Regular: +/- buttons
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, -1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, 1)}
                          >
                            +
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Tổng cộng:</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant={paymentType === 'CASH' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setPaymentType('CASH')}
              >
                Tiền mặt
              </Button>
              <Button
                variant={paymentType === 'CREDIT' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setPaymentType('CREDIT')}
              >
                Ghi nợ
              </Button>
            </div>

            {paymentType === 'CREDIT' && (
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder="Nhập tên khách hàng..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setSelectedCustomer(null);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {showSuggestions && customers.length > 0 && !selectedCustomer && customerSearch.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-32 overflow-auto rounded-md border bg-background shadow-lg">
                      {customers.map((customer) => (
                        <button
                          key={customer.id}
                          className="w-full p-2 text-left text-sm hover:bg-accent"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setCustomerSearch(customer.name);
                            setShowSuggestions(false);
                          }}
                        >
                          {customer.name}
                          {customer.balance > 0 && (
                            <Badge variant="warning" className="ml-2">
                              Nợ {formatCurrency(customer.balance)}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedCustomer && (
                  <p className="text-sm text-muted-foreground">
                    Khách hàng hiện có
                    {selectedCustomer.balance > 0 && (
                      <span className="text-warning"> - Đang nợ {formatCurrency(selectedCustomer.balance)}</span>
                    )}
                  </p>
                )}
                {!selectedCustomer && customerSearch.trim() && (
                  <p className="text-sm text-muted-foreground">
                    Sẽ tạo khách hàng mới: <span className="font-medium">{customerSearch.trim()}</span>
                  </p>
                )}
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={completeSale}
              disabled={createSale.isPending || createCustomer.isPending || (paymentType === 'CREDIT' && !customerSearch.trim())}
            >
              {(createSale.isPending || createCustomer.isPending) ? <Spinner size="sm" className="mr-2" /> : null}
              Hoàn tất bán hàng
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
