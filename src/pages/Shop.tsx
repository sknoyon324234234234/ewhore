import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, X } from 'lucide-react';
import type { Product } from '../types';
import { socket } from '../App';

export default function Shop() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>(['All']);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch('/api/products').then(res => res.json()),
            fetch('/api/categories').then(res => res.json())
        ]).then(([productsData, categoriesData]) => {
            setProducts(productsData);
            setCategories(['All', ...categoriesData]);
            setLoading(false);
        });
    }, []);

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

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === 'All' || p.category === category;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8 relative">
                <div className="flex-1 overflow-x-auto no-scrollbar mask-edges pr-8">
                    <div className="flex gap-2 min-w-max pb-2">
                        {categories.map(c => (
                            <button
                                key={c}
                                onClick={() => setCategory(c)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                                    category === c 
                                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md' 
                                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-end pl-4 bg-white dark:bg-black z-10">
                    <button 
                        onClick={() => setShowSearch(!showSearch)}
                        className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                    >
                        {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showSearch && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="relative max-w-xl mx-auto">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-zinc-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="block w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all text-sm shadow-inner"
                                autoFocus
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                        <div key={i} className="aspect-[3/4] w-full animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-xl md:rounded-2xl" />
                    ))}
                </div>
            ) : (
                <>
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                            <Search className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">No products found</h3>
                            <p className="text-zinc-500">Try adjusting your search or category filter.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
                            {filteredProducts.map((product, i) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
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
                                                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">No Image</span>
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
                </>
            )}
        </div>
    );
}