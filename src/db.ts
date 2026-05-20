import { JSONFilePreset } from 'lowdb/node';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    accessLink: string;
    category: string;
    inventoryCount: number;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    password?: string;
    googleId?: string;
    loyaltyPoints: number;
    referralCode: string;
    referredBy?: string;
}

export interface Order {
    id: string;
    userId: string;
    productId: string;
    price: number;
    status: 'pending' | 'completed' | 'failed' | 'expired';
    paymentId?: string;
    createdAt: string;
    accessLinkSnap: string;
    batchId?: string;
    invoiceId?: string;
    paymentUrl?: string;
}

export interface ChatMessage {
    id: string;
    userId: string;
    text: string;
    isAdmin: boolean;
    timestamp: string;
}

export interface Data {
    products: Product[];
    users: User[];
    orders: Order[];
    chats: ChatMessage[];
    categories: string[];
    analytics: {
        totalRevenue: number;
        totalOrders: number;
    };
}

const defaultData: Data = {
    products: [],
    users: [],
    orders: [],
    chats: [],
    categories: ['Course', 'Service', 'Account', 'Software'],
    analytics: {
        totalRevenue: 0,
        totalOrders: 0
    }
};

export const getDb = async () => {
    const db = await JSONFilePreset<Data>('file.db', defaultData);
    return db;
};
