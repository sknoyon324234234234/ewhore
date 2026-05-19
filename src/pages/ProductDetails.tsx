import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Loader2, CheckCircle2, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { Product } from '../types';
import { socket } from '../App';

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart, cart } = useCart();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showAddedToast, setShowAddedToast] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        const url = user ? `/api/products?userId=${user.id}` : '/api/products';
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const p = data.find((prod: any) => String(prod.id) === String(id));
                setProduct(p || null);
                setLoading(false);
            });
    }, [id, user]);

    useEffect(() => {
        socket.on('inventory_update', ({ productId, inventoryCount }) => {
            if (String(productId) === String(id)) {
                setProduct(prev => prev ? { ...prev, inventoryCount } : null);
            }
        });

        return () => {
            socket.off('inventory_update');
        };
    }, [id]);

    const handleAddToCart = () => {
        if (!user) {
            navigate('/auth');
            return;
        }
        if (product) {
            addToCart(product);
            setShowAddedToast(true);
            setTimeout(() => setShowAddedToast(false), 2000);
        }
    };

    const handleBuyNow = () => {
        if (!user) {
            navigate('/auth');
            return;
        }
        if (product) {
            addToCart(product);
            navigate('/checkout');
        }
    };

    const handleNextImage = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (product?.images) {
            setActiveImageIndex((prev) => (prev + 1) % product.images.length);
        }
    };

    const handlePrevImage = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (product?.images) {
            setActiveImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[70vh]">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
    );

    if (!product) return (
        <div className="flex flex-col items-center justify-center h-[70vh] px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
            <p className="text-zinc-500 mb-8">The product you are looking for does not exist or has been removed.</p>
            <button onClick={() => navigate('/')} className="telegram-btn">Return to Shop</button>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-6xl mx-auto px-4 py-12"
        >
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors mb-8">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
                <div className="flex flex-col gap-4">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="aspect-[3/4] rounded-3xl overflow-hidden bg-transparent relative group max-w-md mx-auto w-full"
                    >
                        <AnimatePresence mode="wait">
                            {product.images && product.images.length > 0 ? (
                                <motion.img 
                                    key={activeImageIndex}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    src={product.images[activeImageIndex]} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover absolute inset-0 cursor-zoom-in rounded-3xl" 
                                    onClick={() => setIsZoomed(true)}
                                />
                            ) : (
                                <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
                                    <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                                    <span className="text-sm font-bold uppercase tracking-widest opacity-50">No Image Available</span>
                                </div>
                            )}
                        </AnimatePresence>
                        {product.images && product.images.length > 0 && (
                            <button 
                                onClick={() => setIsZoomed(true)}
                                className="absolute top-4 right-4 w-10 h-10 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg"
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>
                        )}
                    </motion.div>
                    
                    {/* Thumbnail Gallery */}
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 no-scrollbar max-w-md mx-auto w-full justify-center">
                            {product.images.map((img, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeImageIndex === idx ? 'border-black dark:border-white scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col justify-center">
                    <div className="mb-6 flex items-center justify-between">
                         <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 text-xs font-bold uppercase tracking-widest rounded-full">{product.category}</span>
                         <span className="text-sm text-zinc-500 font-medium">{product.inventoryCount} items available</span>
                    </div>
                    
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mb-4">{product.name}</h1>
                    <p className="text-lg text-zinc-500 mb-8 leading-relaxed">
                        {product.description}
                    </p>

                    <div className="telegram-bubble mb-8 flex items-center justify-between relative overflow-hidden">
                        <div>
                            <span className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">Price</span>
                            <span className="text-3xl font-black">
                                <span className="flex items-center gap-2">
                                    ${product.price}
                                    {(product as any).isVipDiscount && (
                                        <span className="text-[10px] bg-yellow-400 text-black px-2 py-0.5 rounded-full font-black animate-pulse">VIP PRICE</span>
                                    )}
                                </span>
                            </span>
                        </div>
                        <div className="text-right">
                             <span className="block text-[10px] uppercase tracking-wider text-green-500 font-bold mb-1">Status</span>
                             <span className="text-sm font-semibold">Ready for Delivery</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={handleAddToCart}
                            disabled={product.inventoryCount <= 0 || cart.some(p => p.id === product.id)}
                            className="flex-1 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white font-bold text-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            {cart.some(p => p.id === product.id) ? 'Added to Cart' : 'Add to Cart'}
                        </button>
                        
                        <button 
                            onClick={handleBuyNow}
                            disabled={product.inventoryCount <= 0}
                            className="flex-1 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {product.inventoryCount <= 0 ? 'Out of Stock' : 'Buy Now'}
                        </button>
                    </div>
                    
                    <p className="text-center text-[10px] text-zinc-400 mt-6 uppercase tracking-widest font-bold">Secure checkout powered by decentralized gateways</p>
                </div>
            </div>

            {/* Success Toast */}
            <AnimatePresence>
                {showAddedToast && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 z-50"
                    >
                        <CheckCircle2 className="w-5 h-5 text-green-500" /> Added to Cart!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fullscreen Zoom Modal */}
            <AnimatePresence>
                {isZoomed && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsZoomed(false)}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                    >
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}
                            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-50"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {product.images && product.images.length > 1 && (
                            <>
                                <button 
                                    onClick={handlePrevImage}
                                    className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-50 backdrop-blur-sm"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                <button 
                                    onClick={handleNextImage}
                                    className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-50 backdrop-blur-sm"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </>
                        )}

                        <AnimatePresence mode="wait">
                            <motion.img 
                                key={activeImageIndex}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                src={product.images?.[activeImageIndex]} 
                                alt={product.name} 
                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl cursor-default select-none"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </AnimatePresence>
                        
                        {product.images && product.images.length > 1 && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                                {product.images.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`h-1.5 rounded-full transition-all duration-300 ${activeImageIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
