import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  Boxes,
  ClipboardList,
  Eye,
  EyeOff,
  FileDown,
  LockKeyhole,
  Mail,
  Package,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";
import { authService } from "@/services/auth.service";

const LOGIN_VISUAL =
  "https://static.vecteezy.com/system/resources/thumbnails/059/230/815/small/on-a-laptop-comprehensive-dashboards-visualize-business-data-presenting-charts-and-graphs-photo.jpg";

const rotatingLines = [
  "Track every customer follow-up",
  "Keep warehouse stock accurate",
  "Confirm challans without stock risk",
  "Give each role the right access",
];

const highlights = [
  {
    icon: Users,
    title: "CRM that stays warm",
    text: "Leads, accounts and follow-ups in one place.",
  },
  {
    icon: Package,
    title: "Stock you can trust",
    text: "Live inventory with low-stock alerts.",
  },
  {
    icon: ClipboardList,
    title: "Stock-safe challans",
    text: "Confirm only when inventory is available.",
  },
  {
    icon: FileDown,
    title: "Invoice PDF export",
    text: "Download a clean tax invoice from any challan.",
  },
];

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [typedText, setTypedText] = useState("");

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ||
    "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      login(data);
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}`);
      navigate(from, { replace: true });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Login failed"));
    },
  });

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const tick = () => {
      if (cancelled) return;

      const full = rotatingLines[phraseIndex];

      if (!deleting) {
        charIndex += 1;
        setTypedText(full.slice(0, charIndex));

        if (charIndex === full.length) {
          deleting = true;
          timeoutId = window.setTimeout(tick, 1800);
          return;
        }

        timeoutId = window.setTimeout(tick, 42);
        return;
      }

      charIndex -= 1;
      setTypedText(full.slice(0, charIndex));

      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % rotatingLines.length;
        timeoutId = window.setTimeout(tick, 280);
        return;
      }

      timeoutId = window.setTimeout(tick, 24);
    };

    timeoutId = window.setTimeout(tick, 400);

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = handleSubmit((values) => {
    loginMutation.mutate(values);
  });

  return (
    <div className="grid min-h-svh lg:h-svh lg:overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden h-full overflow-hidden lg:block">
        <img
          src={LOGIN_VISUAL}
          alt="Business analytics dashboard on a laptop"
          className="absolute inset-0 size-full object-cover animate-[login-zoom_18s_ease-in-out_infinite_alternate]"
        />
        <div className="absolute inset-0 bg-[#0b1624]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071018] via-[#071018]/55 to-[#071018]/20" />

        <div className="relative flex h-full flex-col justify-between px-8 py-6 xl:px-12 xl:py-8">
          <div
            className="animate-[login-fade-up_0.7s_ease-out_both]"
            style={{ animationDelay: "80ms" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] text-slate-200 backdrop-blur-sm">
              <Boxes className="size-3 text-erp-light" />
              Wholesale operations portal
            </div>
          </div>

          <div className="max-w-xl space-y-3">
            <div
              className="animate-[login-fade-up_0.75s_ease-out_both]"
              style={{ animationDelay: "180ms" }}
            >
              <div className="flex items-center gap-2.5">
                <img
                  src="/ERPFlow_Green___White_Logo-removebg-preview.png"
                  alt="ERPFlow"
                  className="size-10 object-contain drop-shadow-md"
                />
                <p className="text-xs font-medium tracking-[0.18em] text-erp-light uppercase">
                  ERPFlow
                </p>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white xl:text-4xl">
                Run wholesale ops{" "}
                <span className="text-erp-light">without the chaos</span>
              </h1>
            </div>

            <div
              className="animate-[login-fade-up_0.75s_ease-out_both]"
              style={{ animationDelay: "320ms" }}
            >
              <p className="text-xs text-slate-300">Built for teams who need to</p>
              <div className="mt-1 min-h-[1.75rem]">
                <p className="text-lg font-semibold tracking-tight text-white xl:text-xl">
                  <span>{typedText}</span>
                  <span
                    aria-hidden
                    className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.12em] bg-erp-light align-baseline animate-[login-caret_1s_steps(1)_infinite]"
                  />
                </p>
              </div>
            </div>

            <p
              className="max-w-md text-xs leading-relaxed text-slate-300 animate-[login-fade-up_0.75s_ease-out_both]"
              style={{ animationDelay: "420ms" }}
            >
              One workspace for sales, warehouse and accounts — customers,
              inventory and challans stay connected from quote to dispatch.
            </p>

            <div
              className="pt-1 animate-[login-fade-up_0.8s_ease-out_both]"
              style={{ animationDelay: "540ms" }}
            >
              <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-erp-light/80 uppercase">
                How teams use ERPFlow
              </p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {highlights.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.title}
                      className="flex gap-2.5"
                      style={{
                        animationDelay: `${560 + index * 90}ms`,
                      }}
                    >
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-erp-light/50">
                        <Icon className="size-3 text-erp-light" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium leading-tight text-white">
                          <span className="mr-1 text-[10px] tabular-nums text-erp-light/70">
                            0{index + 1}
                          </span>
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-300">
                          {item.text}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <p
            className="text-[11px] text-slate-400 animate-[login-fade-up_0.8s_ease-out_both]"
            style={{ animationDelay: "680ms" }}
          >
            Secure role-based access for Admin, Sales, Warehouse and Accounts.
          </p>
        </div>
      </section>

      <section className="relative flex items-center justify-center bg-gradient-to-br from-[#dff3ea] via-[#e7f4ee] to-[#cfe8dc] px-4 py-8 sm:px-8 lg:h-full lg:overflow-hidden lg:py-6">
        <div className="surface-panel w-full max-w-md rounded-2xl p-5 animate-[login-fade-up_0.65s_ease-out_both] sm:p-6">
          <div className="mb-5">
            <div className="mb-4 flex items-center gap-2.5">
              <img
                src="/ERPFlow_Green___White_Logo-removebg-preview.png"
                alt="ERPFlow"
                className="size-9 object-contain"
              />
              <p className="text-sm font-semibold tracking-tight text-erp-dark">
                ERPFlow
              </p>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-erp-ink sm:text-2xl">
              Sign in
            </h2>
            <p className="mt-1 text-sm text-[#45685f]">
              Use your company email and password to continue.
            </p>
          </div>

          <form className="space-y-3.5" onSubmit={onSubmit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="bg-[#f7fcf9] pl-9"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />
              </div>
              {errors.email ? (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="size-3.5" />
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="bg-[#f7fcf9] pr-10 pl-9"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password ? (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="size-3.5" />
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            {loginMutation.isError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {getErrorMessage(loginMutation.error, "Invalid email or password")}
              </div>
            ) : null}

            <Button
              type="submit"
              className="h-10 w-full bg-erp-dark text-white hover:bg-erp-dark/90"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            Having trouble? Ask your admin to reset access.
          </p>
        </div>
      </section>
    </div>
  );
}
