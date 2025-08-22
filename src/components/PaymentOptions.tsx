import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import {
  generateUPIQRCode,
  generateUPILink,
  generateRazorpayLink,
  generatePayPalLink,
  generateBankTransferInstructions,
  paymentMethods,
  formatCurrency,
  type PaymentLinkOptions
} from '../lib/paymentUtils';

interface PaymentOptionsProps {
  invoiceId: number;
  invoiceNumber: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  description: string;
  onPaymentMethodSelect?: (method: string, details: any) => void;
}

export const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  invoiceId,
  invoiceNumber,
  amount,
  currency,
  customerName,
  customerEmail,
  customerPhone,
  description,
  onPaymentMethodSelect
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [showDetails, setShowDetails] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // Payment link options
  const paymentOptions: PaymentLinkOptions = {
    amount: amount * 100, // Convert to paise
    currency,
    description,
    invoiceNumber,
    customerName,
    customerEmail,
    customerPhone
  };

  const handleMethodSelect = async (methodId: string) => {
    setSelectedMethod(methodId);
    setShowDetails(methodId);

    if (onPaymentMethodSelect) {
      let details: any = {};

      switch (methodId) {
        case 'upi':
          details = {
            link: generateUPILink(amount, invoiceNumber),
            instructions: 'Click the link below or copy the UPI ID to make payment'
          };
          break;
        case 'qrcode':
          setIsGeneratingQR(true);
          try {
            const qrImage = await generateUPIQRCode(amount, invoiceNumber);
            setQrCodeImage(qrImage);
            details = {
              qrCode: qrImage,
              instructions: 'Scan this QR code with any UPI app to make payment'
            };
          } catch (error) {
            console.error('Failed to generate QR code:', error);
            alert('Failed to generate QR code. Please try another payment method.');
          }
          setIsGeneratingQR(false);
          break;
        case 'razorpay':
          details = {
            link: generateRazorpayLink(paymentOptions),
            instructions: 'Pay securely using Razorpay - supports all payment methods'
          };
          break;
        case 'paypal':
          details = {
            link: generatePayPalLink(amount * 100, currency, description),
            instructions: 'Pay internationally using PayPal'
          };
          break;
        case 'bank':
          details = generateBankTransferInstructions(amount * 100, invoiceNumber, currency);
          break;
      }

      onPaymentMethodSelect(methodId, details);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy. Please copy manually.');
    });
  };

  const sharePaymentLink = (link: string, method: string) => {
    if (navigator.share) {
      navigator.share({
        title: `Payment for Invoice ${invoiceNumber}`,
        text: `Please pay ${formatCurrency(amount * 100, currency)} for invoice ${invoiceNumber}`,
        url: link
      });
    } else {
      copyToClipboard(link);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Payment Options
          </h3>
          <p className="text-sm text-gray-600">
            Amount to pay: <span className="font-bold text-green-600">
              {formatCurrency(amount * 100, currency)}
            </span>
          </p>
        </div>

        {/* Payment Method Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <div className="font-medium text-gray-900">{method.name}</div>
                  <div className="text-sm text-gray-500">{method.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Payment Details */}
        {showDetails && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            {showDetails === 'upi' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">UPI Payment</h4>
                <p className="text-sm text-gray-600">Click the button below to open your UPI app:</p>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => window.open(generateUPILink(amount, invoiceNumber), '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    📱 Pay with UPI
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(generateUPILink(amount, invoiceNumber))}
                  >
                    📋 Copy Link
                  </Button>
                </div>
              </div>
            )}

            {showDetails === 'qrcode' && (
              <div className="space-y-4 text-center">
                <h4 className="font-medium text-gray-900">Scan QR Code to Pay</h4>
                {isGeneratingQR ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Generating QR code...</span>
                  </div>
                ) : qrCodeImage ? (
                  <div className="space-y-3">
                    <img 
                      src={qrCodeImage} 
                      alt="Payment QR Code" 
                      className="mx-auto border rounded-lg"
                    />
                    <p className="text-sm text-gray-600">
                      Scan with any UPI app (GPay, PhonePe, Paytm, etc.)
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `payment-qr-${invoiceNumber}.png`;
                        link.href = qrCodeImage;
                        link.click();
                      }}
                    >
                      💾 Download QR Code
                    </Button>
                  </div>
                ) : (
                  <p className="text-red-600">Failed to generate QR code</p>
                )}
              </div>
            )}

            {showDetails === 'razorpay' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Razorpay Payment</h4>
                <p className="text-sm text-gray-600">
                  Pay securely using cards, UPI, net banking, and more:
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => window.open(generateRazorpayLink(paymentOptions), '_blank')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    💳 Pay with Razorpay
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => sharePaymentLink(generateRazorpayLink(paymentOptions), 'Razorpay')}
                  >
                    📤 Share Link
                  </Button>
                </div>
              </div>
            )}

            {showDetails === 'paypal' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">PayPal Payment</h4>
                <p className="text-sm text-gray-600">
                  International payment via PayPal (credit cards accepted):
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => window.open(generatePayPalLink(amount * 100, currency, description), '_blank')}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    🌍 Pay with PayPal
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => sharePaymentLink(generatePayPalLink(amount * 100, currency, description), 'PayPal')}
                  >
                    📤 Share Link
                  </Button>
                </div>
              </div>
            )}

            {showDetails === 'bank' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Bank Transfer Details</h4>
                <div className="bg-white p-4 rounded border">
                  {(() => {
                    const bankDetails = generateBankTransferInstructions(amount * 100, invoiceNumber, currency);
                    return (
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Account Name:</span> {bankDetails.accountName}</div>
                        <div><span className="font-medium">Account Number:</span> {bankDetails.accountNumber}</div>
                        <div><span className="font-medium">IFSC Code:</span> {bankDetails.ifscCode}</div>
                        <div><span className="font-medium">Bank Name:</span> {bankDetails.bankName}</div>
                        <div><span className="font-medium">Amount:</span> {formatCurrency(amount * 100, currency)}</div>
                        <div><span className="font-medium">Reference:</span> {bankDetails.reference}</div>
                      </div>
                    );
                  })()}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const bankDetails = generateBankTransferInstructions(amount * 100, invoiceNumber, currency);
                    const text = `Bank Transfer Details:\nAccount: ${bankDetails.accountNumber}\nIFSC: ${bankDetails.ifscCode}\nAmount: ${formatCurrency(amount * 100, currency)}\nReference: ${bankDetails.reference}`;
                    copyToClipboard(text);
                  }}
                >
                  📋 Copy Details
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            After making payment, it may take a few minutes to reflect in our system.
            For immediate confirmation, please share payment receipt.
          </p>
        </div>
      </div>
    </Card>
  );
};
