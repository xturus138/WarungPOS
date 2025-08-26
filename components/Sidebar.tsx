
import React from 'react';
import { NavLink } from 'react-router-dom';
import type { LucideProps } from 'lucide-react';
import { Store } from 'lucide-react';

export interface NavItem {
    href: string;
    icon: React.ComponentType<LucideProps>;
    label: string;
}

interface SidebarProps {
    navItems: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ navItems }) => {
    const activeLinkClass = "bg-blue-600 text-white";
    const inactiveLinkClass = "text-gray-300 hover:bg-gray-700 hover:text-white";

    return (
        <div className="w-64 bg-gray-800 text-white flex flex-col no-print">
            <div className="flex items-center justify-center h-20 border-b border-gray-700">
                <Store className="h-8 w-8 text-blue-400" />
                <h1 className="text-2xl font-bold ml-2">WarungPOS</h1>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                                isActive ? activeLinkClass : inactiveLinkClass
                            }`
                        }
                    >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;
