
import React, { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Transaction, TransactionItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, ShoppingCart, Users, ArrowDown, ArrowUp } from 'lucide-react';

type KpiData = {
  totalRevenue: number;
  transactionCount: number;
  avgTicket: number;
  topSellingProduct: { name: string; qty: number } | null;
  memberTransactions: number;
  nonMemberTransactions: number;
  memberRevenue: number;
  nonMemberRevenue: number;
};

type ChartData = {
  salesByDay: { name: string; Penjualan: number }[];
  productTopN: { name: string; Jumlah: number }[];
};

const DashboardCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subtext?: string; }> = ({ title, value, icon, subtext }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
        <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-full mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
            {subtext && <p className="text-xs text-gray-400 dark:text-gray-500">{subtext}</p>}
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [kpiData, setKpiData] = useState<KpiData | null>(null);
    const [chartData, setChartData] = useState<ChartData | null>(null);

    const updateDateRange = useCallback((range: 'today' | 'week' | 'month') => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        if (range === 'today') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (range === 'week') {
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0, 0, 0, 0);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
        } else if (range === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
        }
        setDateRange(range);
        setStartDate(start);
        setEndDate(end);
    }, []);

    useEffect(() => {
        updateDateRange('today');
    }, [updateDateRange]);

    const transactions = useLiveQuery(
        () => db.transactions.where('date').between(startDate, endDate).toArray(),
        [startDate, endDate]
    );

    useEffect(() => {
        if (!transactions) return;

        const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
        const transactionCount = transactions.length;
        const avgTicket = transactionCount ? totalRevenue / transactionCount : 0;
        
        const memberTransactions = transactions.filter(t => t.customerId).length;
        const nonMemberTransactions = transactionCount - memberTransactions;
        const memberRevenue = transactions.filter(t => t.customerId).reduce((sum, t) => sum + t.total, 0);
        const nonMemberRevenue = totalRevenue - memberRevenue;

        const itemAgg: { [key: string]: { name: string; qty: number; revenue: number } } = {};
        for (const t of transactions) {
            for (const it of t.items) {
                const a = (itemAgg[it.productId] ??= { name: it.name, qty: 0, revenue: 0 });
                a.qty += it.qty;
                a.revenue += it.lineTotal;
            }
        }
        const topProduct = Object.values(itemAgg).sort((a, b) => b.qty - a.qty)[0] ?? null;

        setKpiData({
            totalRevenue,
            transactionCount,
            avgTicket,
            topSellingProduct: topProduct,
            memberTransactions, nonMemberTransactions,
            memberRevenue, nonMemberRevenue,
        });

        // Chart Data Processing
        const salesByDayData: { [key: string]: number } = {};
        transactions.forEach(t => {
            const day = t.date.toLocaleDateString('id-ID', { weekday: 'short' });
            salesByDayData[day] = (salesByDayData[day] || 0) + t.total;
        });
        const salesByDay = Object.keys(salesByDayData).map(day => ({ name: day, Penjualan: salesByDayData[day] }));

        const productTopN = Object.values(itemAgg)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5)
            .map(p => ({ name: p.name, Jumlah: p.qty }));
        
        setChartData({ salesByDay, productTopN });

    }, [transactions]);

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Dashboard Admin</h1>
            
            <div className="mb-6">
                <div className="flex space-x-2">
                    {['today', 'week', 'month'].map((range) => (
                        <button
                            key={range}
                            onClick={() => updateDateRange(range as 'today' | 'week' | 'month')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                                dateRange === range 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <DashboardCard 
                    title="Total Pendapatan" 
                    value={formatCurrency(kpiData?.totalRevenue)} 
                    icon={<DollarSign className="h-6 w-6 text-blue-500" />} 
                />
                <DashboardCard 
                    title="Jumlah Transaksi" 
                    value={kpiData?.transactionCount.toString() ?? '0'} 
                    icon={<ShoppingCart className="h-6 w-6 text-blue-500" />} 
                />
                <DashboardCard 
                    title="Rata-rata Transaksi" 
                    value={formatCurrency(kpiData?.avgTicket)} 
                    icon={<Users className="h-6 w-6 text-blue-500" />} 
                />
                 <DashboardCard 
                    title="Produk Terlaris" 
                    value={kpiData?.topSellingProduct?.name ?? '-'}
                    subtext={kpiData?.topSellingProduct ? `${kpiData.topSellingProduct.qty} terjual` : ''}
                    icon={<ArrowUp className="h-6 w-6 text-blue-500" />}
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Penjualan Harian</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData?.salesByDay}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} />
                            <YAxis tickFormatter={(value) => formatCurrency(value as number)} tick={{ fill: '#9ca3af' }}/>
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} labelStyle={{ color: '#d1d5db' }} formatter={(value) => formatCurrency(value as number)}/>
                            <Legend />
                            <Line type="monotone" dataKey="Penjualan" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Top 5 Produk Terlaris</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData?.productTopN} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis type="number" tick={{ fill: '#9ca3af' }} />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} labelStyle={{ color: '#d1d5db' }} />
                            <Legend />
                            <Bar dataKey="Jumlah" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Analisis Pelanggan</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Transaksi Member</p>
                        <p className="text-2xl font-bold">{kpiData?.memberTransactions}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pendapatan Member</p>
                        <p className="text-2xl font-bold">{formatCurrency(kpiData?.memberRevenue)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Transaksi Non-Member</p>
                        <p className="text-2xl font-bold">{kpiData?.nonMemberTransactions}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pendapatan Non-Member</p>
                        <p className="text-2xl font-bold">{formatCurrency(kpiData?.nonMemberRevenue)}</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AdminDashboard;
