import { PlanType } from './types';
import { Star, Zap, ShieldCheck } from 'lucide-react';

export const PLANS = [
  {
    id: 'basic' as PlanType,
    name: 'Basic',
    price: 5000,
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
    price: 10000,
    description: 'Advanced features for creators and growing brands.',
    icon: Star,
    features: [
      'Everything in Basic',
      'Cover image banner',
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
    price: 15000,
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

export const getPlanById = (id: PlanType) => PLANS.find(p => p.id === id);
export const getAmount = (plan: PlanType) => {
  const p = getPlanById(plan);
  return (p?.price || 0) * 100; // Paystack expects amount in kobo
};
