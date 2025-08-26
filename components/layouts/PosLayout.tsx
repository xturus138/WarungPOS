
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { BarChart2, Package, ShoppingCart, FileText, Users, Store } from 'lucide-react';
import type { NavItem } from '../Sidebar';

const posNavItems: NavItem[] = [
    { href: '/pos/dashboard', icon: BarChart2, label: 'Dashboard' },
    { href: '/pos/retail', icon: ShoppingCart, label: 'Transaksi Eceran' },
    { href: '/pos/wholesale', icon: Store, label: 'Transaksi Grosir' },
    { href: '/pos/products', icon: Package, label: 'Lihat Produk' },
    { href: '/pos/reports', icon: FileText, label: 'Laporan' },
];

const PosLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar navItems={posNavItems} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default PosLayout;
