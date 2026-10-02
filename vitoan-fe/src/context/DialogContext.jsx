import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, HelpCircle, Info } from "../components/ui/icons.jsx";
import { cn } from "../lib/utils";

// Hộp thoại của ViToan — thay cho window.confirm / window.alert của trình duyệt (chép từ ViChess).
// Dùng: const dialog = useDialog();
//   if (!(await dialog.confirm({ title, message, confirmText, danger: true }))) return;
//   await dialog.alert({ title, message });
const DialogContext = createContext(null);

const ICONS = {
  danger: { Icon: AlertTriangle, box: "bg-rose-100 text-rose-600" },
  question: { Icon: HelpCircle, box: "bg-sky-100 text-secondary" },
  info: { Icon: Info, box: "bg-amber-100 text-amber-600" },
};

const BTN = "inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 font-black transition active:translate-y-[2px]";

export function DialogProvider({ children }) {
  const [dlg, setDlg] = useState(null); // { kind, title, message, confirmText, cancelText, danger, resolve }
  const okRef = useRef(null);

  const open = useCallback((kind, opts) => {
    const o = typeof opts === "string" ? { message: opts } : opts || {};
    return new Promise((resolve) => setDlg({ kind, ...o, resolve }));
  }, []);
  const confirm = useCallback((opts) => open("confirm", opts), [open]);
  const alert = useCallback((opts) => open("alert", opts), [open]);

  const close = (value) => {
    dlg?.resolve(value);
    setDlg(null);
  };

  useEffect(() => {
    if (!dlg) return undefined;
    okRef.current?.focus({ preventScroll: true }); // không để trình duyệt (nhất là iPhone) tự cuộn trang khi mở hộp thoại
    const onKey = (e) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dlg]);

  const style = ICONS[dlg?.danger ? "danger" : dlg?.kind === "alert" ? "info" : "question"];
  const title = dlg?.title || (dlg?.kind === "alert" ? "Thông báo" : "Em chắc chắn chứ?");

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dlg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]" onMouseDown={() => close(false)}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md animate-pop-in rounded-[2rem] bg-white p-6 shadow-[0_30px_70px_-20px_rgba(11,35,64,0.5)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", style.box)}>
                <style.Icon className="h-9 w-9" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-black text-ink">{title}</p>
                {dlg.message && <p className="mt-1.5 whitespace-pre-line font-semibold text-slate-600">{dlg.message}</p>}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {dlg.kind === "confirm" && (
                <button type="button" className={cn(BTN, "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300")} onClick={() => close(false)}>
                  {dlg.cancelText || "Không"}
                </button>
              )}
              <button
                ref={okRef}
                type="button"
                className={cn(BTN, dlg.danger ? "bg-rose-500 text-white shadow-[0_4px_0_0_#be123c] hover:bg-rose-600" : "bg-primary text-white shadow-[0_4px_0_0_#049245] hover:bg-primary-dark")}
                onClick={() => close(true)}
              >
                {dlg.confirmText || (dlg.kind === "alert" ? "Đã hiểu" : "Đồng ý")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog phải nằm trong DialogProvider");
  return ctx;
}
