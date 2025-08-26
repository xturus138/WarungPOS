
import React, { useRef } from 'react';
import type { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Printer } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

interface ReceiptProps {
  transaction: Transaction | null;
  onClose: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ transaction, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const settings = useLiveQuery(() => db.settings.get('app'));

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm flex flex-col max-h-[90vh]">
        <div ref={receiptRef} className="receipt bg-white text-black p-4 flex-grow overflow-y-auto">
          <div className="text-center">
            <h2 className="text-xl font-bold">{settings?.businessName || 'Warung POS'}</h2>
            <p className="text-xs">{settings?.address || ''}</p>
            <hr className="my-2 border-black border-dashed" />
          </div>
          <div className="text-xs">
            <p>No: {transaction.receiptNo}</p>
            <p>Tgl: {formatDate(transaction.date)}</p>
            <p>Kasir: {JSON.parse(localStorage.getItem('warung_pos_user') || '{}').username || 'N/A'}</p>
            {transaction.customerSnapshot && (
              <p>Plgn: {transaction.customerSnapshot.name}</p>
            )}
          </div>
          <hr className="my-2 border-black border-dashed" />
          <div>
            {transaction.items.map((item, index) => (
              <div key={index} className="text-xs mb-1">
                <p className="font-semibold">{item.name}</p>
                <div className="flex justify-between" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <span>{item.qty} x {formatCurrency(item.unitPrice)}</span>
                  <span>{formatCurrency(item.lineTotal)}</span>
                </div>
              </div>
            ))}
          </div>
          <hr className="my-2 border-black border-dashed" />
          <div className="text-xs space-y-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
             <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(transaction.subtotal)}</span>
            </div>
            {transaction.discount && (
                 <div className="flex justify-between">
                    <span>Diskon</span>
                    <span>-{formatCurrency(transaction.discount)}</span>
                </div>
            )}
            <div className="flex justify-between font-bold text-sm">
                <span>TOTAL</span>
                <span>{formatCurrency(transaction.total)}</span>
            </div>
            <div className="flex justify-between">
                <span>Tunai</span>
                <span>{formatCurrency(transaction.cashReceived)}</span>
            </div>
             <div className="flex justify-between">
                <span>Kembali</span>
                <span>{formatCurrency(transaction.changeDue)}</span>
            </div>
          </div>
           <hr className="my-2 border-black border-dashed" />
           <p className="text-center text-xs mt-4">Terima kasih!</p>
        </div>
        <div className="mt-4 flex space-x-2 no-print">
            <button onClick={onClose} className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                Tutup
            </button>
            <button onClick={handlePrint} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-blue-700">
                <Printer className="h-5 w-5 mr-2" /> Cetak
            </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
