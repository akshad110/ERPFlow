import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { AppRouter } from "@/routes/AppRouter";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
        <Toaster richColors position="top-right" closeButton={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
