"use client";
import { API_URL, authFetch } from '@/lib/api';

import { AlertCircle, Clock, CreditCard, MapPin, Ticket, Users } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';
import PaymentForm from './PaymentForm';

export default function TicketBooking({ business }) {
  const { socket } = useSocket();
  const [booking, setBooking] = useState(false);
  const [priority, setPriority] = useState('normal');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showPayment, setShowPayment] = useState(false);
  const [bookedTicket, setBookedTicket] = useState(null);

  const {
    _id: businessId,
    name,
    address,
    currentQueue,
    averageWaitTime,
    isOpen,
  } = business || {};

  const handleBookTicket = async () => {
    if (!isOpen) {
      toast.error('Business is currently closed');
      return;
    }

    // If high priority and card payment (Stripe), show payment form
    if (priority === 'high' && paymentMethod === 'card') {
      setShowPayment(true);
      return;
    }

    // For normal priority or cash payments, create ticket directly
    await createTicket();
  };

  const createTicket = async (paymentData = null, returnOnly = false) => {
    if (!returnOnly) setBooking(true);
    try {
      const response = await authFetch(`${API_URL}/api/v1/businesses/${businessId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priority,
          paymentMethod,
          paymentIntentId: paymentData?.paymentIntentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (returnOnly) return data;
        setBookedTicket(data.ticket);
        if (socket) {
          socket.emit('joinBusiness', { businessId });
        }
        toast.success(`Ticket #${data.ticket.ticketNumber} booked successfully!`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to book ticket');
        return null;
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      return null;
    } finally {
      if (!returnOnly) {
          setBooking(false);
          setShowPayment(false);
      }
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    await createTicket(paymentData);
  };

  if (!business) {
    return (
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 p-8">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Business information not available
        </p>
      </div>
    );
  }

  // Show payment form if needed
  if (showPayment && priority === 'high' && paymentMethod === 'card') {
    return (
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Complete Payment</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Pay $5.00 for Fast Track priority ticket
        </p>
        <PaymentForm
          amount={5}
          currency="usd"
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
          metadata={{ businessId, priority }}
        />
      </div>
    );
  }

  if (bookedTicket) {
    return (
      <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ticket size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Ticket Booked!</h2>
          <p className="text-white/80">Your queue number is</p>
        </div>

        <div className="bg-white rounded-2xl p-8 mb-6 shadow-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Ticket Number</p>
            <p className="text-6xl font-bold gradient-text">
              #{bookedTicket.ticketNumber}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Users size={20} />
              <span>People ahead</span>
            </div>
            <span className="font-bold">{bookedTicket.position - 1}</span>
          </div>

          <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Clock size={20} />
              <span>Estimated wait</span>
            </div>
            <span className="font-bold">{bookedTicket.eta || averageWaitTime} min</span>
          </div>

          <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2">
              <MapPin size={20} />
              <span>Status</span>
            </div>
            <span className="font-bold capitalize">{bookedTicket.status}</span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <p className="text-sm text-center">
            📱 You&apos;ll receive real-time updates about your position. 
            Please stay nearby when your turn approaches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 p-6">
        <h2 className="text-2xl font-bold text-white mb-2">{name}</h2>
        <div className="flex items-center gap-2 text-white/80">
          <MapPin size={16} />
          <span className="text-sm">{address}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
            <span className={`font-semibold ${isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {isOpen ? 'Open Now' : 'Closed'}
            </span>
          </div>
          {priority === 'high' && (
            <span className="badge-warning">Fast Track</span>
          )}
        </div>

        {/* Queue Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <Users size={18} />
              <span className="text-sm">In Queue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentQueue || 0}</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <Clock size={18} />
              <span className="text-sm">Avg. Wait</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageWaitTime || 0} min</p>
          </div>
        </div>

        {/* Priority Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Select Priority
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPriority('normal')}
              className={`p-4 rounded-xl border-2 transition-all ${
                priority === 'normal'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-emerald-500'
              }`}
            >
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Normal</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Free</p>
            </button>

            <button
              onClick={() => setPriority('high')}
              className={`p-4 rounded-xl border-2 transition-all ${
                priority === 'high'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-amber-500'
              }`}
            >
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Fast Track</p>
              <p className="text-sm text-amber-600 dark:text-amber-400">$5.00</p>
            </button>
          </div>
        </div>

        {/* Payment Method Selection (only for high priority) */}
        {priority === 'high' && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-emerald-500'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">💵</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Cash</p>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-emerald-500'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <CreditCard size={24} className="text-gray-600 dark:text-gray-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Card</p>
                </div>
              </button>
            </div>
            {paymentMethod === 'cash' && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Pay $5.00 in cash when you arrive at the business
              </p>
            )}
          </div>
        )}

        {/* Warning Message */}
        {!isOpen && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">
              This business is currently closed. You can book a ticket for when they open.
            </p>
          </div>
        )}

        {/* Book Button */}
        <button
          onClick={handleBookTicket}
          disabled={booking}
          className="btn-primary w-full py-4 flex items-center justify-center gap-2"
        >
          {booking ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Booking...</span>
            </>
          ) : (
            <>
              <Ticket size={20} />
              <span>Book Ticket {priority === 'high' ? '($5.00)' : '(Free)'}</span>
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
          You&apos;ll receive real-time notifications about your queue position
        </p>
      </div>
    </div>
  );
}



