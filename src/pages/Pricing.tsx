import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Star, Zap, ShieldCheck } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { PlanType } from '../types';

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
  const navigate = useNavigate();

  const handleSubscribe = async (plan: PlanType) => {
    if (!auth.currentUser) {
      toast.error('Please log in to upgrade your plan');
      navigate('/login');
      return;
    }

    setLoading(plan);
    try {
      // Placeholder for real payment integration
      // In a real app, you'd redirect to Paystack/Stripe here
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        plan: plan,
        subscriptionStatus: 'active',
      });

      toast.success(`Successfully upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan!`);
      navigate('/dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      toast.error('Failed to upgrade plan');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            Simple, transparent pricing
          </h1>
          <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
            Choose the plan that's right for you and start building your online presence today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 hover:scale-[1.02] ${
                plan.popular
                  ? 'bg-zinc-900 border-lime-400/50 shadow-[0_0_40px_rgba(163,230,53,0.1)]'
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-400 text-zinc-950 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                  plan.popular ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  <plan.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₦{plan.price}</span>
                  <span className="text-zinc-500">/month</span>
                </div>
              </div>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all mb-8 ${
                  plan.popular
                    ? 'bg-lime-400 text-zinc-950 hover:bg-lime-300'
                    : 'bg-white text-zinc-950 hover:bg-zinc-200'
                } disabled:opacity-50`}
              >
                {loading === plan.id ? 'Processing...' : plan.buttonText}
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="space-y-4 mt-auto">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 bg-zinc-800 rounded-full p-0.5">
                      <Check className="w-3 h-3 text-lime-400" />
                    </div>
                    <span className="text-sm text-zinc-400">{feature}</span>
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
    </div>
  );
};

export default Pricing;
