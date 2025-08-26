import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { IncomingGoods as IncomingGoodsType, Supplier, Product, IncomingGoodsItem } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Plus, Search, Trash2 } from 'lucide-react';
import Select from 'react-select';
import { Dexie } from 'dexie';

const IncomingGoods: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const incomingGoods = useLiveQuery(() => 
        db.incomingGoods
          .where('invoiceNo').startsWithIgnoreCase(searchTerm)
          .reverse()
          .sortBy('transactionTime')
    , [searchTerm]);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Barang Masuk</h1>
             <div className="flex justify-between items-center mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari No Faktur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button onClick={openModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
                    <Plus className="h-5 w-5 mr-2" /> Catat Barang Masuk
                </button>
            </div>
             <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">No</th>
                            <th scope="col" className="px-6 py-3">No Faktur</th>
                            <th scope="col" className="px-6 py-3">Jumlah total</th>
                            <th scope="col" className="px-6 py-3">Waktu Transaksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incomingGoods?.map((item, index) => (
                            <tr key={item.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4">{index + 1}</td>
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{item.invoiceNo}</td>
                                <td className="px-6 py-4">{formatCurrency(item.grandTotal)}</td>
                                <td className="px-6 py-4">{formatDate(item.transactionTime)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <IncomingGoodsModal onClose={closeModal} />}
        </div>
    );
};

const IncomingGoodsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [invoiceNo, setInvoiceNo] = useState('');
    const [supplierId, setSupplierId] = useState<number | undefined>(undefined);
    const [items, setItems] = useState<IncomingGoodsItem[]>([]);
    
    const suppliers = useLiveQuery(() => db.suppliers.toArray());
    const products = useLiveQuery(() => db.products.toArray());

    const supplierOptions = suppliers?.map(s => ({ value: s.id!, label: s.name })) || [];
    const productOptions = products?.map(p => ({ value: p.id!, label: `${p.code} - ${p.name}` })) || [];

    const handleAddItem = () => {
        setItems([...items, { productId: 0, qty: 1, unitCost: 0, lineTotal: 0 }]);
    };

    const handleItemChange = (index: number, field: keyof IncomingGoodsItem, value: any) => {
        const newItems = [...items];
        const numericValue = ['qty', 'unitCost'].includes(field) ? Number(value) : value;
        const item = { ...newItems[index], [field]: numericValue };
        
        item.lineTotal = item.qty * item.unitCost;
        newItems[index] = item;
        setItems(newItems);
    };
    
    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const grandTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoiceNo.trim()) {
            alert('Nomor faktur wajib diisi.');
            return;
        }
        if (items.length === 0 || items.some(item => !item.productId || item.qty <= 0)) {
            alert('Mohon tambahkan minimal satu produk dengan jumlah yang valid.');
            return;
        }

        try {
            await db.transaction('rw', db.incomingGoods, db.products, async () => {
                const incomingGoodsData: Omit<IncomingGoodsType, 'id'> = {
                    invoiceNo,
                    supplierId,
                    items,
                    grandTotal,
                    transactionTime: new Date(),
                };
                await db.incomingGoods.add(incomingGoodsData as IncomingGoodsType);

                for (const item of items) {
                    await db.products.where({ id: item.productId }).modify(product => {
                        product.stockQty += item.qty;
                    });
                }
            });
            
            alert('Data barang masuk berhasil disimpan!');
            onClose();

        } catch (error) {
            console.error('Failed to save incoming goods:', error);
            if (error instanceof Dexie.DexieError) {
                 alert(`Gagal menyimpan: ${error.message}`);
            } else {
                 alert('Terjadi kesalahan saat menyimpan data.');
            }
        }
    };

    const selectStyles = {
        control: (styles: any) => ({ ...styles, backgroundColor: '#374151', borderColor: '#4b5563' }),
        menu: (styles: any) => ({ ...styles, backgroundColor: '#374151' }),
        option: (styles: any, { isFocused, isSelected }: any) => ({
            ...styles,
            backgroundColor: isSelected ? '#2563eb' : isFocused ? '#4b5563' : '#374151',
            color: '#d1d5db',
        }),
        singleValue: (styles: any) => ({ ...styles, color: '#d1d5db' }),
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Catat Barang Masuk</h2>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="invoiceNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">No Faktur</label>
                            <input type="text" name="invoiceNo" id="invoiceNo" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        <div>
                            <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier (Opsional)</label>
                             <Select
                                options={supplierOptions}
                                onChange={(option) => setSupplierId(option?.value)}
                                isClearable
                                placeholder="Pilih supplier..."
                                styles={selectStyles}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold mt-6 mb-2 text-gray-800 dark:text-gray-200">Item Produk</h3>
                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                <div className="flex-grow">
                                    <Select
                                        options={productOptions}
                                        value={productOptions.find(p => p.value === item.productId)}
                                        onChange={(option) => handleItemChange(index, 'productId', option?.value || 0)}
                                        placeholder="Pilih produk..."
                                        styles={selectStyles}
                                    />
                                </div>
                                <div className="w-24">
                                     <input type="number" placeholder="Jumlah" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} min="1" required className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div className="w-32">
                                     <input type="number" placeholder="Harga Pokok" value={item.unitCost} onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)} min="0" required className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div className="w-32 text-right font-mono text-sm text-gray-700 dark:text-gray-300">
                                    {formatCurrency(item.lineTotal)}
                                </div>
                                <div>
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="h-5 w-5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                     <button type="button" onClick={handleAddItem} className="mt-3 text-sm text-blue-500 hover:text-blue-600 flex items-center">
                        <Plus className="h-4 w-4 mr-1"/> Tambah Item
                    </button>
                    
                </form>

                <div className="border-t dark:border-gray-700 mt-4 pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">Grand Total:</span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(grandTotal)}</span>
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Batal</button>
                        <button type="button" onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Simpan</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomingGoods;
