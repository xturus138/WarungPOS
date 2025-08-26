
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, UserCircle } from 'lucide-react';

const Header: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 no-print">
            <div>
                {/* Can add breadcrumbs or page title here */}
            </div>
            <div className="flex items-center">
                <div className="flex items-center mr-4">
                     <UserCircle className="h-8 w-8 text-gray-500 mr-2" />
                    <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200">{user?.username}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</div>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 rounded-md"
                    aria-label="Logout"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </button>
            </div>
        </header>
    );
};

export default Header;
