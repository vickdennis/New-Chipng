
import { toast } from 'sonner';

/**
 * Generates a unique Flutterwave reference
 */
export const generateReference = (prefix: string = 'chipng'): string => {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
};

/**
 * Gets the Flutterwave public key from env
 */
export const getFlutterwavePublicKey = (): string => {
  const key = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || 
              import.meta.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
  
  if (!key) {
    console.error("❌ Flutterwave Error: Public key is missing in environment variables.");
  }
  return key || '';
};

/**
 * Validates and prepares Flutterwave configuration
 */
export const prepareFlutterwaveConfig = (params: {
  email: string | undefined | null;
  name?: string | null;
  phoneNumber?: string | null;
  amountNaira: number;
  title: string;
  description: string;
  metadata?: any;
}) => {
  const { email, name, phoneNumber, amountNaira, title, description, metadata } = params;

  // 1. Validate Email
  if (!email) {
    const error = "User email is required for payment initialization.";
    console.error("❌ Flutterwave Error:", error);
    toast.error("Please ensure your profile has a valid email before continuing.");
    throw new Error(error);
  }

  // 2. Validate Public Key
  const publicKey = getFlutterwavePublicKey();
  
  if (!publicKey || !publicKey.startsWith('FLWPUBK')) {
    const error = "Invalid or missing Flutterwave Public Key. It must start with FLWPUBK";
    console.error("❌ Flutterwave Error:", error);
    toast.error("Flutterwave configuration is incomplete. Please add your Public Key in Settings.");
    throw new Error(error);
  }

  // 3. Generate Reference
  const tx_ref = generateReference();

  // 4. Debug Logging
  console.log("🚀 Initializing Flutterwave Payment:", {
    email,
    amount: amountNaira,
    tx_ref,
    publicKey: publicKey.substring(0, 10) + "...",
    metadata
  });

  return {
    public_key: publicKey,
    tx_ref,
    amount: amountNaira,
    currency: 'NGN',
    payment_options: 'card,banktransfer,ussd',
    customer: {
      email,
      phone_number: phoneNumber || '',
      name: name || email.split('@')[0],
    },
    customizations: {
      title,
      description,
      logo: 'https://picsum.photos/seed/chipng/200/200',
    },
    meta: metadata || {},
    isMock: false
  };
};
