"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { forgotPassword, verifyResetOtp, resetPassword } from "@/lib/api";
import { Brand, Field, PasswordInput, Pending } from "./shared";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { dashboardCallback } from "@/lib/paths";
type Mode = "login" | "forgot" | "verify" | "reset";
export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [remember, setRemember] = useState(false);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    if (mode === "verify" || mode === "reset") {
      const saved = sessionStorage.getItem("resetEmail");
      if (saved) setEmail(saved);
      else router.replace("/forgot-password");
    }
    if (mode === "reset" && !sessionStorage.getItem("resetToken"))
      router.replace("/forgot-password");
  }, [mode, router]);
  useEffect(() => {
    if (!cooldown) return;
    const id = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);
  useEffect(() => {
    if (status === "authenticated" && mode === "login") router.replace("/");
  }, [status, mode, router]);
  const loginMutation = useMutation({
    mutationFn: async () => {
      const result = await signIn("credentials", {
        email,
        password,
        remember: String(remember),
        redirect: false,
      });
      if (result?.error) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success("Welcome back");
      const callback = new URLSearchParams(window.location.search).get(
        "callbackUrl",
      );
      router.replace(dashboardCallback(callback));
      router.refresh();
    },
  });
  const forgot = useMutation({
    mutationFn: () => forgotPassword(email),
    onSuccess: () => {
      sessionStorage.setItem("resetEmail", email);
      sessionStorage.removeItem("resetToken");
      toast.success("If the account exists, a reset code has been sent.");
      if (mode === "forgot") router.push("/verify-email");
      else setCooldown(60);
    },
  });
  const verify = useMutation({
    mutationFn: () => verifyResetOtp(email, digits.join("")),
    onSuccess: (data) => {
      sessionStorage.setItem("resetToken", data.resetToken);
      router.push("/reset-password");
    },
  });
  const reset = useMutation({
    mutationFn: () =>
      resetPassword(sessionStorage.getItem("resetToken") || "", password),
    onSuccess: () => {
      sessionStorage.removeItem("resetToken");
      sessionStorage.removeItem("resetEmail");
      toast.success("Password changed. Sign in with your new password.");
      router.replace("/login");
    },
  });
  const pending =
    loginMutation.isPending ||
    forgot.isPending ||
    verify.isPending ||
    reset.isPending;
  const titles = {
    login: "Welcome back",
    forgot: "Forgot Password?",
    verify: "Verify your email",
    reset: "Reset Password?",
  };
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "login") loginMutation.mutate();
    if (mode === "forgot") forgot.mutate();
    if (mode === "verify") {
      if (digits.join("").length !== 6) {
        toast.error("Enter the complete 6-digit code.");
        return;
      }
      verify.mutate();
    }
    if (mode === "reset") {
      if (password !== confirm) {
        toast.error("Passwords do not match.");
        return;
      }
      reset.mutate();
    }
  }
  function updateDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((d, i) => (i === index ? clean : d)));
    if (clean) refs.current[index + 1]?.focus();
  }
  return (
    <main className="auth-page">
      <section className={`auth-card auth-${mode}`}>
        {mode !== "login" && (
          <Link href="/login" className="back-link">
            <ArrowLeft size={21} />
            Back to sign In
          </Link>
        )}
        <div className="auth-heading">
          <Brand large />
          <h1>{titles[mode]}</h1>
          <p>
            {mode === "login" ? (
              <>
                Please enter your email &amp; password to access
                <br /> your account.
              </>
            ) : mode === "forgot" ? (
              "Enter your email and we’ll send you a code to reset your password"
            ) : mode === "verify" ? (
              `we sent a 6-digit code to ${email}`
            ) : (
              "Please enter a new password for your account. Use a strong password to keep your account secure."
            )}
          </p>
        </div>
        <form onSubmit={submit}>
          {(mode === "login" || mode === "forgot") && (
            <Field label="Email" id="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          )}
          {(mode === "login" || mode === "reset") && (
            <Field
              label={mode === "reset" ? "New Password" : "Password"}
              id="password"
            >
              <PasswordInput
                id="password"
                placeholder="********"
                autoComplete={
                  mode === "reset" ? "new-password" : "current-password"
                }
                minLength={mode === "reset" ? 10 : 1}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          )}
          {mode === "reset" && (
            <Field label="Confirm Password" id="confirm">
              <PasswordInput
                id="confirm"
                autoComplete="new-password"
                placeholder="********"
                required
                minLength={10}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
          )}
          {mode === "login" && (
            <div className="login-options">
              <label>
                <Checkbox
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                Remember me
              </label>
              <Link href="/forgot-password">Forgot Password</Link>
            </div>
          )}
          {mode === "verify" && (
            <>
              <div
                className="otp-inputs"
                onPaste={(e) => {
                  e.preventDefault();
                  const code = e.clipboardData
                    .getData("text")
                    .replace(/\D/g, "")
                    .slice(0, 6);
                  setDigits(Array.from({ length: 6 }, (_, i) => code[i] || ""));
                  refs.current[Math.min(code.length, 5)]?.focus();
                }}
              >
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    aria-label={`Digit ${i + 1}`}
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => updateDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digits[i])
                        refs.current[i - 1]?.focus();
                      if (e.key === "ArrowLeft") refs.current[i - 1]?.focus();
                      if (e.key === "ArrowRight") refs.current[i + 1]?.focus();
                    }}
                  />
                ))}
              </div>
              <div className="resend-row">
                <span>Didn’t receive it ?</span>
                <button
                  type="button"
                  disabled={cooldown > 0 || pending}
                  onClick={() => forgot.mutate()}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </>
          )}
          <Button className="auth-submit" type="submit" disabled={pending}>
            <Pending pending={pending}>
              {mode === "login"
                ? "Sign In to Admin Panel"
                : mode === "forgot"
                  ? "Continue"
                  : mode === "verify"
                    ? "Verify"
                    : "Change Password"}
            </Pending>
          </Button>
        </form>
      </section>
    </main>
  );
}
