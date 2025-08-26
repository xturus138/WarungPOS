
import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../../db/db';
import { ShoppingCart, Store, Package, FileText, ArrowUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';

const QuickActionButton: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
    <Link to={to} className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        {icon}
        <span className="mt-2 font-semibold text-gray-700 dark:text-gray-300">{label}</span>
    </Link>
);

const PosDashboard: React.FC = () => {
    const { user } = useAuth();

    const transactionsToday = useLiveQuery(() => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return db.transactions.where('date').between(start, end).toArray();
    }, []);

    const topSellingProducts = useMemo(() => {
        if (!transactionsToday) return [];

        const itemAgg: { [key: string]: { name: string; qty: number; revenue: number } } = {};
        for (const t of transactionsToday) {
            for (const it of t.items) {
                const a = (itemAgg[it.productId] ??= { name: it.name, qty: 0, revenue: 0 });
                a.qty += it.qty;
                a.revenue += it.lineTotal;
            }
        }
        return Object.values(itemAgg).sort((a, b) => b.qty - a.qty).slice(0, 5);
    }, [transactionsToday]);


    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-200">Selamat Datang, {user?.username}!</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Siap untuk memulai transaksi hari ini?</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <QuickActionButton to="/pos/retail" icon={<ShoppingCart className="h-10 w-10 text-blue-500" />} label="Transaksi Eceran" />
                <QuickActionButton to="/pos/wholesale" icon={<Store className="h-10 w-10 text-green-500" />} label="Transaksi Grosir" />
                <QuickActionButton to="/pos/products" icon={<Package className="h-10 w-10 text-yellow-500" />} label="Lihat Produk" />
                <QuickActionButton to="/pos/reports" icon={<FileText className="h-10 w-10 text-purple-500" />} label="Laporan" />
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                    <ArrowUp className="h-5 w-5 mr-2 text-green-500"/>
                    Produk Terlaris Hari Ini
                </h3>
                {topSellingProducts.length > 0 ? (
                    <ul className="space-y-3">
                        {topSellingProducts.map((product, index) => (
                            <li key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                <div>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{product.name}</span>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Pendapatan: {formatCurrency(product.revenue)}</p>
                                </div>
                                <div className="font-bold text-lg text-blue-500">{product.qty} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">terjual</span></div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center p-8 text-gray-500">
                        <p>Belum ada penjualan hari ini.</p>
                        <p>Mulai transaksi pertama Anda!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PosDashboard;
