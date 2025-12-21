"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FormField({ 
  icon: Icon, 
  label, 
  id, 
  name, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  required = false,
  pattern,
  className = ""
}) {
  return (
    <div className="mb-4">
      <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {Icon && <Icon size={16} className="text-gray-400" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        type={type}
        onChange={onChange}
        value={value}
        name={name}
        className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder:text-gray-400 ${className}`}
        id={id}
        placeholder={placeholder}
        required={required}
        pattern={pattern}
      />
    </div>
  );
}
