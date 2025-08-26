
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Supplier } from '../../types';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

const SupplierManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const suppliers = useLiveQuery(() => {
        if (searchTerm) {
            return db.suppliers.where('name').startsWithIgnoreCase(searchTerm).toArray();
        }
        return db.suppliers.toArray();
    }, [searchTerm]);

    const openModal = (supplier: Supplier | null = null) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus supplier ini?')) {
            try {
                await db.suppliers.delete(id);
            } catch (error) {
                console.error("Failed to delete supplier:", error);
                alert("Gagal menghapus supplier.");
            }
        }
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Manajemen Supplier</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nama supplier..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
                    <Plus className="h-5 w-5 mr-2" /> Tambah Supplier
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">No</th>
                            <th scope="col" className="px-6 py-3">Nama Supplier</th>
                            <th scope="col" className="px-6 py-3">Nama Bank</th>
                            <th scope="col" className="px-6 py-3">No Rekening</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers?.map((supplier, index) => (
                            <tr key={supplier.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4">{index + 1}</td>
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{supplier.name}</th>
                                <td className="px-6 py-4">{supplier.bankName}</td>
                                <td className="px-6 py-4">{supplier.bankAccountNumber}</td>
                                <td className="px-6 py-4 flex space-x-2">
                                    <button onClick={() => openModal(supplier)} className="text-blue-500 hover:text-blue-700"><Edit className="h-5 w-5" /></button>
                                    <button onClick={() => handleDelete(supplier.id!)} className="text-red-500 hover:text-red-700"><Trash2 className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <SupplierModal supplier={editingSupplier} onClose={closeModal} />}
        </div>
    );
};

const SupplierModal: React.FC<{ supplier: Supplier | null, onClose: () => void }> = ({ supplier, onClose }) => {
    const [formData, setFormData] = useState<Partial<Supplier>>(supplier || {
        name: '', bankName: '', bankAccountNumber: ''
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...formData, updatedAt: new Date() };

        if (!dataToSave.name) {
            alert("Nama supplier wajib diisi.");
            return;
        }
        
        try {
            if (supplier?.id) {
                await db.suppliers.update(supplier.id, dataToSave);
            } else {
                await db.suppliers.add({ ...dataToSave, createdAt: new Date() } as Supplier);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save supplier:", error);
            alert(`Gagal menyimpan supplier.`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{supplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Supplier</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Bank</label>
                        <input type="text" name="bankName" id="bankName" value={formData.bankName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">No Rekening</label>
                        <input type="text" name="bankAccountNumber" id="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
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

export default SupplierManagement;
