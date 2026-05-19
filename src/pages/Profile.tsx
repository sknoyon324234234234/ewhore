import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Order, Product } from '../types';
import { ShoppingBag, History, CreditCard, ExternalLink, Package, User as UserIcon, LogOut, ChevronRight, Copy, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { socket } from '../App';

export default function Profile() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');

    const fetchOrders = () => {
        if (!user) return;
        fetch('/api/orders?userId=' + user.id)
            .then(res => res.json())
            .then(data => setOrders(data || []))
            .catch(() => setOrders([]));
    };

    useEffect(() => {
        if (!user) return;
        
        fetch('/api/products')
            .then(res => res.json())
            .then(setProducts);

        fetchOrders();
    }, [user]);

    useEffect(() => {
        socket.on('new_order', () => {
            fetchOrders();
        });

        return () => {
            socket.off('new_order');
        };
    }, [user]);

    useEffect(() => {
        if (location.hash === '#history') {
            setActiveTab('history');
        } else if (location.hash === '#inventory' || !location.hash) {
            setActiveTab('inventory');
        }
    }, [location.hash]);

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
                <UserIcon className="w-20 h-20 text-zinc-200 dark:text-zinc-800 mb-6" />
                <h1 className="text-3xl font-bold mb-4">Account Required</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mb-8">Please sign in to view your profile and orders.</p>
                <button onClick={() => navigate('/auth')} className="telegram-btn px-12">Sign In with Google</button>
            </div>
        );
    }

    const purchasedProducts = orders
        .filter(order => order.status === 'completed')
        .map(order => {
            const product = products.find(p => p.id === order.productId);
            return {
                ...order,
                productName: product?.name || 'Unknown Product',
                productImage: product?.images?.[0] || '',
                currentLink: product?.accessLink || order.accessLinkSnap // Always show latest or fixed
            };
        });

    const totalSpent = orders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + order.price, 0);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto px-4 py-8 md:py-12"
        >
            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-6 md:mb-8 p-4 md:p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black dark:bg-white flex items-center justify-center text-2xl md:text-3xl font-black text-white dark:text-black shadow-md">
                    {user.name.charAt(0)}
                </div>
                <div className="flex-grow text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                        <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">{user.name}</h1>
                        {user.loyaltyPoints > 500 && (
                            <span className="bg-yellow-400 text-black text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> VIP ELITE
                            </span>
                        )}
                    </div>
                    <p className="text-xs md:text-sm text-zinc-500 mb-4">{user.email}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
                        <div className="px-2 py-1 md:px-3 md:py-1.5 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800">
                            <span className="block text-[9px] uppercase text-zinc-400 font-bold">Total Spent</span>
                            <span className="text-sm md:text-base font-black">${totalSpent.toFixed(2)}</span>
                        </div>
                        <div className="px-2 py-1 md:px-3 md:py-1.5 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800">
                            <span className="block text-[9px] uppercase text-zinc-400 font-bold">Products Bought</span>
                            <span className="text-sm md:text-base font-black">{purchasedProducts.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl w-fit mx-auto">
                <button 
                    onClick={() => setActiveTab('inventory')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'inventory' ? 'bg-white dark:bg-black shadow-sm' : 'text-zinc-500'}`}
                >
                    <ShoppingBag className="w-4 h-4" /> Inventory
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-black shadow-sm' : 'text-zinc-500'}`}
                >
                    <History className="w-4 h-4" /> Order History
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'inventory' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {purchasedProducts.length > 0 ? purchasedProducts.map((item) => (
                            <motion.div 
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="telegram-bubble group"
                            >
                                <div className="flex gap-4 items-start mb-4">
                                    <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                        {item.productImage ? (
                                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                        ) : (
                                            <Package className="w-6 h-6 text-zinc-400 opacity-50" />
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold mb-1">{item.productName}</h4>
                                        <p className="text-[10px] text-zinc-400 uppercase font-black">Purchased on {format(new Date(item.createdAt), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                                <a 
                                    href={item.currentLink} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="telegram-btn w-full flex items-center justify-center gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" /> Access Product
                                </a>
                            </motion.div>
                        )) : (
                            <div className="col-span-full py-20 text-center text-zinc-500 italic">
                                Your inventory is empty. Start shopping!
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.length > 0 ? [...orders].reverse().map((order) => {
                            const isPending = order.status === 'pending';
                            const orderAge = new Date().getTime() - new Date(order.createdAt).getTime();
                            const isExpired = order.status === 'expired' || (isPending && orderAge > 60 * 60 * 1000);
                            
                            // If it's effectively expired but DB hasn't synced yet, treat it as expired for UI
                            const displayStatus = isExpired ? 'expired' : order.status;

                            return (
                                <div key={order.id} className="telegram-bubble flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                            <CreditCard className="w-5 h-5 text-zinc-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">Order #{order.id}</p>
                                            <p className="text-[10px] text-zinc-400 uppercase font-black">{format(new Date(order.createdAt), 'PPpp')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8">
                                        <div className="text-left md:text-right">
                                            <p className="font-black mb-1">${order.price.toFixed(2)}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-black ${
                                                displayStatus === 'completed' ? 'bg-green-100 text-green-700' : 
                                                displayStatus === 'expired' || displayStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {displayStatus}
                                            </span>
                                        </div>
                                        {displayStatus === 'pending' && order.paymentUrl && (
                                            <a 
                                                href={order.paymentUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="telegram-btn !py-2 !px-4 text-xs shrink-0 flex items-center gap-2"
                                            >
                                                <ExternalLink className="w-3 h-3" /> View / Pay
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="py-20 text-center text-zinc-500 italic">
                                No order history found.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
