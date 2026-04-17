
import { toast } from 'sonner';

/**
 * Generates a unique Paystack reference
 */
export const generateReference = (prefix: string = 'chipng'): string => {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
};

export const getPaystackPublicKey = (): string => {
  return import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 
         import.meta.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 
         'pk_test_mock';
};

/**
 * Validates and prepares Paystack configuration
 */
export const preparePaystackConfig = (params: {
  email: string | undefined | null;
  amountNaira: number;
  metadata?: any;
}) => {
  const { email, amountNaira, metadata } = params;

  // 1. Validate Email
  if (!email) {
    const error = "User email is required for payment initialization.";
    console.error("❌ Paystack Error:", error);
    toast.error("Please ensure your profile has a valid email before continuing.");
    throw new Error(error);
  }

  // 2. Validate Public Key
  const publicKey = getPaystackPublicKey();
  
  // ALLOW MOCK MODE
  const isMockMode = publicKey === 'pk_test_mock';

  if (!isMockMode && !publicKey.startsWith('pk_test_') && !publicKey.startsWith('pk_live_')) {
    const error = "Invalid Paystack Public Key format.";
    console.error("❌ Paystack Error:", error);
    toast.error("Invalid Paystack Public Key. It should start with pk_test_ or pk_live_.");
    throw new Error(error);
  }

  // 3. Format Amount (Kobo fallback to integer)
  // Ensure it's an integer, no decimals, in kobo
  const amount = Math.floor(amountNaira * 100);
  
  if (amount <= 0) {
    const error = "Invalid transaction amount.";
    console.error("❌ Paystack Error:", error);
    toast.error("Invalid payment amount.");
    throw new Error(error);
  }

  // 4. Generate Reference
  const reference = generateReference();

  // 5. Debug Logging
  console.log("🚀 Initializing Paystack Payment:", {
    email,
    amount,
    reference,
    publicKey: publicKey.substring(0, 10) + "...", // Hide full key but show prefix
    metadata
  });

  return {
    reference,
    email,
    amount,
    publicKey,
    metadata: metadata || {}
  };
};
