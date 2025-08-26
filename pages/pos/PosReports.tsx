
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PosReports: React.FC = () => {
    const today = new Date().toISOString().split('T')[0];
    const [filterDate, setFilterDate] = useState(today);

    const transactions = useLiveQuery(() => {
        const start = new Date(filterDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filterDate);
        end.setHours(23, 59, 59, 999);
        return db.transactions.where('date').between(start, end).reverse().toArray();
    }, [filterDate]);
    
    const totals = useMemo(() => {
        if (!transactions) return { total: 0, count: 0 };
        return {
            total: transactions.reduce((acc, tx) => acc + tx.total, 0),
            count: transactions.length,
        };
    }, [transactions]);


    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Laporan Penjualan Harian</h1>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 flex items-center gap-4">
                <div>
                    <label htmlFor="filterDate" className="text-sm mr-2">Pilih Tanggal:</label>
                    <input type="date" id="filterDate" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                <h2 className="font-semibold text-lg">Ringkasan Tanggal {new Date(filterDate).toLocaleDateString('id-ID')}</h2>
                <div className="flex justify-around mt-2">
                    <p>Total Transaksi: <span className="font-bold">{totals.count}</span></p>
                    <p>Total Pendapatan: <span className="font-bold">{formatCurrency(totals.total)}</span></p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Waktu</th>
                            <th scope="col" className="px-6 py-3">No Struk</th>
                            <th scope="col" className="px-6 py-3">Tipe</th>
                            <th scope="col" className="px-6 py-3">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions?.map((tx) => (
                            <tr key={tx.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4">{tx.date.toLocaleTimeString('id-ID')}</td>
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{tx.receiptNo}</th>
                                <td className="px-6 py-4">
                                     <span className={`px-2 py-1 rounded-full text-xs ${tx.type === 'RETAIL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>{tx.type}</span>
                                </td>
                                <td className="px-6 py-4 font-semibold">{formatCurrency(tx.total)}</td>
                            </tr>
                        ))}
                         {(!transactions || transactions.length === 0) && (
                            <tr>
                                <td colSpan={4} className="text-center p-8 text-gray-500">Tidak ada transaksi pada tanggal ini.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PosReports;
