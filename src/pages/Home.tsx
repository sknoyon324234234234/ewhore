import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useAuth } from '../AuthContext';
import { socket } from '../App';

export default function Home() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const { user } = useAuth();

    useEffect(() => {
        const url = user ? `/api/products?userId=${user.id}` : '/api/products';
        Promise.all([
            fetch(url).then(res => res.json()),
            fetch('/api/categories').then(res => res.json())
        ]).then(([productsData, categoriesData]) => {
            setProducts(productsData);
            setCategories(categoriesData);
            setLoading(false);
        });
    }, [user]);

    useEffect(() => {
        socket.on('inventory_update', ({ productId, inventoryCount }) => {
            setProducts(prev => prev.map(p => 
                String(p.id) === String(productId) ? { ...p, inventoryCount } : p
            ));
        });

        return () => {
            socket.off('inventory_update');
        };
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-20"
        >
            {/* Hero Section */}
            <section className="relative py-6 md:py-16 flex items-center justify-center px-4 overflow-hidden bg-transparent">
                <div className="max-w-7xl mx-auto text-center relative z-10 w-full">
                    <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-4 md:mb-8 leading-[0.9]"
                    >
                        <span className="block text-black dark:text-white drop-shadow-sm">Ewhore</span>
                        <span className="block bg-gradient-to-b from-zinc-400 to-zinc-200 dark:from-zinc-500 dark:to-zinc-800 bg-clip-text text-transparent">Shop.</span>
                    </motion.h1>
                </div>
            </section>

            {/* Products Grid */}
            <section className="py-12 md:py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                                <div key={i} className="aspect-[3/4] w-full animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-xl md:rounded-2xl" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
                            {products.slice(0, 10).map((product, i) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group relative bg-transparent transition-all duration-500"
                                >
                                    <Link to={`/product/${product.id}`} className="block">
                                        <div className="aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center rounded-xl md:rounded-2xl">
                                            {product.images && product.images.length > 0 ? (
                                                <img 
                                                    src={product.images[0]} 
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                                />
                                            ) : (
                                                <div className="text-zinc-400 dark:text-zinc-600 flex flex-col items-center">
                                                    <Sparkles className="w-6 h-6 mb-1 opacity-50" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 md:p-3 bg-transparent">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-xs md:text-sm font-bold group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors line-clamp-1 flex-grow pr-1">{product.name}</h3>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm md:text-lg font-black">${product.price}</span>
                                                <span className="text-[10px] md:text-xs font-medium text-zinc-500 whitespace-nowrap">{product.inventoryCount} left</span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {!loading && (
                        <div className="mt-8 md:mt-12 text-center">
                            <Link to="/shop" className="inline-flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-black dark:text-white font-bold rounded-full transition-all hover:scale-105 active:scale-95 text-sm md:text-base">
                                View All Products <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </motion.div>
    );
}
