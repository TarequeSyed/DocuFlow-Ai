import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4.5 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantStyles = {
    primary:
      "bg-neutral-950 hover:bg-neutral-800 text-white shadow-md border border-neutral-900 focus:ring-neutral-500",
    secondary:
      "bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 border border-neutral-200 focus:ring-neutral-300",
    outline:
      "bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 focus:ring-neutral-300 shadow-sm",
    ghost:
      "bg-transparent hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 focus:ring-neutral-200",
    danger:
      "bg-rose-600 hover:bg-rose-500 text-white shadow-sm focus:ring-rose-500",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
