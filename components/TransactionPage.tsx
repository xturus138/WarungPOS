
import React, { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Product, Customer, TransactionItem, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Search, X, Plus, Minus, Trash2 } from 'lucide-react';
import Select from 'react-select';
import Receipt from './Receipt';
import { Dexie } from 'dexie';
import { priceFor, asInt } from '../utils/productUtils';
import { ensureError } from '../utils/errorUtils';


interface TransactionPageProps {
  type: 'RETAIL' | 'WHOLESALE';
}

const TransactionPage: React.FC<TransactionPageProps> = ({ type }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<TransactionItem[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isPaymentOpen, setPaymentOpen] = useState(false);
    const [cashReceived, setCashReceived] = useState<number | string>('');
    const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

    const products = useLiveQuery(() => db.products.where('stockQty').above(0).toArray(), []);
    const customers = useLiveQuery(() => db.customers.toArray(), []);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        if (!searchTerm) return products.slice(0, 20);
        const lowerSearchTerm = searchTerm.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(lowerSearchTerm) || 
            p.code.toLowerCase().includes(lowerSearchTerm)
        );
    }, [products, searchTerm]);
    
    const customerOptions = useMemo(() => customers?.map(c => ({ value: c.id!, label: `${c.memberNo} - ${c.name}` })) || [], [customers]);

    const addToCart = (product: Product) => {
        try {
            const { unitPrice, note } = priceFor(type, product);

            const existingItem = cart.find(item => item.productId === product.id);
            if (existingItem) {
                if (existingItem.qty < product.stockQty) {
                    updateQty(product.id!, existingItem.qty + 1);
                } else {
                    alert(`Stok untuk ${product.name} tidak mencukupi.`);
                }
            } else {
                if (product.stockQty > 0) {
                     setCart([...cart, {
                        productId: product.id!,
                        code: product.code,
                        name: product.name,
                        unitPrice: unitPrice,
                        qty: 1,
                        lineTotal: unitPrice,
                        note: note,
                    }]);
                } else {
                     alert(`${product.name} habis.`);
                }
            }
        } catch (e) {
            const err = ensureError(e);
            console.error(`Failed to add product ${product.code} to cart:`, err);
            alert("Produk ini belum memiliki harga grosir yang valid. Periksa di menu Produk.");
        }
    };
    
    const updateQty = (productId: number, newQty: number) => {
        const productInDb = products?.find(p => p.id === productId);
        if (!productInDb) return;

        if (newQty > productInDb.stockQty) {
            alert(`Stok tidak mencukupi. Sisa ${productInDb.stockQty}.`);
            newQty = productInDb.stockQty;
        }

        if (newQty <= 0) {
            removeFromCart(productId);
        } else {
             setCart(cart.map(item =>
                item.productId === productId ? { ...item, qty: newQty, lineTotal: newQty * item.unitPrice } : item
            ));
        }
    };

    const removeFromCart = (productId: number) => {
        setCart(cart.filter(item => item.productId !== productId));
    };
    
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.lineTotal, 0), [cart]);

    const resetTransaction = useCallback(() => {
        setCart([]);
        setCustomer(null);
        setPaymentOpen(false);
        setCashReceived('');
        setSearchTerm('');
    }, []);
    
    const handlePayment = async () => {
        if (cart.length === 0) {
            alert("Keranjang kosong!");
            return;
        }
        if (Number(cashReceived) < subtotal) {
            alert("Uang tunai tidak cukup!");
            return;
        }
        
        const txData: Omit<Transaction, 'id'> = {
            type,
            date: new Date(),
            customerId: customer?.id,
            customerSnapshot: customer ? { memberNo: customer.memberNo, name: customer.name, phone: customer.phone, address: customer.address } : undefined,
            items: cart,
            subtotal,
            total: subtotal, // Assuming no discount for now
            paymentType: "CASH",
            cashReceived: Number(cashReceived),
            changeDue: Number(cashReceived) - subtotal,
            receiptNo: `TX-${Date.now()}`
        };

        try {
            await db.transaction('rw', db.transactions, db.products, db.customers, async () => {
                const txId = await db.transactions.add(txData as Transaction);
                
                for(const item of cart) {
                    await db.products.where({ id: item.productId }).modify(p => {
                        p.stockQty -= item.qty;
                    });
                }
                
                if (customer) {
                    await db.customers.where({ id: customer.id }).modify(c => {
                        c.totalTransactions += 1;
                    });
                }
                
                const finalTx = await db.transactions.get(txId);
                setLastTransaction(finalTx || null);
            });
            resetTransaction();
        } catch (error) {
            const err = ensureError(error);
            console.error("Failed to process transaction: ", error);
            alert(`Gagal menyimpan transaksi: ${err.message}`);
        }
    };

    const selectStyles = {
        control: (styles: any) => ({ ...styles, backgroundColor: '#374151', borderColor: '#4b5563' }),
        menu: (styles: any) => ({ ...styles, backgroundColor: '#374151' }),
        option: (styles: any, { isFocused, isSelected }: any) => ({ ...styles, backgroundColor: isSelected ? '#2563eb' : isFocused ? '#4b5563' : '#374151', color: '#d1d5db' }),
        singleValue: (styles: any) => ({ ...styles, color: '#d1d5db' }),
    };


    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Main content - Product List */}
            <div className="w-3/5 p-4 flex flex-col">
                <h1 className="text-2xl font-bold mb-4">{type === 'RETAIL' ? 'Transaksi Eceran' : 'Transaksi Grosir'}</h1>
                <div className="relative mb-4">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                     <input 
                        type="text" 
                        placeholder="Cari produk (kode atau nama)..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map(p => {
                            const displayPrice = type === 'RETAIL' ? p.retailPrice : (asInt(p.wholesalePrice) ?? p.retailPrice);
                            const hasNoWholesalePrice = type === 'WHOLESALE' && Number.isNaN(asInt(p.wholesalePrice));

                            return (
                                <div key={p.id} onClick={() => addToCart(p)} className="border rounded-lg p-3 cursor-pointer hover:border-blue-500 hover:shadow-lg dark:border-gray-700 dark:hover:border-blue-400 flex flex-col justify-between bg-white dark:bg-gray-800">
                                    <div>
                                        <p className="font-semibold text-sm truncate">{p.name}</p>
                                        {hasNoWholesalePrice && (
                                            <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-1.5 py-0.5 rounded">
                                                Wholesale price missing
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Stok: {p.stockQty}</p>
                                        <p className="text-blue-500 dark:text-blue-400 font-bold text-sm">{formatCurrency(displayPrice)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Cart */}
            <div className="w-2/5 bg-white dark:bg-gray-800 p-4 border-l dark:border-gray-700 flex flex-col">
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Pelanggan (Opsional)</label>
                    <div className="flex items-center gap-2">
                         <Select
                            options={customerOptions}
                            onChange={(option) => setCustomer(customers?.find(c => c.id === option?.value) || null)}
                            value={customer ? { value: customer.id!, label: `${customer.memberNo} - ${customer.name}` } : null}
                            isClearable
                            placeholder="Pilih pelanggan..."
                            styles={selectStyles}
                            className="flex-grow"
                        />
                        {customer && <button onClick={() => setCustomer(null)} className="text-red-500 p-2"><X className="h-5 w-5"/></button>}
                    </div>
                </div>
                
                <h2 className="text-lg font-bold border-b pb-2 mb-2 dark:border-gray-600">Keranjang ({cart.length})</h2>
                
                <div className="flex-grow overflow-y-auto -mr-4 pr-4">
                    {cart.length === 0 ? (
                        <p className="text-center text-gray-500 mt-10">Keranjang masih kosong.</p>
                    ) : (
                        cart.map(item => (
                            <div key={item.productId} className="flex items-center mb-3">
                                <div className="flex-grow">
                                    <p className="font-semibold text-sm">{item.name}</p>
                                    <div className="flex items-center">
                                        <p className="text-xs text-gray-500 mr-2">{formatCurrency(item.unitPrice)}</p>
                                        {item.note === 'fallback-retail' && (
                                            <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 px-1.5 py-0.5 rounded">
                                                Retail price used
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center mx-2">
                                    <button onClick={() => updateQty(item.productId, item.qty - 1)} className="p-1 rounded-full bg-gray-200 dark:bg-gray-600"><Minus className="h-3 w-3"/></button>
                                    <input type="number" value={item.qty} onChange={e => updateQty(item.productId, parseInt(e.target.value) || 1)} className="w-12 text-center mx-1 bg-transparent border-b dark:border-gray-500"/>
                                    <button onClick={() => updateQty(item.productId, item.qty + 1)} className="p-1 rounded-full bg-gray-200 dark:bg-gray-600"><Plus className="h-3 w-3"/></button>
                                </div>
                                <p className="w-24 text-right font-semibold text-sm">{formatCurrency(item.lineTotal)}</p>
                                <button onClick={() => removeFromCart(item.productId)} className="ml-2 text-red-500"><Trash2 className="h-4 w-4"/></button>
                            </div>
                        ))
                    )}
                </div>

                <div className="border-t pt-4 dark:border-gray-600">
                    <div className="flex justify-between items-center text-lg font-bold mb-4">
                        <span>Total</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                     <button onClick={() => cart.length > 0 && setPaymentOpen(true)} disabled={cart.length === 0} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        BAYAR
                    </button>
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Pembayaran</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between text-lg">
                                <span>Total Belanja:</span>
                                <span className="font-bold">{formatCurrency(subtotal)}</span>
                            </div>
                            <div>
                                <label htmlFor="cashReceived" className="block text-sm font-medium">Uang Tunai Diterima</label>
                                <input
                                    type="number"
                                    id="cashReceived"
                                    value={cashReceived}
                                    onChange={e => setCashReceived(e.target.value)}
                                    className="mt-1 block w-full p-3 text-lg rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="0"
                                    autoFocus
                                    inputMode="numeric"
                                />
                            </div>
                             <div className="flex justify-between text-lg">
                                <span>Kembalian:</span>
                                <span className="font-bold text-green-500">{formatCurrency(Math.max(0, Number(cashReceived) - subtotal))}</span>
                            </div>
                        </div>
                         <div className="flex justify-end space-x-4 pt-6">
                            <button type="button" onClick={() => setPaymentOpen(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Batal</button>
                            <button onClick={handlePayment} disabled={Number(cashReceived) < subtotal} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">Konfirmasi Bayar</button>
                        </div>
                    </div>
                 </div>
            )}
            
            {/* Receipt Modal */}
            {lastTransaction && <Receipt transaction={lastTransaction} onClose={() => setLastTransaction(null)} />}
        </div>
    );
};

export default TransactionPage;
