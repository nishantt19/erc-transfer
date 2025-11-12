"use client";
import { type ReactNode, useEffect } from "react";
import { IoMdClose } from "react-icons/io";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "sm",
}: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative top-1/5 w-full ${maxWidthClasses[maxWidth]} bg-card border border-border-input rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 pb-2">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="text-secondary p-1.5 rounded-xl hover:bg-input hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <IoMdClose size={24} />
            </button>
          </div>
        )}

        {/* Close button when no title */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-secondary hover:text-foreground transition-colors z-10"
            aria-label="Close modal"
          >
            <IoMdClose size={24} />
          </button>
        )}

        {/* Content */}
        <div className={`p-4 ${title ? "pt-1" : "pt-12"}`}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
