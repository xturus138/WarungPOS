

// FIX: Changed Dexie import to be a named import to fix inheritance issues and ensure methods are available.
import { Dexie, type Table } from 'dexie';
import type { User, Product, Supplier, Customer, Transaction, IncomingGoods, Settings } from '../types';

export class WarungPosDB extends Dexie {
  users!: Table<User>;
  products!: Table<Product>;
  suppliers!: Table<Supplier>;
  customers!: Table<Customer>;
  transactions!: Table<Transaction>;
  incomingGoods!: Table<IncomingGoods>;
  settings!: Table<Settings>;

  constructor() {
    super('warungPosDB');

    // HOTFIX: Correctly define version 1 as the legacy schema WITHOUT usernameNorm.
    // This allows the version 2 upgrade to run reliably for users with old databases.
    this.version(1).stores({
      users: '++id, &username',
      products: '++id, &code, name',
      suppliers: '++id, name',
      customers: '++id, &memberNo, name, phone',
      transactions: '++id, date, type, customerId, receiptNo',
      incomingGoods: '++id, transactionTime, supplierId, invoiceNo',
      settings: '&id',
    });
    
    // Version 2 introduces the usernameNorm index and normalizes roles.
    // This is the current, correct schema.
    this.version(2).stores({
      users: '++id, &username, &usernameNorm',
      products: '++id, &code, name',
      suppliers: '++id, name',
      customers: '++id, &memberNo, name, phone',
      transactions: '++id, date, type, customerId, receiptNo',
      incomingGoods: '++id, transactionTime, supplierId, invoiceNo',
      settings: '&id',
    }).upgrade(tx => {
      // This migration script ensures all users are safely updated to the new schema.
      return tx.table('users').toCollection().modify(user => {
        if (user.username && !user.usernameNorm) {
          user.usernameNorm = user.username.trim().toLowerCase();
        }
        if (typeof user.role === 'string') {
          const upperRole = user.role.toUpperCase();
          user.role = (upperRole === 'ADMIN' || upperRole === 'CASHIER') ? upperRole : 'CASHIER';
        } else {
          user.role = 'CASHIER';
        }
      });
    });

    // Version 3 backfills missing wholesale prices to prevent crashes.
    this.version(3).upgrade(tx => {
      const asInt = (n: any) => {
          const x = Number.parseInt(String(n ?? "").trim(), 10);
          return Number.isFinite(x) && x >= 0 ? x : NaN;
      };

      return tx.table("products").toCollection().modify(p => {
        const r = asInt(p.retailPrice);
        const w = asInt(p.wholesalePrice);
        if(Number.isNaN(w) && !Number.isNaN(r)) {
          p.wholesalePrice = r;
        }
      });
    });
    
    // FIX: Version 4 adds the missing index on stockQty for product filtering.
    this.version(4).stores({
      users: '++id, &username, &usernameNorm',
      products: '++id, &code, name, stockQty', // Added stockQty index
      suppliers: '++id, name',
      customers: '++id, &memberNo, name, phone',
      transactions: '++id, date, type, customerId, receiptNo',
      incomingGoods: '++id, transactionTime, supplierId, invoiceNo',
      settings: '&id',
    });


    this.on('populate', this.populate.bind(this));
  }

