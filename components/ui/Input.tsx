import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-stone-700">{label}</span>
      )}
      <input
        id={inputId}
        className={`min-h-11 w-full rounded-xl border border-stone-300 bg-white px-4 py-2 text-base outline-none ring-orange-500 focus:border-orange-500 focus:ring-2 ${className}`}
        {...props}
      />
      {hint && <span className="text-sm text-stone-500">{hint}</span>}
    </label>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function Textarea({
  label,
  hint,
  className = "",
  id,
  ...props
}: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-stone-700">{label}</span>
      )}
      <textarea
        id={inputId}
        className={`min-h-24 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none ring-orange-500 focus:border-orange-500 focus:ring-2 ${className}`}
        {...props}
      />
      {hint && <span className="text-sm text-stone-500">{hint}</span>}
    </label>
  );
}
