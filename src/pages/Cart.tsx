import { motion } from 'framer-motion';
import { ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';

export default function Cart() {
    const { cart, removeFromCart, cartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleCheckout = () => {
        if (!user) {
            navigate('/auth');
            return;
        }
        navigate('/checkout');
    };

    if (cart.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-center"
            >
                <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                    <ShoppingCart className="w-10 h-10 text-zinc-400" />
                </div>
                <h1 className="text-3xl font-black mb-4">Your Cart is Empty</h1>
                <p className="text-zinc-500 mb-8 max-w-md">Looks like you haven't added any products to your cart yet. Explore our catalog to find premium digital assets.</p>
                <Link to="/shop" className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold hover:scale-105 transition-transform">
                    Explore Catalog
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto px-4 py-12"
        >
            <h1 className="text-3xl md:text-4xl font-black mb-8">Your Cart</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {cart.map(item => (
                        <div key={item.id} className="flex gap-4 p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl items-center relative group">
                            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {item.images && item.images.length > 0 ? (
                                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <ShoppingCart className="w-8 h-8 text-zinc-400 opacity-50" />
                                )}
                            </div>
                            <div className="flex-grow">
                                <span className="text-[10px] uppercase font-bold text-zinc-400">{item.category}</span>
                                <h3 className="font-bold text-sm md:text-base leading-tight mb-1">{item.name}</h3>
                                <div className="text-sm font-black">${item.price}</div>
                            </div>
                            <button 
                                onClick={() => removeFromCart(item.id)}
                                className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
                
                <div>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sticky top-28">
                        <h3 className="font-bold text-lg mb-6">Order Summary</h3>
                        <div className="space-y-3 mb-6 text-sm">
                            <div className="flex justify-between text-zinc-500">
                                <span>Subtotal ({cart.length} items)</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-zinc-500">
                                <span>Estimated Tax</span>
                                <span>$0.00</span>
                            </div>
                            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between font-black text-lg">
                                <span>Total</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <button 
                            onClick={handleCheckout}
                            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                        >
                            Proceed to Checkout <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}