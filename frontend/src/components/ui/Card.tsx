import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradientHeader?: boolean;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-xl p-6 shadow-xl transition-all duration-300 hover:border-slate-700/80 ${className}`}
    >
      {children}
    </div>
  );
}
