
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

const ProductManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const products = useLiveQuery(() => {
        if (searchTerm) {
            return db.products.where('name').startsWithIgnoreCase(searchTerm).or('code').startsWithIgnoreCase(searchTerm).toArray();
        }
        return db.products.toArray();
    }, [searchTerm]);

    const openModal = (product: Product | null = null) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
            try {
                await db.products.delete(id);
            } catch (error) {
                console.error("Failed to delete product:", error);
                alert("Gagal menghapus produk.");
            }
        }
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Manajemen Produk</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari produk (nama atau kode)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
                    <Plus className="h-5 w-5 mr-2" /> Tambah Produk
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">No</th>
                            <th scope="col" className="px-6 py-3">Kode produk</th>
                            <th scope="col" className="px-6 py-3">Nama produk</th>
                            <th scope="col" className="px-6 py-3">Harga eceran</th>
                            <th scope="col" className="px-6 py-3">Harga grosir</th>
                            <th scope="col" className="px-6 py-3">Harga pokok</th>
                            <th scope="col" className="px-6 py-3">Jumlah stok</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products?.map((product, index) => (
                            <tr key={product.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4">{index + 1}</td>
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{product.code}</th>
                                <td className="px-6 py-4">{product.name}</td>
                                <td className="px-6 py-4">{formatCurrency(product.retailPrice)}</td>
                                <td className="px-6 py-4">{formatCurrency(product.wholesalePrice)}</td>
                                <td className="px-6 py-4">{formatCurrency(product.costPrice)}</td>
                                <td className="px-6 py-4">{product.stockQty}</td>
                                <td className="px-6 py-4 flex space-x-2">
                                    <button onClick={() => openModal(product)} className="text-blue-500 hover:text-blue-700"><Edit className="h-5 w-5" /></button>
                                    <button onClick={() => handleDelete(product.id!)} className="text-red-500 hover:text-red-700"><Trash2 className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <ProductModal product={editingProduct} onClose={closeModal} />}
        </div>
    );
};

const ProductModal: React.FC<{ product: Product | null, onClose: () => void }> = ({ product, onClose }) => {
    const [formData, setFormData] = useState<Partial<Product>>(product || {
        code: '', name: '', retailPrice: 0, wholesalePrice: 0, costPrice: 0, stockQty: 0
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['retailPrice', 'wholesalePrice', 'costPrice', 'stockQty'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? (value === '' ? '' : Number(value)) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...formData, updatedAt: new Date() };

        // Validation
        if (!dataToSave.code || !dataToSave.name) {
            alert("Kode dan Nama produk wajib diisi.");
            return;
        }
        if (dataToSave.retailPrice < 0 || dataToSave.wholesalePrice < 0 || dataToSave.costPrice < 0 || dataToSave.stockQty < 0) {
            alert("Harga dan stok tidak boleh negatif.");
            return;
        }
        
        try {
            if (product?.id) {
                await db.products.update(product.id, dataToSave);
            } else {
                await db.products.add({ ...dataToSave, createdAt: new Date() } as Product);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save product:", error);
            alert(`Gagal menyimpan produk. Pastikan kode produk unik.`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{product ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kode Produk</label>
                        <input type="text" name="code" id="code" value={formData.code} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Produk</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="retailPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Harga Eceran</label>
                            <input type="number" name="retailPrice" id="retailPrice" value={formData.retailPrice} onChange={handleChange} min="0" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                         <div>
                            <label htmlFor="wholesalePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Harga Grosir</label>
                            <input type="number" name="wholesalePrice" id="wholesalePrice" value={formData.wholesalePrice} onChange={handleChange} min="0" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Harga Pokok</label>
                            <input type="number" name="costPrice" id="costPrice" value={formData.costPrice} onChange={handleChange} min="0" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                         <div>
                            <label htmlFor="stockQty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jumlah Stok</label>
                            <input type="number" name="stockQty" id="stockQty" value={formData.stockQty} onChange={handleChange} min="0" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Batal</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductManagement;
