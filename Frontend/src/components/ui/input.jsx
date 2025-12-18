import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700",
        "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white",
        "placeholder:text-gray-400 dark:placeholder:text-gray-500",
        "transition-all duration-200 outline-none",
        "hover:border-gray-300 dark:hover:border-gray-600",
        "focus:border-emerald-500 dark:focus:border-emerald-500",
        "focus:bg-white dark:focus:bg-gray-900",
        "focus:ring-4 focus:ring-emerald-500/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:text-gray-600 dark:file:text-gray-400 file:bg-transparent file:border-0 file:font-medium",
        className
      )}
      {...props}
    />
  );
}

export { Input }


