
export type Role = "ADMIN" | "CASHIER";

export interface User {
  id?: number;
  username: string;
  usernameNorm?: string;
  password?: string;
  role: Role;
  createdAt: Date;
}

export interface Product {
  id?: number;
  code: string;
  name: string;
  retailPrice: number;
  wholesalePrice: number;
  costPrice: number;
  stockQty: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id?: number;
  name: string;
  bankName: string;
  bankAccountNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id?: number;
  memberNo: string;
  name: string;
  phone: string;
  address: string;
  totalTransactions: number;
  birthDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionItem {
  productId: number;
  code: string;
  name: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  note?: 'fallback-retail';
}

export interface Transaction {
  id?: number;
  type: "RETAIL" | "WHOLESALE";
  date: Date;
  customerId?: number;
  customerSnapshot?: { memberNo: string; name: string; phone: string; address: string };
  items: TransactionItem[];
  subtotal: number;
  discount?: number;
  total: number;
  paymentType: "CASH";
  cashReceived?: number;
  changeDue?: number;
  receiptNo: string;
}

export interface IncomingGoodsItem {
  productId: number;
  qty: number;
  unitCost: number;
  lineTotal: number;
}

export interface IncomingGoods {
  id?: number;
  invoiceNo: string;
  supplierId?: number;
  items: IncomingGoodsItem[];
  grandTotal: number;
  transactionTime: Date;
}

export interface Settings {
  id: "app";
  businessName: string;
  address: string;
  logoUrl?: string;
  theme: "light" | "dark";
  currency: "IDR";
}
