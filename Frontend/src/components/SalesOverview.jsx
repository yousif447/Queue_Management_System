"use client";

import { useEffect, useState } from "react";

const salesData = [
  { month: "Jan", sales: 245, revenue: 12450 },
  { month: "Feb", sales: 312, revenue: 15600 },
  { month: "Mar", sales: 289, revenue: 14450 },
  { month: "Apr", sales: 401, revenue: 20050 },
  { month: "May", sales: 378, revenue: 18900 },
  { month: "Jun", sales: 456, revenue: 22800 },
];

const maxSales = Math.max(...salesData.map((d) => d.sales));

export default function SalesOverview() {
  const [animatedSales, setAnimatedSales] = useState(
    () => salesData.map(() => 10) 
  );

  useEffect(() => {
    const timeouts = [];
    const intervals = [];

    salesData.forEach((item, index) => {
      const timeout = setTimeout(() => {
        const targetValue = (item.sales / maxSales) * 100;
        const duration = 1000;
        const steps = 60;
        const increment = (targetValue - 10) / steps;
        let currentStep = 0;

        const interval = setInterval(() => {
          currentStep++;

          setAnimatedSales((prev) => {
            const next = [...prev];
            next[index] = 10 + increment * currentStep;
            return next;
          });

          if (currentStep >= steps) {
            setAnimatedSales((prev) => {
              const next = [...prev];
              next[index] = targetValue;
              return next;
            });
            clearInterval(interval);
          }
        }, duration / steps);

        intervals.push(interval);
      }, index * 100);

      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, []);

  return (
    <div className="space-y-4">
      {salesData.map((data, i) => (
        <div key={data.month} className="flex items-center">
          <div className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">
            {data.month}
          </div>
          <div className="flex-1">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-1000 ease-out"
                style={{ width: `${animatedSales[i] || 10}%` }}
              >
                <span className="text-white text-xs font-semibold">
                  {data.sales}
                </span>
              </div>
            </div>
          </div>
          <div className="w-32 text-right text-sm font-semibold text-gray-900 dark:text-white ml-4">
            ${data.revenue.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}


