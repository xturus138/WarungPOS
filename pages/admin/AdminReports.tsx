
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Download } from 'lucide-react';

const AdminReports: React.FC = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const [startDate, setStartDate] = useState(startOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'RETAIL' | 'WHOLESALE'>('ALL');

    const transactions = useLiveQuery(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        let query = db.transactions.where('date').between(start, end);
        
        if (typeFilter !== 'ALL') {
            return query.and(tx => tx.type === typeFilter).reverse().toArray();
        }
        return query.reverse().toArray();
    }, [startDate, endDate, typeFilter]);

    const filteredTotals = useMemo(() => {
        if (!transactions) return { total: 0, count: 0 };
        return {
            total: transactions.reduce((acc, tx) => acc + tx.total, 0),
            count: transactions.length,
        };
    }, [transactions]);
    
    const exportToCSV = () => {
        if (!transactions || transactions.length === 0) {
            alert("Tidak ada data untuk diekspor.");
            return;
        }

        const headers = ["ReceiptNo", "Date", "Type", "Customer", "Subtotal", "Discount", "Total", "PaymentType", "Items"];
        const rows = transactions.map(tx => [
            tx.receiptNo,
            formatDate(tx.date),
            tx.type,
            tx.customerSnapshot?.name || 'N/A',
            tx.subtotal,
            tx.discount || 0,
            tx.total,
            tx.paymentType,
            tx.items.map(item => `${item.name} (Qty: ${item.qty}, Price: ${item.unitPrice})`).join('; ')
        ]);

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `laporan_penjualan_${startDate}_sd_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Laporan Penjualan</h1>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 flex flex-wrap items-center gap-4">
                <div>
                    <label htmlFor="startDate" className="text-sm mr-2">Dari Tanggal:</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label htmlFor="endDate" className="text-sm mr-2">Sampai Tanggal:</label>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label htmlFor="typeFilter" className="text-sm mr-2">Tipe Transaksi:</label>
                    <select id="typeFilter" value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                        <option value="ALL">Semua</option>
                        <option value="RETAIL">Eceran</option>
                        <option value="WHOLESALE">Grosir</option>
                    </select>
                </div>
                <div className="ml-auto">
                    <button onClick={exportToCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700">
                       <Download className="h-5 w-5 mr-2" /> Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                <h2 className="font-semibold text-lg">Ringkasan</h2>
                <div className="flex justify-around mt-2">
                    <p>Total Transaksi: <span className="font-bold">{filteredTotals.count}</span></p>
                    <p>Total Pendapatan: <span className="font-bold">{formatCurrency(filteredTotals.total)}</span></p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">No Struk</th>
                            <th scope="col" className="px-6 py-3">Tanggal</th>
                            <th scope="col" className="px-6 py-3">Tipe</th>
                            <th scope="col" className="px-6 py-3">Pelanggan</th>
                            <th scope="col" className="px-6 py-3">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions?.map((tx) => (
                            <tr key={tx.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{tx.receiptNo}</th>
                                <td className="px-6 py-4">{formatDate(tx.date)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${tx.type === 'RETAIL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>{tx.type}</span>
                                </td>
                                <td className="px-6 py-4">{tx.customerSnapshot?.name || '-'}</td>
                                <td className="px-6 py-4 font-semibold">{formatCurrency(tx.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {(!transactions || transactions.length === 0) && (
                    <div className="text-center p-8 text-gray-500">Tidak ada data transaksi pada rentang tanggal yang dipilih.</div>
                )}
            </div>
        </div>
    );
};

export default AdminReports;
