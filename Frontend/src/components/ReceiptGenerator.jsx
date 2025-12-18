"use client";
import { API_URL } from '@/lib/api';

import { Check, Download, FileText, Mail, Printer } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

export default function ReceiptGenerator({ receiptData }) {
  const receiptRef = useRef(null);
  const [sending, setSending] = useState(false);

  const {
    receiptNumber,
    date,
    businessName,
    businessAddress,
    customerName,
    customerEmail,
    items = [],
    subtotal,
    tax,
    total,
    paymentMethod,
    status = 'paid',
  } = receiptData || {};

  const handlePrint = () => {
    if (receiptRef.current) {
      const printContent = receiptRef.current.innerHTML;
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>Receipt</title>');
      printWindow.document.write('<style>');
      printWindow.document.write(`
        body { font-family: Arial, sans-serif; padding: 20px; }
        .receipt { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .info-row { display: flex; justify-between; margin: 10px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .total-section { margin-top: 20px; text-align: right; }
        .total-row { display: flex; justify-content: flex-end; gap: 50px; margin: 5px 0; }
        @media print { body { padding: 0; } }
      `);
      printWindow.document.write('</style></head><body>');
      printWindow.document.write(printContent);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payment/download-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ receiptNumber }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${receiptNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Receipt downloaded');
      } else {
        toast.error('Download failed');
      }
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const handleEmailReceipt = async () => {
    setSending(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/payment/email-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          receiptNumber,
          email: customerEmail,
        }),
      });

      if (response.ok) {
        toast.success(`Receipt sent to ${customerEmail}`);
      } else {
        toast.error('Failed to send email');
      }
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (!receiptData) {
    return (
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 p-8 text-center">
        <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No receipt data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 overflow-hidden">
      {/* Action Buttons */}
      <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <FileText size={20} />
          Receipt
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-white dark:bg-[#2b2825] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-lg bg-white dark:bg-[#2b2825] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            Download
          </button>
          <button
            onClick={handleEmailReceipt}
            disabled={sending}
            className="btn-primary px-4 py-2 flex items-center gap-2 disabled:opacity-50"
          >
            <Mail size={16} />
            {sending ? 'Sending...' : 'Email'}
          </button>
        </div>
      </div>

      {/* Receipt Content */}
      <div ref={receiptRef} className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            QuickQueue
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Queue Management System
          </p>
        </div>

        {/* Status Badge */}
        {status === 'paid' && (
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-full px-6 py-2 flex items-center gap-2">
              <Check className="text-green-600 dark:text-green-400" size={20} />
              <span className="text-green-700 dark:text-green-300 font-semibold">PAID</span>
            </div>
          </div>
        )}

        {/* Receipt Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
              From:
            </h3>
            <p className="font-bold text-gray-800 dark:text-white">{businessName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{businessAddress}</p>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
              Bill To:
            </h3>
            <p className="font-bold text-gray-800 dark:text-white">{customerName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{customerEmail}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Receipt Number</p>
            <p className="font-bold text-gray-800 dark:text-white">{receiptNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
            <p className="font-bold text-gray-800 dark:text-white">
              {new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                <th className="text-left py-3 text-gray-700 dark:text-gray-300 font-semibold">
                  Description
                </th>
                <th className="text-center py-3 text-gray-700 dark:text-gray-300 font-semibold">
                  Qty
                </th>
                <th className="text-right py-3 text-gray-700 dark:text-gray-300 font-semibold">
                  Price
                </th>
                <th className="text-right py-3 text-gray-700 dark:text-gray-300 font-semibold">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 text-gray-800 dark:text-white">{item.description}</td>
                  <td className="py-4 text-center text-gray-600 dark:text-gray-400">
                    {item.quantity}
                  </td>
                  <td className="py-4 text-right text-gray-600 dark:text-gray-400">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="py-4 text-right font-semibold text-gray-800 dark:text-white">
                    ${(item.quantity * item.price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal:</span>
              <span>${subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Tax:</span>
              <span>${tax?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-800 dark:text-white pt-3 border-t-2 border-gray-300 dark:border-gray-600">
              <span>Total:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">${total?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Payment Method:</span>
            <span className="font-semibold text-gray-800 dark:text-white capitalize">
              {paymentMethod}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Thank you for your business!
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            For questions about this receipt, contact support@quickqueue.com
          </p>
        </div>
      </div>
    </div>
  );
}



