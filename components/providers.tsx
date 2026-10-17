"use client";
import { useEffect, useState } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { errorMessage, setAccessToken } from "@/lib/api";
import { withBasePath } from "@/lib/paths";
function SessionBridge({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession();
  const [readyToken, setReadyToken] = useState<string | undefined>();
  useEffect(() => {
    setAccessToken(data?.accessToken);
    setReadyToken(data?.accessToken);
    if (data?.error) void signOut({ callbackUrl: withBasePath("/login") });
    return () => setAccessToken(undefined);
  }, [data?.accessToken, data?.error]);
  if (status === "authenticated" && data?.accessToken !== readyToken)
    return (
      <div className="page-loading" aria-label="Loading session">
        <div className="skeleton h-32 w-full" />
      </div>
    );
  return children;
}
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => toast.error(errorMessage(error)),
        }),
        defaultOptions: {
          queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
          mutations: { onError: (error) => toast.error(errorMessage(error)) },
        },
      }),
  );
  return (
    <SessionProvider basePath={withBasePath("/api/auth")} refetchInterval={240}>
      <QueryClientProvider client={client}>
        <SessionBridge>{children}</SessionBridge>
        <Toaster richColors position="top-right" closeButton />
      </QueryClientProvider>
    </SessionProvider>
  );
}
