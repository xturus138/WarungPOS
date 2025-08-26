
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Customer } from '../../types';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

const CustomerManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const customers = useLiveQuery(() => {
        if (searchTerm) {
            return db.customers
                .where('name').startsWithIgnoreCase(searchTerm)
                .or('phone').startsWithIgnoreCase(searchTerm)
                .or('memberNo').startsWithIgnoreCase(searchTerm)
                .toArray();
        }
        return db.customers.toArray();
    }, [searchTerm]);

    const openModal = (customer: Customer | null = null) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) {
            try {
                // Check if customer has transactions
                const txCount = await db.transactions.where({ customerId: id }).count();
                if (txCount > 0) {
                    alert('Tidak dapat menghapus pelanggan yang sudah memiliki transaksi.');
                    return;
                }
                await db.customers.delete(id);
            } catch (error) {
                console.error("Failed to delete customer:", error);
                alert("Gagal menghapus pelanggan.");
            }
        }
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Manajemen Pelanggan</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari (no, nama, telp)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
                    <Plus className="h-5 w-5 mr-2" /> Tambah Pelanggan
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">No Anggota</th>
                            <th scope="col" className="px-6 py-3">Nama Customer</th>
                            <th scope="col" className="px-6 py-3">Telepon</th>
                            <th scope="col" className="px-6 py-3">Alamat</th>
                            <th scope="col" className="px-6 py-3">Total Transaksi</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers?.map((customer) => (
                            <tr key={customer.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{customer.memberNo}</th>
                                <td className="px-6 py-4">{customer.name}</td>
                                <td className="px-6 py-4">{customer.phone}</td>
                                <td className="px-6 py-4">{customer.address}</td>
                                <td className="px-6 py-4">{customer.totalTransactions}</td>
                                <td className="px-6 py-4 flex space-x-2">
                                    <button onClick={() => openModal(customer)} className="text-blue-500 hover:text-blue-700"><Edit className="h-5 w-5" /></button>
                                    <button onClick={() => handleDelete(customer.id!)} className="text-red-500 hover:text-red-700"><Trash2 className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <CustomerModal customer={editingCustomer} onClose={closeModal} />}
        </div>
    );
};

const CustomerModal: React.FC<{ customer: Customer | null, onClose: () => void }> = ({ customer, onClose }) => {
    const [formData, setFormData] = useState<Partial<Customer>>(customer || {
        memberNo: '', name: '', phone: '', address: ''
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...formData, updatedAt: new Date() };

        if (!dataToSave.memberNo || !dataToSave.name || !dataToSave.phone) {
            alert("No Anggota, Nama, dan Telepon wajib diisi.");
            return;
        }
        
        try {
            if (customer?.id) {
                await db.customers.update(customer.id, dataToSave);
            } else {
                await db.customers.add({ ...dataToSave, totalTransactions: 0, createdAt: new Date() } as Customer);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save customer:", error);
            alert(`Gagal menyimpan pelanggan. Pastikan No Anggota unik.`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{customer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="memberNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">No Anggota</label>
                        <input type="text" name="memberNo" id="memberNo" value={formData.memberNo} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Customer</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telepon</label>
                        <input type="text" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alamat</label>
                        <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
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

export default CustomerManagement;
