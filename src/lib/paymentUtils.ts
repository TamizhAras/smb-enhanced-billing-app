import QRCode from 'qrcode';

// Razorpay Configuration
export interface RazorpayConfig {
  keyId: string;
  keySecret: string; // Keep this secure, only use server-side
  businessName: string;
  businessUPI: string;
  businessEmail: string;
  businessPhone: string;
}

// Payment Link Options
export interface PaymentLinkOptions {
  amount: number; // in paise (1 rupee = 100 paise)
  currency: string;
  description: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
}

// Default config (you'll replace these with real values)
const defaultConfig: RazorpayConfig = {
  keyId: 'rzp_test_xxxxxxxxxx', // Replace with your Razorpay Key ID
  keySecret: 'your_secret_key', // Keep this secure!
  businessName: 'Your Business Name',
  businessUPI: 'yourbusiness@paytm', // Your UPI ID
  businessEmail: 'business@example.com',
  businessPhone: '+91XXXXXXXXXX'
};

// Generate UPI Payment QR Code
export const generateUPIQRCode = async (
  amount: number,
  invoiceNumber: string,
  businessUPI: string = defaultConfig.businessUPI,
  businessName: string = defaultConfig.businessName
): Promise<string> => {
  // UPI Payment URL format
  const upiUrl = `upi://pay?pa=${businessUPI}&pn=${encodeURIComponent(businessName)}&am=${amount}&tn=Invoice%20${invoiceNumber}&cu=INR`;
  
  try {
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(upiUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Generate UPI Payment Link (for mobile deep linking)
export const generateUPILink = (
  amount: number,
  invoiceNumber: string,
  businessUPI: string = defaultConfig.businessUPI,
  businessName: string = defaultConfig.businessName
): string => {
  return `upi://pay?pa=${businessUPI}&pn=${encodeURIComponent(businessName)}&am=${amount}&tn=Invoice%20${invoiceNumber}&cu=INR`;
};

// Generate Razorpay Payment Link (simplified version)
export const generateRazorpayLink = (options: PaymentLinkOptions): string => {
  // This is a simplified version. In production, you'd create this via Razorpay API
  const baseUrl = 'https://rzp.io/l';
  const params = new URLSearchParams({
    amount: options.amount.toString(),
    currency: options.currency,
    description: options.description,
    reference_id: options.invoiceNumber
  });
  
  return `${baseUrl}/sample_link?${params.toString()}`;
};

// Generate PayPal Payment Link
export const generatePayPalLink = (
  amount: number,
  currency: string,
  description: string,
  businessEmail: string = defaultConfig.businessEmail
): string => {
  const amountInCurrency = currency === 'INR' ? (amount / 100) : amount; // Convert paise to rupees for display
  const params = new URLSearchParams({
    cmd: '_xclick',
    business: businessEmail,
    item_name: description,
    amount: amountInCurrency.toString(),
    currency_code: currency,
    no_shipping: '1'
  });
  
  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
};

// Generate Bank Transfer Instructions
export const generateBankTransferInstructions = (
  amount: number,
  invoiceNumber: string,
  currency: string = 'INR'
): {
  accountNumber: string;
  ifscCode: string;
  accountName: string;
  bankName: string;
  amount: number;
  reference: string;
} => {
  return {
    accountNumber: 'XXXXXXXXXXXX', // Replace with actual account
    ifscCode: 'BANKXXXXX', // Replace with actual IFSC
    accountName: defaultConfig.businessName,
    bankName: 'Your Bank Name', // Replace with actual bank
    amount: amount / 100, // Convert paise to rupees
    reference: `INV-${invoiceNumber}`
  };
};

// Payment Method Options for UI
export const paymentMethods = [
  {
    id: 'upi',
    name: 'UPI Payment',
    icon: '📱',
    description: 'Pay instantly using any UPI app',
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'qrcode',
    name: 'QR Code',
    icon: '📷',
    description: 'Scan QR code to pay',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    icon: '💳',
    description: 'Cards, UPI, Net Banking',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '🌍',
    description: 'International payments',
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: '🏦',
    description: 'Direct bank transfer',
    color: 'bg-gray-100 text-gray-800'
  }
];

// Format currency for display
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  });
  
  return formatter.format(amount / 100); // Convert paise to rupees
};

// Validate UPI ID format
export const validateUPI = (upiId: string): boolean => {
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId);
};

// Configuration helper
export const updatePaymentConfig = (newConfig: Partial<RazorpayConfig>) => {
  Object.assign(defaultConfig, newConfig);
};

// Get current configuration (for settings page)
export const getPaymentConfig = (): RazorpayConfig => {
  return { ...defaultConfig };
};
