import { createContext } from "react";

export type ToastTone = "success" | "info" | "warning" | "error";

export interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
