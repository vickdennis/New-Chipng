
import { toast } from 'sonner';

/**
 * Generates a unique Paystack reference
 */
export const generateReference = (prefix: string = 'chipng'): string => {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
};

/**
 * Gets the Paystack public key from env
 */
export const getPaystackPublicKey = (): string => {
  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  
  if (!key) {
    console.error("❌ Paystack Error: Public key is missing in environment variables (VITE_PAYSTACK_PUBLIC_KEY).");
  }
  return key || '';
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
  
  if (!publicKey || !publicKey.startsWith('pk_')) {
    const error = "Invalid or missing Paystack Public Key. It must start with pk_";
    console.error("❌ Paystack Error:", error);
    // Removed automatic toast here to prevent recurring alerts on page load.
    // Callers should handle the error or check the key before triggering initialization.
    throw new Error(error);
  }

  // 3. Generate Reference
  const reference = generateReference();

  // 4. Debug Logging
  console.log("🚀 Initializing Paystack Payment:", {
    email,
    amount: amountNaira * 100, // Paystack expects amount in Kobo
    reference,
    publicKey: publicKey.substring(0, 10) + "...",
    metadata
  });

  return {
    publicKey,
    email,
    amount: amountNaira * 100, // Amount in lowest currency (Kobo for NGN)
    reference,
    metadata: metadata || {},
    currency: 'NGN',
  };
};
