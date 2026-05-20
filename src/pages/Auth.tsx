import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';
import { Mail, User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

export default function Auth() {
    const { login, googleLogin: contextGoogleLogin, user, error } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await res.json();
                if (userInfo && userInfo.email) {
                    // Automatically login/signup with Google info
                    contextGoogleLogin(userInfo.email, userInfo.name || 'User', userInfo.sub || 'google-id');
                }
            } catch (err) {
                console.error('Failed to fetch Google user info', err);
            }
        },
        onError: errorResponse => console.error(errorResponse),
    });

    if (user) {
        return <Navigate to="/profile" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            try {
                await login(email, password, name || 'User', !isLogin);
            } catch (err) {
                // error is handled in context
            }
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 md:py-12">
            <div className="w-full max-w-md">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl"
                >
                    <div className="text-center mb-6 md:mb-8">
                        <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    <img src="/web-app-manifest-512x512.png" alt="Logo" className="w-full h-full object-contain rounded-2xl" />
                </div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1 md:mb-2">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-xs md:text-sm text-zinc-500">
                            {isLogin ? 'Enter your details to access your account' : 'Join Ewhore Shop today'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                        <button 
                            type="button"
                            onClick={() => googleLogin()}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-black dark:text-white rounded-xl p-3 md:p-3.5 flex items-center justify-center gap-2 md:gap-3 transition-colors mb-4 md:mb-6 font-bold shadow-sm text-sm md:text-base"
                        >
                            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                    <path fill="#4285F4" d="M -3.264,51.509 C -3.264,50.719 -3.334,49.969 -3.454,49.239 L -14.754,49.239 L -14.754,53.749 L -8.284,53.749 C -8.574,55.229 -9.424,56.479 -10.684,57.329 L -10.684,60.329 L -6.824,60.329 C -4.564,58.239 -3.264,55.159 -3.264,51.509 Z"/>
                                    <path fill="#34A853" d="M -14.754,63.239 C -11.514,63.239 -8.804,62.159 -6.824,60.329 L -10.684,57.329 C -11.764,58.049 -13.134,58.489 -14.754,58.489 C -17.884,58.489 -20.534,56.379 -21.484,53.529 L -25.464,53.529 L -25.464,56.619 C -23.494,60.539 -19.444,63.239 -14.754,63.239 Z"/>
                                    <path fill="#FBBC05" d="M -21.484,53.529 C -21.734,52.809 -21.864,52.039 -21.864,51.239 C -21.864,50.439 -21.724,49.669 -21.484,48.949 L -21.484,45.859 L -25.464,45.859 C -26.284,47.479 -26.754,49.299 -26.754,51.239 C -26.754,53.179 -26.284,54.999 -25.464,56.619 L -21.484,53.529 Z"/>
                                    <path fill="#EA4335" d="M -14.754,43.989 C -12.984,43.989 -11.404,44.599 -10.154,45.789 L -6.734,41.939 C -8.804,40.009 -11.514,38.989 -14.754,38.989 C -19.444,38.989 -23.494,41.689 -25.464,45.859 L -21.484,48.949 C -20.534,46.099 -17.884,43.989 -14.754,43.989 Z"/>
                                </g>
                            </svg>
                            Continue with Google
                        </button>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                            <span className="flex-shrink-0 mx-4 text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">Or continue with email</span>
                            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium text-center">
                                {error}
                            </div>
                        )}

                        {!isLogin && (
                            <div>
                                <label className="block text-xs md:text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 md:h-5 md:w-5 text-zinc-400" />
                                    </div>
                                    <input 
                                        type="text" 
                                        required={!isLogin}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full pl-10 md:pl-11 pr-4 py-2.5 md:py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm md:text-base"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-xs md:text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 md:h-5 md:w-5 text-zinc-400" />
                                </div>
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 md:pl-11 pr-4 py-2.5 md:py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm md:text-base"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs md:text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 md:h-5 md:w-5 text-zinc-400" />
                                </div>
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 md:pl-11 pr-4 py-2.5 md:py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm md:text-base"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black font-bold py-3 md:py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 md:mt-6 shadow-lg text-sm md:text-base"
                        >
                            {isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </form>

                    <div className="mt-6 md:mt-8 text-center">
                        <button 
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-xs md:text-sm text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-medium"
                        >
                            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}