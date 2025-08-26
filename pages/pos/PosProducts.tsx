
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { formatCurrency } from '../../utils/formatters';
import { Search, Package } from 'lucide-react';

const PosProducts: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const products = useLiveQuery(() => {
        if (searchTerm) {
            return db.products.where('name').startsWithIgnoreCase(searchTerm).or('code').startsWithIgnoreCase(searchTerm).toArray();
        }
        return db.products.toArray();
    }, [searchTerm]);

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Daftar Produk</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari produk (nama atau kode)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-80 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Kode</th>
                            <th scope="col" className="px-6 py-3">Nama Produk</th>
                            <th scope="col" className="px-6 py-3">Harga Eceran</th>
                            <th scope="col" className="px-6 py-3">Harga Grosir</th>
                            <th scope="col" className="px-6 py-3">Stok</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products?.map((product) => (
                            <tr key={product.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{product.code}</th>
                                <td className="px-6 py-4">{product.name}</td>
                                <td className="px-6 py-4">{formatCurrency(product.retailPrice)}</td>
                                <td className="px-6 py-4">{formatCurrency(product.wholesalePrice)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stockQty > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                        {product.stockQty}
                                    </span>
                                </td>
                            </tr>
                        ))}
                         {(!products || products.length === 0) && (
                            <tr>
                                <td colSpan={5} className="text-center p-8 text-gray-500">
                                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-2"/>
                                    Tidak ada produk ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PosProducts;
