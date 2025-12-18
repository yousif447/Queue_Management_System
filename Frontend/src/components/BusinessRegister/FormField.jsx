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
    <div className="grid gap-4 mb-4">
      <Label htmlFor={id}>
        {Icon && <Icon />}
        {label}
      </Label>
      <Input
        type={type}
        onChange={onChange}
        value={value}
        name={name}
        className={`bg-[#ECECF0] ${className}`}
        id={id}
        placeholder={placeholder}
        required={required}
        pattern={pattern}
      />
    </div>
  );
}


