import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ShoppingBag, Search, Filter, ArrowLeft, ShoppingCart, X, Check, Plus } from 'lucide-react';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { PaystackButton } from 'react-paystack';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'motion/react';

const Shop: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product, quantity: number = 1) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
      setCart(newCart);
    } else {
      setCart([...cart, { product, quantity }]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const newQuantity = newCart[index].quantity + delta;
    if (newQuantity > 0) {
      newCart[index].quantity = newQuantity;
      setCart(newCart);
    }
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <h1 className="text-5xl font-black tracking-tighter dark:text-white mb-2">Chip Shop</h1>
            <p className="text-zinc-500">Exclusive merchandise and digital assets for creators</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
              />
            </div>
            <button 
              onClick={() => setShowCart(true)}
              className="relative p-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl shadow-xl hover:scale-105 transition-all"
            >
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-lime-400 text-zinc-950 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-zinc-950">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Categories */}
        <div className="flex gap-3 mb-12 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/20' 
                  : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={product.id} 
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500"
            >
              <div className="aspect-square relative overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4">
                  <span className="px-4 py-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-full text-sm font-black shadow-lg">
                    ₦{product.price.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="p-8 space-y-4">
                <div>
                  <div className="text-xs font-bold text-lime-500 uppercase tracking-widest mb-1">{product.category}</div>
                  <h3 className="text-xl font-bold dark:text-white line-clamp-1">{product.name}</h3>
                </div>
                <p className="text-sm text-zinc-500 line-clamp-2 min-h-[40px]">{product.description}</p>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl px-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const input = e.currentTarget.nextElementSibling as HTMLInputElement;
                        input.value = Math.max(1, parseInt(input.value) - 1).toString();
                      }}
                      className="p-2 text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      defaultValue="1" 
                      min="1"
                      className="w-12 bg-transparent text-center font-bold outline-none dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      id={`qty-${product.id}`}
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        input.value = (parseInt(input.value) + 1).toString();
                      }}
                      className="p-2 text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      const qty = parseInt((document.getElementById(`qty-${product.id}`) as HTMLInputElement).value);
                      addToCart(product, qty);
                    }}
                    className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold hover:bg-lime-400 hover:text-zinc-950 transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    <Plus className="w-5 h-5 transition-transform group-hover/btn:rotate-90" />
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-zinc-200 dark:text-zinc-800 mx-auto mb-6" />
            <h2 className="text-2xl font-bold dark:text-white mb-2">No products found</h2>
            <p className="text-zinc-500">Try adjusting your search or category filter</p>
          </div>
        )}
      </main>

      <Footer />

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-900 z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-2xl font-bold dark:text-white flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6" />
                  Your Cart
                </h2>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                  <X className="w-6 h-6 dark:text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-zinc-300" />
                    </div>
                    <div>
                      <h3 className="font-bold dark:text-white">Cart is empty</h3>
                      <p className="text-sm text-zinc-500">Add some items to get started</p>
                    </div>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={`${item.product.id}-${idx}`} className="flex gap-4 group">
                      <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden shrink-0">
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold dark:text-white truncate">{item.product.name}</h4>
                        <p className="text-sm text-zinc-500">{item.product.category}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-2 py-1">
                            <button onClick={() => updateQuantity(idx, -1)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">-</button>
                            <span className="text-sm font-bold dark:text-white min-w-[20px] text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(idx, 1)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">+</button>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lime-600">₦{(item.product.price * item.quantity).toLocaleString()}</div>
                            <button 
                              onClick={() => removeFromCart(idx)}
                              className="text-[10px] text-red-500 font-bold hover:underline uppercase tracking-widest"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-bold">Total</span>
                    <span className="text-3xl font-black dark:text-white">₦{totalAmount.toLocaleString()}</span>
                  </div>
                  <PaystackButton
                    className="w-full py-4 bg-lime-400 text-zinc-950 rounded-2xl font-bold hover:bg-lime-300 transition-all shadow-xl shadow-lime-400/20"
                    email={user?.email || 'guest@chipng.com'}
                    amount={totalAmount * 100}
                    publicKey={import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''}
                    reference={`shop_${Date.now()}_${user?.uid || 'guest'}`}
                    text="Checkout with Paystack"
                    onSuccess={async (reference: any) => {
                      try {
                        const response = await fetch('/api/verify-paystack', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            reference: reference.reference, 
                            userId: user?.uid,
                            isOrder: true,
                            amount: totalAmount
                          }),
                        });
                        const data = await response.json();
                        if (data.status === 'success') {
                          setCart([]);
                          setShowCart(false);
                          toast.success('Order placed successfully!');
                        } else {
                          toast.error('Payment verification failed.');
                        }
                      } catch (error) {
                        console.error('Error verifying shop payment:', error);
                        toast.error('Error verifying payment');
                      }
                    }}
                    onClose={() => toast.error('Payment cancelled')}
                  />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;
