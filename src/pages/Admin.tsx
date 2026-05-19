import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Product, User, Order } from '../types';
import { socket } from '../App';
import { 
    LayoutDashboard, Users, ShoppingCart, Package, Plus, Search, 
    Edit, Trash2, TrendingUp, DollarSign, Loader2, Save, X, ExternalLink, Tags, ChevronDown, Upload, Image as ImageIcon, Settings, Download, UploadCloud
} from 'lucide-react';

export default function Admin() {
    const { isAdmin } = useAuth();
    const location = useLocation();
    
    const hashToView = (hash: string) => {
        const view = hash.replace('#', '');
        return ['stats', 'products', 'users', 'orders', 'categories', 'settings'].includes(view) ? view : 'stats';
    };

    const [products, setProducts] = useState<Product[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0 });
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<'stats' | 'products' | 'users' | 'orders' | 'categories' | 'settings'>(hashToView(location.hash) as any);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [newCategory, setNewCategory] = useState('');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setActiveView(hashToView(location.hash) as any);
    }, [location.hash]);

    useEffect(() => {
        if (!isAdmin) return;
        setLoading(true);
        Promise.all([
            fetch('/api/products').then(res => res.json()),
            fetch('/api/admin/users').then(res => res.json()),
            fetch('/api/orders').then(res => res.json()),
            fetch('/api/admin/stats').then(res => res.json()),
            fetch('/api/categories').then(res => res.json())
        ]).then(([p, u, o, s, c]) => {
            setProducts(p);
            setUsers(u);
            setOrders(o);
            setStats(s);
            setCategories(c);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load admin data:", err);
            setLoading(false);
        });
    }, [isAdmin]);

    useEffect(() => {
        if (!isAdmin) return;
        
        socket.on('new_order', () => {
            fetch('/api/orders').then(res => res.json()).then(setOrders);
            fetch('/api/admin/stats').then(res => res.json()).then(setStats);
        });

        socket.on('inventory_update', ({ productId, inventoryCount }) => {
            setProducts(prev => prev.map(p => 
                String(p.id) === String(productId) ? { ...p, inventoryCount } : p
            ));
        });

        return () => {
            socket.off('new_order');
            socket.off('inventory_update');
        };
    }, [isAdmin]);

    if (!isAdmin) return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
             <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
             <p className="text-zinc-500">Only administrators can access this dashboard.</p>
        </div>
    );

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        
        const method = editingProduct.id ? 'PUT' : 'POST';
        const url = editingProduct.id ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
        
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingProduct)
        });
        
        if (res.ok) {
            // Refresh
            const p = await fetch('/api/products').then(r => r.json());
            setProducts(p);
            setEditingProduct(null);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        const res = await fetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: newCategory.trim() })
        });
        if (res.ok) {
            const data = await res.json();
            setCategories(data.categories);
            setNewCategory('');
        }
    };

    const handleDeleteCategory = async (cat: string) => {
        if (!confirm(`Are you sure you want to delete the category "${cat}"?`)) return;
        const res = await fetch(`/api/admin/categories/${encodeURIComponent(cat)}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            const data = await res.json();
            setCategories(data.categories);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm(`Are you sure you want to delete this product?`)) return;
        const res = await fetch(`/api/admin/products/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            const p = await fetch('/api/products').then(r => r.json());
            setProducts(p);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !editingProduct) return;
        
        const files = Array.from(e.target.files);
        const promises = files.map(file => {
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    resolve(ev.target?.result as string);
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(promises).then(base64Images => {
            setEditingProduct({
                ...editingProduct,
                images: [...(editingProduct.images || []), ...base64Images]
            });
        });
    };

    const removeImage = (indexToRemove: number) => {
        if (!editingProduct || !editingProduct.images) return;
        setEditingProduct({
            ...editingProduct,
            images: editingProduct.images.filter((_, idx) => idx !== indexToRemove)
        });
    };

    const handleExportDatabase = async () => {
        try {
            const response = await fetch('/api/admin/database/export');
            if (!response.ok) throw new Error('Failed to export');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ewhore_backup_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            alert('Failed to export database');
        }
    };

    const handleImportDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!window.confirm('Are you sure? This will overwrite all existing users, products, images, categories, and orders!')) {
            e.target.value = '';
            return;
        }

        try {
            const formData = new FormData();
            // We just send the raw zip file as the body since express.raw parses it
            const response = await fetch('/api/admin/database/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/zip'
                },
                body: file
            });
            
            if (response.ok) {
                alert('Database and images imported successfully! Page will refresh.');
                window.location.reload();
            } else {
                const data = await response.json().catch(() => ({}));
                alert(data.error || 'Failed to import database');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to import backup');
        }
        e.target.value = '';
    };

    const last7Days = Array.from({length: 7}).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
            dateStr: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('en-US', { weekday: 'short' })
        };
    });

    const salesData = last7Days.map(day => {
        const total = orders
            .filter(o => o.createdAt && o.createdAt.startsWith(day.dateStr) && o.status === 'completed')
            .reduce((sum, o) => sum + (o.price || 0), 0);
        return { ...day, total };
    });
    
    const maxSale = Math.max(...salesData.map(d => d.total), 1);
    const recentOrders = [...orders].filter(o => o.status === 'completed').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto px-4 py-4 md:py-8 mb-20 md:mb-0"
        >
            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                {/* Main Content */}
                <div className="flex-grow overflow-hidden w-full">
                    <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-8 tracking-tighter uppercase px-2 md:px-4 underline decoration-4 decoration-zinc-100 underline-offset-8">Admin Center</h2>
                    {loading ? (
                        <div className="flex items-center justify-center h-full min-h-[50vh]">
                            <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {activeView === 'stats' && (
                                <motion.div 
                                    key="stats"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                                >
                                    <motion.div whileHover={{ y: -5 }} className="telegram-bubble p-6 md:p-8 flex items-center justify-between shadow-sm hover:shadow-xl transition-all border border-zinc-200/50 dark:border-zinc-800/50">
                                        <div>
                                            <p className="text-[10px] md:text-xs uppercase font-black text-zinc-400 mb-1 md:mb-2">Total Revenue</p>
                                            <h3 className="text-2xl md:text-4xl font-black tracking-tighter">${stats.totalRevenue.toFixed(2)}</h3>
                                        </div>
                                        <div className="bg-green-100 dark:bg-green-900/30 p-3 md:p-4 rounded-2xl relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-green-500/10 scale-0 group-hover:scale-150 transition-transform duration-500 rounded-full" />
                                            <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-600 relative z-10" />
                                        </div>
                                    </motion.div>
                                    <motion.div whileHover={{ y: -5 }} className="telegram-bubble p-6 md:p-8 flex items-center justify-between shadow-sm hover:shadow-xl transition-all border border-zinc-200/50 dark:border-zinc-800/50">
                                        <div>
                                            <p className="text-[10px] md:text-xs uppercase font-black text-zinc-400 mb-1 md:mb-2">Total Orders</p>
                                            <h3 className="text-2xl md:text-4xl font-black tracking-tighter">{stats.totalOrders}</h3>
                                        </div>
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 md:p-4 rounded-2xl relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-blue-500/10 scale-0 group-hover:scale-150 transition-transform duration-500 rounded-full" />
                                            <ShoppingCart className="w-6 h-6 md:w-8 md:h-8 text-blue-600 relative z-10" />
                                        </div>
                                    </motion.div>
                                    <motion.div whileHover={{ y: -5 }} className="telegram-bubble p-6 md:p-8 flex items-center justify-between shadow-sm hover:shadow-xl transition-all border border-zinc-200/50 dark:border-zinc-800/50">
                                        <div>
                                            <p className="text-[10px] md:text-xs uppercase font-black text-zinc-400 mb-1 md:mb-2">Total Users</p>
                                            <h3 className="text-2xl md:text-4xl font-black tracking-tighter">{users.length}</h3>
                                        </div>
                                        <div className="bg-zinc-100 dark:bg-zinc-800 p-3 md:p-4 rounded-2xl relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-zinc-500/10 scale-0 group-hover:scale-150 transition-transform duration-500 rounded-full" />
                                            <Users className="w-6 h-6 md:w-8 md:h-8 text-black dark:text-white relative z-10" />
                                        </div>
                                    </motion.div>
                                    
                                    <div className="col-span-1 lg:col-span-2 telegram-bubble mt-4 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                                         <h4 className="font-bold p-4 md:p-6 mb-2 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900"><TrendingUp className="w-4 h-4 text-green-500"/> Real-time Sales (Last 7 Days)</h4>
                                         <div className="h-64 flex items-end gap-2 md:gap-4 px-4 md:px-6 pb-6 pt-4">
                                             {salesData.map((data, i) => {
                                                 const heightPercent = maxSale > 0 ? (data.total / maxSale) * 100 : 0;
                                                 return (
                                                     <div key={i} className="flex-grow flex flex-col items-center gap-2 group">
                                                         <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-t-lg relative transition-all hover:bg-black dark:hover:bg-white overflow-hidden flex flex-col justify-end" style={{ height: '100%' }}>
                                                             <motion.div 
                                                                 initial={{ height: 0 }}
                                                                 animate={{ height: `${heightPercent}%` }}
                                                                 transition={{ duration: 1, type: 'spring', delay: i * 0.1 }}
                                                                 className="w-full bg-black dark:bg-white rounded-t-sm group-hover:bg-green-500 transition-colors"
                                                             />
                                                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                                 ${data.total.toFixed(2)}
                                                             </div>
                                                         </div>
                                                         <span className="text-[10px] font-bold text-zinc-400">{data.label}</span>
                                                     </div>
                                                 );
                                             })}
                                         </div>
                                    </div>

                                    <div className="col-span-1 telegram-bubble mt-4 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col">
                                        <h4 className="font-bold p-4 md:p-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900">
                                            <div className="flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-blue-500"/> Live Feed</div>
                                            <span className="relative flex h-2 w-2">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                        </h4>
                                        <div className="p-4 flex-grow flex flex-col gap-3 overflow-hidden relative">
                                            {recentOrders.length === 0 ? (
                                                <div className="flex-grow flex items-center justify-center text-xs text-zinc-500 italic">No recent sales</div>
                                            ) : (
                                                <AnimatePresence>
                                                    {recentOrders.map((o, i) => (
                                                        <motion.div 
                                                            key={o.id}
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.1 }}
                                                            className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800"
                                                        >
                                                            <div>
                                                                <p className="text-xs font-bold truncate max-w-[120px]">Order #{o.id}</p>
                                                                <p className="text-[10px] text-zinc-400">{new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-black text-green-600">+${o.price}</p>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeView === 'products' && (
                                <motion.div 
                                    key="products"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4 md:space-y-6"
                                >
                                    <div className="flex justify-between items-center mb-4 md:mb-8">
                                        <h3 className="text-xl md:text-2xl font-bold">Manage Products</h3>
                                        <button 
                                            onClick={() => setEditingProduct({ name: '', price: 0, description: '', images: [], accessLink: '', category: categories[0] || 'Course', inventoryCount: 100 })}
                                            className="telegram-btn flex items-center gap-2 text-xs md:text-base py-2 md:py-3 px-3 md:px-6"
                                        >
                                            <Plus className="w-3 h-3 md:w-4 md:h-4" /> Add New
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                                        {products.map(p => (
                                            <div key={p.id} className="telegram-bubble flex items-center gap-3 md:gap-6 p-3 md:p-4">
                                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                    {p.images && p.images.length > 0 ? (
                                                        <img src={p.images[0]} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-4 h-4 md:w-6 md:h-6 text-zinc-400 opacity-50" />
                                                    )}
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h4 className="font-bold text-sm md:text-base truncate">{p.name}</h4>
                                                    <p className="text-[10px] md:text-xs text-zinc-500 truncate mb-1">{p.description}</p>
                                                    <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 md:px-2 md:py-1 rounded">{p.category}</span>
                                                </div>
                                                <div className="text-right px-2 md:px-4 shrink-0">
                                                    <p className="font-black text-sm md:text-base">${p.price}</p>
                                                    <p className="text-[8px] md:text-[10px] text-zinc-400 uppercase font-bold">{p.inventoryCount} stock</p>
                                                </div>
                                                <div className="flex flex-col md:flex-row gap-1 md:gap-2 shrink-0">
                                                    <button onClick={() => setEditingProduct(p)} className="p-1.5 md:p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg"><Edit className="w-3 h-3 md:w-4 md:h-4" /></button>
                                                    <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 md:p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg"><Trash2 className="w-3 h-3 md:w-4 md:h-4" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeView === 'categories' && (
                                <motion.div 
                                    key="categories"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4 md:space-y-6"
                                >
                                    <div className="flex justify-between items-center mb-4 md:mb-8">
                                        <h3 className="text-xl md:text-2xl font-bold">Manage Categories</h3>
                                    </div>

                                    <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row gap-2 md:gap-4 mb-4 md:mb-8">
                                        <input
                                            type="text"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            placeholder="New Category Name"
                                            className="flex-grow bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm md:text-base focus:ring-2 ring-zinc-200 dark:ring-zinc-700"
                                            required
                                        />
                                        <button type="submit" className="telegram-btn flex items-center justify-center gap-2 py-3">
                                            <Plus className="w-4 h-4" /> Add Category
                                        </button>
                                    </form>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                        {categories.map((cat, i) => (
                                            <div key={i} className="telegram-bubble p-3 md:p-4 flex items-center justify-between group hover:border-black dark:hover:border-white transition-colors">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <Tags className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                                    <span className="font-bold text-sm md:text-base">{cat}</span>
                                                </div>
                                                <button onClick={() => handleDeleteCategory(cat)} className="p-1.5 md:p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg transition-colors">
                                                    <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeView === 'users' && (
                                <div className="space-y-3 md:space-y-4">
                                    {users.map((u: any) => (
                                        <div key={u.id} className="telegram-bubble flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 group hover:border-black dark:hover:border-white transition-colors">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center font-black text-base md:text-lg border border-zinc-200 dark:border-zinc-800">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm md:text-base">{u.name}</p>
                                                    <p className="text-[10px] md:text-xs text-zinc-500">{u.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between w-full sm:w-auto gap-4 md:gap-8 border-t border-zinc-100 dark:border-zinc-800 sm:border-0 pt-2 sm:pt-0">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[8px] md:text-[10px] uppercase font-black text-zinc-400">Total Spent</p>
                                                    <p className="font-black text-green-600 text-sm md:text-base">${u.spent?.toFixed(2) || '0.00'}</p>
                                                </div>
                                                <div className="text-right hidden md:block">
                                                    <p className="text-[8px] md:text-[10px] uppercase font-black text-zinc-400">Points</p>
                                                    <p className="font-bold text-sm md:text-base">{u.loyaltyPoints}</p>
                                                </div>
                                                <span className={`text-[8px] md:text-[10px] px-2 py-1 rounded uppercase font-black ${u.role === 'admin' ? 'bg-black text-white dark:bg-white dark:text-black' : (u.spent > 100 ? 'bg-yellow-400 text-black' : 'bg-zinc-100 dark:bg-zinc-900')}`}>
                                                    {u.role === 'admin' ? 'Admin' : (u.spent > 100 ? 'VIP USER' : 'Retail')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeView === 'orders' && (
                                <div className="space-y-3 md:space-y-4">
                                    {orders.reverse().map(o => (
                                        <div key={o.id} className="telegram-bubble flex items-center justify-between p-3 md:p-4">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] md:text-[10px] text-zinc-400 uppercase font-black">Order #{o.id}</span>
                                                <span className="font-bold text-sm md:text-base">${o.price}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                 <span className="text-[8px] md:text-[10px] text-zinc-400 uppercase font-black">User ID</span>
                                                 <span className="text-[10px] md:text-xs font-mono">{o.userId}</span>
                                            </div>
                                            <span className={`text-[8px] md:text-[10px] px-2 py-1 rounded uppercase font-black bg-green-100 text-green-700`}>
                                                {o.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {activeView === 'settings' && (
                                <motion.div 
                                    key="settings"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="telegram-bubble p-6 md:p-8 border border-zinc-200/50 dark:border-zinc-800/50">
                                        <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Settings className="w-5 h-5"/> Database Management</h3>
                                        <p className="text-sm text-zinc-500 mb-6">Export or import the entire store database, including all users, products, categories, and orders. Use this for backups or migrating data.</p>
                                        
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <button 
                                                onClick={handleExportDatabase}
                                                className="flex-1 telegram-btn !py-4 flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black"
                                            >
                                                <Download className="w-5 h-5" /> Export Database
                                            </button>
                                            
                                            <label className="flex-1 telegram-btn !py-4 flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                                <UploadCloud className="w-5 h-5" /> Import Data
                                                <input 
                                                    type="file" 
                                                    accept=".zip" 
                                                    className="hidden" 
                                                    onChange={handleImportDatabase}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 md:p-8 max-w-2xl w-full max-h-[95vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-4 md:mb-8 sticky top-0 bg-white dark:bg-black z-10 py-2">
                                <h3 className="text-lg md:text-2xl font-black uppercase tracking-tighter">{editingProduct.id ? 'Edit Product' : 'Add New Product'}</h3>
                                <button onClick={() => setEditingProduct(null)} className="bg-zinc-100 dark:bg-zinc-900 p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
                            </div>
                            <form onSubmit={handleSaveProduct} className="space-y-3 md:space-y-4">
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[10px] md:text-xs uppercase font-black text-zinc-400 mb-1 block">Product Name</label>
                                        <input 
                                            value={editingProduct.name} 
                                            onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 md:p-3 text-sm md:text-base focus:ring-2 ring-zinc-200 dark:ring-zinc-700" 
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] md:text-xs uppercase font-black text-zinc-400 mb-1 block">Price ($)</label>
                                        <input 
                                            type="number" step="0.01"
                                            value={editingProduct.price} 
                                            onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 md:p-3 text-sm md:text-base" 
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] md:text-xs uppercase font-black text-zinc-400 mb-1 block">Stock</label>
                                        <input 
                                            type="number"
                                            value={editingProduct.inventoryCount} 
                                            onChange={e => setEditingProduct({...editingProduct, inventoryCount: parseInt(e.target.value)})}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 md:p-3 text-sm md:text-base" 
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] md:text-xs uppercase font-black text-zinc-400 mb-2 block">Product Images</label>
                                        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 md:p-4">
                                            <div className="flex flex-wrap gap-3 md:gap-4 mb-3 md:mb-4">
                                                {editingProduct.images?.map((img, idx) => (
                                                    <div key={idx} className="relative group w-16 h-16 md:w-24 md:h-24 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                                        <img src={img} className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeImage(idx)}
                                                            className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-4 h-4 md:w-6 md:h-6" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-16 h-16 md:w-24 md:h-24 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-colors"
                                                >
                                                    <Upload className="w-4 h-4 md:w-6 md:h-6 mb-1" />
                                                    <span className="text-[8px] md:text-[10px] font-bold uppercase">Upload</span>
                                                </button>
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef}
                                                    onChange={handleImageUpload}
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                />
                                            </div>
                                            <p className="text-[8px] md:text-[10px] text-zinc-500 font-medium">Upload one or multiple images. The first image will be used as the thumbnail.</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2 relative">
                                        <label className="text-[10px] md:text-xs uppercase font-black text-zinc-400 mb-1 block">Category</label>
                                        <div 
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 md:p-3 text-sm md:text-base cursor-pointer flex justify-between items-center"
                                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                        >
                                            <span className="font-bold">{editingProduct.category || 'Select a category'}</span>
                                            <ChevronDown className={`w-4 h-4 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                        <AnimatePresence>
                                            {isCategoryDropdownOpen && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto"
                                                >
                                                    {categories.map(c => (
                                                        <div 
                                                            key={c} 
                                                            className="p-2.5 md:p-3 text-sm md:text-base hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer font-medium transition-colors"
                                                            onClick={() => {
                                                                setEditingProduct({...editingProduct, category: c});
                                                                setIsCategoryDropdownOpen(false);
                                                            }}
                                                        >
                                                            {c}
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] md:text-xs uppercase font-black text-zinc-400 mb-1 block">Access Link (The Product)</label>
                                        <input 
                                            value={editingProduct.accessLink} 
                                            onChange={e => setEditingProduct({...editingProduct, accessLink: e.target.value})}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 md:p-3 text-sm md:text-base" 
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] md:text-xs uppercase font-black text-zinc-400 mb-1 block">Description</label>
                                        <textarea 
                                            value={editingProduct.description} 
                                            onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 md:p-3 text-sm md:text-base min-h-[80px] md:min-h-[100px]" 
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="mt-6 md:mt-8 flex justify-end">
                                    <button type="submit" className="telegram-btn flex items-center gap-2 w-full md:w-auto justify-center text-sm md:text-base py-3 md:py-4 px-6 md:px-8">
                                        <Save className="w-4 h-4 md:w-5 md:h-5" /> {editingProduct.id ? 'Save Changes' : 'Create Product'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
