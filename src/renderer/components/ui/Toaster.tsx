import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

// Global toast state
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toastList: Toast[] = [];

export function toast(options: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substring(7);
  const newToast: Toast = { ...options, id };
  toastList = [...toastList, newToast];
  toastListeners.forEach(listener => listener(toastList));

  // Auto-remove after duration
  const duration = options.duration ?? 5000;
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

export function removeToast(id: string) {
  toastList = toastList.filter(t => t.id !== id);
  toastListeners.forEach(listener => listener(toastList));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setToasts([...newToasts]);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    warning: <AlertTriangle className="text-yellow-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };

  const backgrounds = {
    success: 'border-green-500/30',
    error: 'border-red-500/30',
    warning: 'border-yellow-500/30',
    info: 'border-blue-500/30',
  };

  return (
    <div
      className={`toast flex items-start gap-3 border ${backgrounds[toast.type]} animate-slide-up`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{toast.title}</h4>
        {toast.message && (
          <p className="text-sm text-muted-foreground mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Convenience methods
toast.success = (title: string, message?: string) => toast({ type: 'success', title, message });
toast.error = (title: string, message?: string) => toast({ type: 'error', title, message });
toast.warning = (title: string, message?: string) => toast({ type: 'warning', title, message });
toast.info = (title: string, message?: string) => toast({ type: 'info', title, message });
