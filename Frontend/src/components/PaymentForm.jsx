"use client";

import { usePayment } from '@/contexts/PaymentContext';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Check, CreditCard, Lock, Shield } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function PaymentForm({ amount, currency = 'usd', onSuccess, onCancel, metadata = {} }) {
  const stripe = useStripe();
  const elements = useElements();
  const { createPaymentIntent } = usePayment();
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState(null);

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': { color: '#9CA3AF' },
      },
      invalid: { color: '#EF4444' },
    },
    hidePostalCode: false,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const { clientSecret, paymentIntentId } = await createPaymentIntent(amount, currency, metadata);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (stripeError) {
        setError(stripeError.message);
        toast.error(stripeError.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        setSucceeded(true);
        toast.success('Payment successful!');
        if (onSuccess) {
          onSuccess({ paymentIntentId: paymentIntent.id, amount: paymentIntent.amount, currency: paymentIntent.currency });
        }
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
    setProcessing(false);
  };

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700/50 p-8 max-w-md mx-auto">
      {succeeded ? (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Check size={40} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Your payment of ${(amount / 100).toFixed(2)} {currency.toUpperCase()} has been processed.
          </p>
          <button onClick={() => onSuccess && onSuccess()} className="btn-primary px-8 py-3">
            Continue
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CreditCard className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Details</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Complete your payment securely</p>
              </div>
            </div>
          </div>

          {/* Amount Display */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-2xl p-5 mb-8 border border-emerald-200 dark:border-emerald-500/30">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
            <p className="text-4xl font-bold gradient-text">
              ${(amount / 100).toFixed(2)} <span className="text-lg text-gray-600 dark:text-gray-400">{currency.toUpperCase()}</span>
            </p>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Card Details
              </label>
              <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800 focus-within:border-emerald-500 dark:focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/20 transition-all">
                <CardElement options={cardElementOptions} />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Security Badge */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <Shield size={16} className="text-emerald-500" />
              <span>Secured by Stripe. Your payment info is encrypted.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {onCancel && (
                <button type="button" onClick={onCancel} disabled={processing} className="btn-secondary flex-1 py-3.5">
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!stripe || processing}
                className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
                ) : (
                  <><Lock size={18} />Pay ${(amount / 100).toFixed(2)}</>
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}


