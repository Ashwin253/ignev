// Tiny global toast helper — no provider needed. <Toaster /> listens for the event.
export type ToastTone = "success" | "info" | "warn";

export function toast(message: string, tone: ToastTone = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("evplse-toast", { detail: { message, tone } }));
}
