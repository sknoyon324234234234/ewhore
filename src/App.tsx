import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { CartProvider, useCart } from './CartContext';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Auth from './pages/Auth';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Legal from './pages/Legal';
import { Home as HomeIcon, User as UserIcon, ShoppingBag, ShoppingCart as CartIcon, LayoutDashboard, Menu, X, LogIn, LogOut, Settings, History, Package, Tags, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { io } from 'socket.io-client';

export const socket = io();

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              <img src="/web-app-manifest-512x512.png" alt="Logo" className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300" />
            </div>
            <span className="font-black text-xl tracking-tight hidden sm:block">Ewhore Shop</span>
          </Link>

          <div className="flex items-center gap-4">
            {!user ? (
              <Link 
                to="/auth"
                onClick={() => setIsOpen(false)}
                className="telegram-btn !py-2 !px-4 text-sm flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Login
              </Link>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setIsOpen(!isOpen)} 
                  className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg hover:scale-105 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-black"
                >
                  <span className="font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                      >
                        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                          <p className="text-sm font-bold truncate">{user.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                        </div>
                        
                        <div className="p-2 flex flex-col gap-1">
                          <Link to="/profile#inventory" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <ShoppingBag className="w-4 h-4 text-zinc-500" /> Inventory
                          </Link>
                          <Link to="/profile#history" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <History className="w-4 h-4 text-zinc-500" /> Order History
                          </Link>
                          <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <Settings className="w-4 h-4 text-zinc-500" /> Settings
                          </Link>
                          {isAdmin && (
                            <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-900 dark:text-zinc-100">
                              <LayoutDashboard className="w-4 h-4" /> Admin Panel
                            </Link>
                          )}
                        </div>
                        
                        <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
                          <button onClick={() => { logout(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function FloatingNav() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const { cart } = useCart();

  const isAdminRoute = location.pathname === '/admin';

  let navItems = [];

  if (isAdminRoute && isAdmin) {
    navItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin#stats' },
      { icon: Package, label: 'Products', path: '/admin#products' },
      { icon: Tags, label: 'Categories', path: '/admin#categories' },
      { icon: Users, label: 'Users', path: '/admin#users' },
      { icon: CartIcon, label: 'Orders', path: '/admin#orders' },
      { icon: Settings, label: 'Settings', path: '/admin#settings' },
      { icon: HomeIcon, label: 'Home', path: '/' }
    ];
  } else {
    navItems = [
      { icon: HomeIcon, label: 'Home', path: '/' },
      { icon: ShoppingBag, label: 'Shop', path: '/shop' },
      { icon: CartIcon, label: 'Cart', path: '/cart' },
      { icon: History, label: 'Orders', path: '/profile#history' },
      { icon: UserIcon, label: 'Inventory', path: '/profile#inventory' },
    ];
    if (isAdmin) {
      navItems.push({ icon: LayoutDashboard, label: 'Admin', path: '/admin' });
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-6 md:-translate-x-0 z-50 w-full max-w-[90vw] md:max-w-fit pointer-events-none">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, x: -30, scale: 0.9 },
          visible: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 25,
              staggerChildren: 0.15,
              delayChildren: 0.1
            }
          }
        }}
        className="bg-white/70 dark:bg-black/70 md:bg-transparent md:dark:bg-transparent backdrop-blur-2xl md:backdrop-blur-none border border-zinc-200/50 dark:border-zinc-800/50 md:border-transparent md:dark:border-transparent rounded-full md:rounded-[2rem] p-1.5 md:p-0 flex flex-row md:flex-col justify-between items-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] md:shadow-none md:dark:shadow-none pointer-events-auto overflow-x-auto md:overflow-visible no-scrollbar gap-1 md:gap-4"
      >
        {navItems.map((item, index) => {
          // Check active state using location.pathname and location.hash/state if needed
          let isActive = false;
          if (item.path === '/') isActive = location.pathname === '/';
          else if (item.path === '/shop') isActive = location.pathname === '/shop';
          else if (item.path === '/cart') isActive = location.pathname === '/cart';
          else if (item.path === '/admin') isActive = location.pathname === '/admin' && !location.hash;
          else if (item.path === '/profile#history') isActive = location.pathname === '/profile' && location.hash === '#history';
          else if (item.path === '/profile#inventory') isActive = location.pathname === '/profile' && (location.hash === '#inventory' || !location.hash);
          else if (item.path === '/admin#stats') isActive = location.pathname === '/admin' && (location.hash === '#stats' || !location.hash);
          else if (item.path === '/admin#products') isActive = location.pathname === '/admin' && location.hash === '#products';
          else if (item.path === '/admin#categories') isActive = location.pathname === '/admin' && location.hash === '#categories';
          else if (item.path === '/admin#users') isActive = location.pathname === '/admin' && location.hash === '#users';
          else if (item.path === '/admin#orders') isActive = location.pathname === '/admin' && location.hash === '#orders';
          else if (item.path === '/admin#settings') isActive = location.pathname === '/admin' && location.hash === '#settings';

          return (
            <motion.div
              key={item.label}
              variants={{
                hidden: { opacity: 0, x: -30, y: 20, scale: 0.6, rotate: -15 },
                visible: { 
                  opacity: 1, 
                  x: 0, 
                  y: 0,
                  scale: 1, 
                  rotate: 0,
                  transition: { type: "spring", stiffness: 400, damping: 15, mass: 0.8 }
                }
              }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              className={cn("flex-shrink-0", isActive ? "flex-2" : "flex-1")}
            >
              <Link 
                to={item.path}
                className={cn(
                  "relative flex items-center justify-center gap-1.5 px-3 md:px-0 py-2 md:py-0 rounded-full transition-all duration-500 ease-out h-10 md:h-12 w-full md:w-12",
                  isActive ? "bg-black dark:bg-white text-white dark:text-black shadow-md" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 md:bg-white/50 md:dark:bg-black/50 md:backdrop-blur-md md:shadow-sm"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <item.icon className={cn("w-4 h-4 md:w-5 md:h-5 flex-shrink-0 transition-transform duration-300", isActive && "scale-110")} />
                  {item.label === 'Cart' && cart.length > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 md:-top-2 md:-right-2 bg-red-500 text-white text-[9px] md:text-[10px] font-bold w-4 h-4 md:w-4.5 md:h-4.5 flex items-center justify-center rounded-full shadow-sm"
                    >
                      {cart.length}
                    </motion.span>
                  )}
                </div>
                {isActive && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-[10px] md:text-xs font-bold whitespace-nowrap overflow-hidden ml-1 md:hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

function Footer() {
    const location = useLocation();
    
    if (location.pathname !== '/') return null;

    return (
        <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 py-8 md:py-12 px-4 mb-24 md:mb-0">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
                <div className="col-span-1 md:col-span-2 text-center md:text-left">
                    <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Ewhore Shop</h3>
                    <p className="text-zinc-500 text-xs md:text-sm max-w-sm mx-auto md:mx-0">
                        The most secure and robust platform for your digital asset needs. Experience the future of crypto e-commerce with our Telegram-inspired design.
                    </p>
                </div>
                <div className="text-center md:text-left">
                    <h4 className="font-semibold mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-wider">Legal</h4>
                    <ul className="space-y-2 text-xs md:text-sm text-zinc-500">
                        <li><Link to="/legal/privacy" className="hover:text-black dark:hover:text-white">Privacy Policy</Link></li>
                        <li><Link to="/legal/terms" className="hover:text-black dark:hover:text-white">Terms of Service</Link></li>
                        <li><Link to="/legal/returns" className="hover:text-black dark:hover:text-white">Return Policy</Link></li>
                    </ul>
                </div>
                <div className="text-center md:text-left">
                    <h4 className="font-semibold mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-wider">Community & Support</h4>
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <a href="https://t.me/EwhoreStoreX" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-zinc-500 hover:text-[#0088cc] dark:hover:text-[#2AABEE] transition-colors">
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                            <span className="text-xs md:text-sm font-medium">Join our Telegram</span>
                        </a>
                    </div>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto mt-8 pt-6 md:mt-12 md:pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center text-[10px] md:text-xs text-zinc-400">
                &copy; {new Date().getFullYear()} Ewhore Shop. All rights reserved.
            </div>
        </footer>
    );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
            <Navbar />
            <main className="flex-grow">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/legal/:type" element={<Legal />} />
                </Routes>
              </AnimatePresence>
            </main>
            <Footer />
            <FloatingNav />
            
            {/* Real-time Order Notification Toast (Simulated) */}
            <OrderNotification />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

function OrderNotification() {
    const [latestOrder, setLatestOrder] = useState<any>(null);

    useEffect(() => {
        socket.on('new_order', (order) => {
            setLatestOrder(order);
            setTimeout(() => setLatestOrder(null), 5000);
        });
        return () => { socket.off('new_order'); };
    }, []);

    return (
        <AnimatePresence>
            {latestOrder && (
                <motion.div 
                    initial={{ x: 300, opacity: 0, scale: 0.9 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: 300, opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="fixed top-24 right-6 z-[60] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] rounded-full p-2 pr-6 flex items-center gap-4"
                >
                    <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-inner relative">
                        <div className="absolute inset-0 rounded-full bg-zinc-200/20 animate-ping opacity-75" />
                        <ShoppingBag className="w-4 h-4 relative z-10" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Just purchased</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{latestOrder?.name || "Someone just bought a product!"}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
