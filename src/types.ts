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
    invoiceId?: string;
    paymentUrl?: string;
    createdAt: string;
    accessLinkSnap: string;
    batchId?: string;
}

export interface PromoCode {
    code: string;
    discountPercent: number;
    expiryDate: string;
    isActive: boolean;
}

export interface ChatMessage {
    id: string;
    userId: string;
    text: string;
    isAdmin: boolean;
    timestamp: string;
}
