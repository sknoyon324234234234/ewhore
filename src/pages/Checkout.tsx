import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, ShieldCheck, Zap, CreditCard, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';

export default function Checkout() {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const { cart, cartTotal, clearCart } = useCart();
    const [purchasing, setPurchasing] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/auth');
        }
    }, [user, navigate]);

    if (!user) return null;

    if (cart.length === 0 && !purchaseSuccess) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] px-4 text-center">
                <h1 className="text-3xl font-bold mb-4">Checkout Unavailable</h1>
                <p className="text-zinc-500 mb-8">Your cart is empty.</p>
                <button onClick={() => navigate('/shop')} className="telegram-btn">Return to Shop</button>
            </div>
        );
    }

    const finalTotal = cartTotal;

    const handlePurchase = async () => {
        if (!user) {
            await login("sknoyon.a2core@gmail.com", "Guest User");
            return;
        }

        setPurchasing(true);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: user.id, 
                    items: cart.map(p => p.id)
                })
            });
            const data = await res.json();
            if (data.success && data.invoice_url) {
                clearCart();
                window.location.href = data.invoice_url;
            } else {
                alert(data.error || "Failed to initiate payment");
                setPurchasing(false);
            }
        } catch (error) {
            console.error("Purchase failed", error);
            alert("Payment initiation failed. Please try again.");
            setPurchasing(false);
        }
    };

    if (purchaseSuccess) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl mx-auto px-4 py-24 text-center"
            >
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-4xl font-black mb-4">Payment Successful!</h1>
                <p className="text-zinc-500 text-lg mb-8">Your order has been processed securely. Redirecting to your inventory...</p>
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mx-auto" />
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto px-4 py-12"
        >
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors mb-8">
                <ArrowLeft className="w-4 h-4" /> Back to Cart
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-2xl font-black mb-6">Order Summary</h2>
                    <div className="space-y-4 mb-8">
                        {cart.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                                <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden flex items-center justify-center">
                                        {item.images && item.images.length > 0 ? (
                                            <img src={item.images[0]} className="w-full h-full object-cover" />
                                        ) : (
                                            <ShoppingCart className="w-6 h-6 text-zinc-400 opacity-50" />
                                        )}
                                    </div>
                                <div className="flex-grow">
                                    <h4 className="font-bold text-sm">{item.name}</h4>
                                    <span className="text-xs text-zinc-500 uppercase">{item.category}</span>
                                </div>
                                <div className="font-bold">${item.price}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 sticky top-28">
                        <h3 className="font-bold text-xl mb-6">Payment Details</h3>
                        
                        <div className="space-y-4 mb-8 text-sm">
                            <div className="flex justify-between text-zinc-500">
                                <span>Subtotal</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-zinc-500">
                                <span>Network Fee (Estimated)</span>
                                <span>$0.00</span>
                            </div>
                            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between font-black text-2xl">
                                <span>Total to Pay</span>
                                <span>${finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handlePurchase}
                            disabled={purchasing}
                            className="w-full py-5 rounded-2xl bg-[#000] dark:bg-white text-white dark:text-black font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 relative overflow-hidden group"
                        >
                            {purchasing ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <CreditCard className="w-6 h-6" /> Pay with Crypto
                                </>
                            )}
                            <div className="absolute inset-0 bg-white/20 dark:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <p className="text-center text-xs text-zinc-400 mt-4 font-medium">Secured by NowPayments</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}