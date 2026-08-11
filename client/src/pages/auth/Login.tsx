import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Boxes, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";
import { authService } from "@/services/auth.service";

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

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

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = handleSubmit((values) => {
    loginMutation.mutate(values);
  });

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#15202b] text-white lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #0f766e 0%, transparent 42%), radial-gradient(circle at 80% 0%, #334155 0%, transparent 35%), linear-gradient(135deg, transparent 0%, transparent 46%, rgba(255,255,255,0.04) 46%, rgba(255,255,255,0.04) 47%, transparent 47%)",
          }}
        />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            <Boxes className="size-3.5 text-teal-300" />
            Wholesale operations
          </div>
          <h1 className="mt-8 max-w-md text-4xl font-semibold tracking-tight xl:text-5xl">
            ERPFlow
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300 xl:text-base">
            One place for your sales, warehouse and accounts teams to track
            customers, stock and challans without spreadsheet chaos.
          </p>
        </div>

        <div className="relative grid gap-3 text-sm text-slate-300">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium text-white">Stock-safe challans</p>
            <p className="mt-1 text-slate-400">
              Confirm only when inventory is available. No negative stock.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium text-white">Role-based access</p>
            <p className="mt-1 text-slate-400">
              Admin, Sales, Warehouse and Accounts each see what they need.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-[#f3f5f7] px-4 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 lg:hidden">
            <p className="text-xl font-semibold text-slate-900">ERPFlow</p>
            <p className="text-sm text-slate-500">Operations Portal</p>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Sign in
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Use your company email and password to continue.
            </p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="bg-white pl-9"
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
                  className="bg-white pr-10 pl-9"
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
              className="h-10 w-full bg-teal-700 text-white hover:bg-teal-800"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-700">Test logins</p>
            <p className="mt-1">admin@erpflow.com / Admin@123</p>
            <p>sales@erpflow.com / Admin@123</p>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Having trouble? Ask your admin to reset access.{" "}
            <Link to="/login" className="text-teal-700 hover:underline">
              Retry
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
