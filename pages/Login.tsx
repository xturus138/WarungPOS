
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Store, User, Lock, Briefcase, Eye, EyeOff } from 'lucide-react';
import type { Role } from '../types';
import { db } from '../db/db';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('CASHIER');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(username, password, role);
    if (!success) {
      setError('Username, password, atau role salah.');
    }
  };
  
  const handleDemoLogin = async (demoRole: Role) => {
    let demoUsername, demoPassword;
    if (demoRole === 'ADMIN') {
        demoUsername = 'admin123';
        demoPassword = 'admin123';
    } else {
        demoUsername = 'kasir123';
        demoPassword = 'kasir123';
    }
    
    setUsername(demoUsername);
    setPassword(demoPassword);
    setRole(demoRole);
    
    setError('');
    const success = await login(demoUsername, demoPassword, demoRole);
    if (!success) {
      setError('Gagal login dengan akun demo. Coba reset data.');
    }
  }

  const handleResetDb = async () => {
    if (window.confirm('APAKAH ANDA YAKIN? Semua data (produk, transaksi, dll) akan dihapus permanen.')) {
        try {
            await db.delete();
            window.location.reload();
        } catch (error) {
            console.error("Failed to delete database", error);
            alert("Gagal menghapus database.");
        }
    }
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-20">
                <Store className="h-12 w-12 text-blue-500" />
                <h1 className="text-4xl font-bold ml-3 text-gray-800 dark:text-gray-200">WarungPOS</h1>
            </div>
            <h2 className="mt-2 text-center text-xl text-gray-600 dark:text-gray-400">
            Login ke akun Anda
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>
             <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="role"
                name="role"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="CASHIER">Cashier</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Login
            </button>
          </div>
          <div className="flex items-center justify-between mt-4 space-x-2">
            <button type="button" onClick={() => handleDemoLogin('ADMIN')} className="w-full text-sm text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900 py-2 px-4 rounded-md">
                Masuk sebagai Admin
            </button>
             <button type="button" onClick={() => handleDemoLogin('CASHIER')} className="w-full text-sm text-green-600 bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900 py-2 px-4 rounded-md">
                Masuk sebagai Kasir
            </button>
          </div>
        </form>
         <div className="text-center mt-6">
            <button onClick={handleResetDb} className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 underline">
                Reset Demo Data
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;