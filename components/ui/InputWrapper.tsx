import { type ReactNode } from "react";

interface InputWrapperProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export const InputWrapper = ({ label, error, children }: InputWrapperProps) => {
  return (
    <div className="bg-input border border-transparent hover:bg-input-hover focus-within:bg-card focus-within:border-border-input focus-within:hover:bg-card focus-within:hover:border-border-input transition-colors p-4 rounded-2xl flex flex-col">
      <div className="text-sm text-secondary uppercase">{label}</div>
      {children}
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};