  async populate() {
    // Seed Users
    await this.users.bulkAdd([
      { username: 'admin123', usernameNorm: 'admin123', password: 'admin123', role: 'ADMIN', createdAt: new Date() },
      { username: 'kasir123', usernameNorm: 'kasir123', password: 'kasir123', role: 'CASHIER', createdAt: new Date() },
    ]);

    // Seed Products
    await this.products.bulkAdd([
      { code: 'P001', name: 'Kopi Hitam', retailPrice: 5000, wholesalePrice: 4000, costPrice: 2000, stockQty: 100, createdAt: new Date(), updatedAt: new Date() },
      { code: 'P002', name: 'Es Teh Manis', retailPrice: 4000, wholesalePrice: 3000, costPrice: 1500, stockQty: 150, createdAt: new Date(), updatedAt: new Date() },
      { code: 'P003', name: 'Indomie Goreng', retailPrice: 8000, wholesalePrice: 7000, costPrice: 4000, stockQty: 80, createdAt: new Date(), updatedAt: new Date() },
      { code: 'P004', name: 'Nasi Goreng Spesial', retailPrice: 15000, wholesalePrice: 13000, costPrice: 8000, stockQty: 50, createdAt: new Date(), updatedAt: new Date() },
      { code: 'P005', name: 'Air Mineral 600ml', retailPrice: 3000, wholesalePrice: 2500, costPrice: 1000, stockQty: 200, createdAt: new Date(), updatedAt: new Date() },
      { code: 'P006', name: 'Gorengan (Bakwan)', retailPrice: 1000, wholesalePrice: 800, costPrice: 400, stockQty: 300, createdAt: new Date(), updatedAt: new Date() },
      { code: 'P007', name: 'Roti Bakar Coklat', retailPrice: 10000, wholesalePrice: 8500, costPrice: 5000, stockQty: 40, createdAt: new Date(), updatedAt: new Date() },
      { code: 'P008', name: 'Teh Botol Sosro', retailPrice: 5000, wholesalePrice: 4000, costPrice: 2500, stockQty: 120, createdAt: new Date(), updatedAt: new Date() },
    ]);

    // Seed Suppliers
    await this.suppliers.bulkAdd([
        { name: 'Supplier Sembako Jaya', bankName: 'BCA', bankAccountNumber: '1234567890', createdAt: new Date(), updatedAt: new Date() },
        { name: 'Grosir Minuman Segar', bankName: 'Mandiri', bankAccountNumber: '0987654321', createdAt: new Date(), updatedAt: new Date() },
        { name: 'Pasar Induk Kramat Jati', bankName: 'BRI', bankAccountNumber: '1122334455', createdAt: new Date(), updatedAt: new Date() },
    ]);

    // Seed Customers
    await this.customers.bulkAdd([
        { memberNo: 'C001', name: 'Budi Santoso', phone: '081234567890', address: 'Jl. Merdeka No. 1', totalTransactions: 0, createdAt: new Date(), updatedAt: new Date() },
        { memberNo: 'C002', name: 'Siti Aminah', phone: '081345678901', address: 'Jl. Pahlawan No. 10', totalTransactions: 0, createdAt: new Date(), updatedAt: new Date() },
        { memberNo: 'C003', name: 'Agus Wijaya', phone: '081456789012', address: 'Jl. Sudirman No. 5A', totalTransactions: 0, createdAt: new Date(), updatedAt: new Date() },
        { memberNo: 'C004', name: 'Dewi Lestari', phone: '081567890123', address: 'Jl. Gatot Subroto No. 22', totalTransactions: 0, createdAt: new Date(), updatedAt: new Date() },
        { memberNo: 'C005', name: 'Eko Prasetyo', phone: '081678901234', address: 'Jl. Diponegoro No. 8', totalTransactions: 0, createdAt: new Date(), updatedAt: new Date() },
    ]);

    // Seed Settings
    await this.settings.put({
      id: "app",
      businessName: "Warung Kita",
      address: "Jl. Raya Bogor KM 20, Jakarta Timur",
      theme: "light",
      currency: "IDR",
    });
  }
}

export const db = new WarungPosDB();

export async function ensureDemoUsers() {
  await db.transaction('rw', db.users, async () => {
    const adminUser = await db.users.where('usernameNorm').equals('admin123').first();
    if (!adminUser) {
      await db.users.add({
        username: 'admin123',
        usernameNorm: 'admin123',
        password: 'admin123',
        role: 'ADMIN',
        createdAt: new Date(),
      });
    }

    const cashierUser = await db.users.where('usernameNorm').equals('kasir123').first();
    if (!cashierUser) {
      await db.users.add({
        username: 'kasir123',
        usernameNorm: 'kasir123',
        password: 'kasir123',
        role: 'CASHIER',
        createdAt: new Date(),
      });
    }
  });
}


db.open().catch((err) => {
    console.error(`Failed to open db: ${err.stack || err}`);
});