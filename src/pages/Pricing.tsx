import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Star, Zap, ShieldCheck, Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { toast } from 'sonner';
import { PlanType } from '../types';
import { usePaystackPayment } from 'react-paystack';
import { preparePaystackConfig, getPaystackPublicKey } from '../utils/paystack';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PLANS = [
  {
    id: 'basic' as PlanType,
    name: 'Basic',
    price: '5,000',
    description: 'Perfect for getting started with your personal brand.',
    icon: Zap,
    features: [
      'Add unlimited links',
      'Basic profile customization',
      'Default themes',
      'Standard support',
    ],
    buttonText: 'Get Started',
    popular: false,
  },
  {
    id: 'pro' as PlanType,
    name: 'Pro',
    price: '10,000',
    description: 'Advanced features for creators and growing brands.',
    icon: Star,
    features: [
      'Everything in Basic',
      'Custom background image',
      'Add social icons',
      'Basic analytics (click count)',
      'Priority support',
    ],
    buttonText: 'Upgrade to Pro',
    popular: true,
  },
  {
    id: 'business' as PlanType,
    name: 'Business',
    price: '15,000',
    description: 'The ultimate toolkit for businesses and professionals.',
    icon: ShieldCheck,
    features: [
      'Everything in Pro',
      'Appointment booking section',
      'Google Maps location',
      'Priority profile loading',
      'Advanced customization (fonts, colors)',
      'Dedicated account manager',
    ],
    buttonText: 'Upgrade to Business',
    popular: false,
  },
];

const Pricing: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const navigate = useNavigate();

  const getAmount = (plan: PlanType) => {
    switch (plan) {
      case 'business': return 15000;
      case 'pro': return 10000;
      case 'basic': return 5000;
      default: return 0;
    }
  };

  const config: any = React.useMemo(() => {
    if (!selectedPlan || !auth.currentUser) return { publicKey: getPaystackPublicKey() };
    
    try {
      return preparePaystackConfig({
        email: auth.currentUser.email,
        amountNaira: getAmount(selectedPlan),
        metadata: {
          userId: auth.currentUser.uid,
          plan: selectedPlan
        }
      });
    } catch (e) {
      return { publicKey: getPaystackPublicKey() };
    }
  }, [selectedPlan, auth.currentUser]);

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference: any) => {
    setLoading(selectedPlan);
    try {
      const response = await fetch('/api/verify-paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reference: reference.reference, 
          userId: auth.currentUser?.uid,
          plan: selectedPlan
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast.success(`Successfully upgraded to ${selectedPlan?.toUpperCase()}!`);
        navigate(`/payment-success?reference=${reference.reference}&plan=${selectedPlan}`);
      } else {
        toast.error('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Error verifying payment');
    } finally {
      setLoading(null);
      setSelectedPlan(null);
    }
  };

  const onClose = () => {
    toast.info('Payment cancelled');
    setLoading(null);
    setSelectedPlan(null);
  };

  const handleSubscribe = (plan: PlanType) => {
    if (!auth.currentUser) {
      toast.error('Please log in to upgrade your plan');
      navigate('/login');
      return;
    }
    setSelectedPlan(plan);
  };

  React.useEffect(() => {
    if (selectedPlan) {
      initializePayment({ onSuccess, onClose });
    }
  }, [selectedPlan]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white transition-colors duration-300">
      <Navbar />
      
      <main className="pt-40 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-zinc-950 dark:from-white to-zinc-500 bg-clip-text text-transparent">
              Simple, transparent pricing
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-xl max-w-2xl mx-auto">
              Choose the plan that's right for you and start building your online presence today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 hover:scale-[1.02] ${
                  plan.popular
                    ? 'bg-zinc-50 dark:bg-zinc-900 border-lime-500/50 dark:border-lime-400/50 shadow-[0_0_40px_rgba(163,230,53,0.1)]'
                    : 'bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-400 text-zinc-950 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                    plan.popular ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                  }`}>
                    <plan.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-zinc-950 dark:text-white">{plan.name}</h3>
                  <p className="text-zinc-600 dark:text-zinc-500 text-sm leading-relaxed">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-zinc-950 dark:text-white">₦{plan.price}</span>
                    <span className="text-zinc-500">/month</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading !== null}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all mb-8 ${
                    plan.popular
                      ? 'bg-lime-400 text-zinc-950 hover:bg-lime-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  } disabled:opacity-50`}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {plan.buttonText}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="space-y-4 mt-auto">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-1 bg-zinc-200 dark:bg-zinc-800 rounded-full p-0.5">
                        <Check className="w-3 h-3 text-lime-500 dark:text-lime-400" />
                      </div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <p className="text-zinc-500 text-sm">
              All prices are in Nigerian Naira (₦). Need a custom plan? <button className="text-lime-400 font-bold hover:underline">Contact sales</button>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
