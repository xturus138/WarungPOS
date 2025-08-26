
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { User, Role } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

const UserManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const { user: currentUser } = useAuth();

    const users = useLiveQuery(() => {
        if (searchTerm) {
            return db.users.where('username').startsWithIgnoreCase(searchTerm).toArray();
        }
        return db.users.toArray();
    }, [searchTerm]);

    const openModal = (user: User | null = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleDelete = async (userToDelete: User) => {
        if (userToDelete.id === currentUser?.id) {
            alert("Anda tidak dapat menghapus akun Anda sendiri.");
            return;
        }
        if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${userToDelete.username}"?`)) {
            try {
                await db.users.delete(userToDelete.id!);
            } catch (error) {
                console.error("Failed to delete user:", error);
                alert("Gagal menghapus pengguna.");
            }
        }
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Manajemen Pengguna</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
                    <Plus className="h-5 w-5 mr-2" /> Tambah Pengguna
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Username</th>
                            <th scope="col" className="px-6 py-3">Role</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users?.map((user) => (
                            <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{user.username}</th>
                                <td className="px-6 py-4">{user.role}</td>
                                <td className="px-6 py-4 flex space-x-2">
                                    <button onClick={() => openModal(user)} className="text-blue-500 hover:text-blue-700"><Edit className="h-5 w-5" /></button>
                                    <button onClick={() => handleDelete(user)} className="text-red-500 hover:text-red-700 disabled:opacity-50" disabled={user.id === currentUser?.id}><Trash2 className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <UserModal user={editingUser} onClose={closeModal} />}
        </div>
    );
};

const UserModal: React.FC<{ user: User | null, onClose: () => void }> = ({ user, onClose }) => {
    const [username, setUsername] = useState(user?.username || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>(user?.role || 'CASHIER');
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!username.trim()) {
            alert("Username tidak boleh kosong.");
            return;
        }

        if (!user && password.length < 6) {
            alert("Password minimal harus 6 karakter.");
            return;
        }

        const usernameNorm = username.trim().toLowerCase();

        try {
            if (user?.id) {
                const updateData: Partial<User> = { username, usernameNorm, role };
                if (password) {
                    if (password.length < 6) {
                        alert("Password minimal harus 6 karakter.");
                        return;
                    }
                    updateData.password = password;
                }
                await db.users.update(user.id, updateData);
            } else {
                await db.users.add({ username, usernameNorm, password, role, createdAt: new Date() });
            }
            onClose();
        } catch (error) {
            console.error("Failed to save user:", error);
            alert(`Gagal menyimpan pengguna. Pastikan username unik.`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">{user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                        <input type="text" name="username" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input type="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!user} placeholder={user ? 'Kosongkan jika tidak ganti' : ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600">
                            <option value="CASHIER">CASHIER</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
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

export default UserManagement;