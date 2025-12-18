"use client";
import { API_URL } from '@/lib/api';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createContext, useContext } from 'react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SZac2Lqg6uXRvGcyfBKmtWLnxJmL1IhdkhzBkkJQBfdWSCTVePf3PXy0tl6AxFHlCJakZLWZH2SI1uQCPn95r7Q00UA26TeUM');

const PaymentContext = createContext(null);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within PaymentProvider');
  }
  return context;
};

export const PaymentProvider = ({ children }) => {
  const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payment/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          currency,
          metadata,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create payment intent');
      }

      return data;
    } catch (error) {
      console.error('Payment Intent Error:', error);
      throw error;
    }
  };

  const confirmPayment = async (paymentIntentId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payment/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentIntentId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to confirm payment');
      }

      return data;
    } catch (error) {
      console.error('Payment Confirmation Error:', error);
      throw error;
    }
  };

  const getPaymentHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payment/history`, {
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch payment history');
      }

      return data;
    } catch (error) {
      console.error('Payment History Error:', error);
      throw error;
    }
  };

  return (
    <PaymentContext.Provider
      value={{
        createPaymentIntent,
        confirmPayment,
        getPaymentHistory,
      }}
    >
      <Elements stripe={stripePromise}>
        {children}
      </Elements>
    </PaymentContext.Provider>
  );
};



