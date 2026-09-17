import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const isGoogleAuthEnabled = Boolean(CLIENT_ID);

export default function GoogleSignInButton({ onSuccess, onError }) {
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;

    let cancelled = false;

    function init() {
      if (cancelled || !window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          try {
            const user = await loginWithGoogle(response.credential);
            onSuccess?.(user);
          } catch (err) {
            onError?.(err.apiMessage || "Đăng nhập Google thất bại");
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        locale: "vi",
      });
      setReady(true);
    }

    if (window.google?.accounts?.id) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          init();
        }
      }, 200);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [loginWithGoogle, onSuccess, onError]);

  if (!CLIENT_ID) return null;

  return (
    <div className="flex flex-col items-center">
      <div ref={buttonRef} />
      {!ready && <p className="mt-1 text-caption text-slate-400">Đang tải nút đăng nhập Google...</p>}
    </div>
  );
}
