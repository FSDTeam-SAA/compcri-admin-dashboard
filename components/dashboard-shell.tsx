"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  PanelsTopLeft,
  Tags,
  Settings,
  ChevronRight,
  Menu,
  LogOut,
  X,
} from "lucide-react";
import { useState } from "react";
import { getProfile } from "@/lib/api";
import { withBasePath, withoutBasePath } from "@/lib/paths";
import { Avatar, Brand } from "./shared";
import { Skeleton } from "./ui/skeleton";
const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/users", label: "Users Management", icon: Users },
  { href: "/subscriptions", label: "Subscriptions", icon: PanelsTopLeft },
  { href: "/coupons", label: "Coupon", icon: Tags },
  { href: "/settings", label: "Settings", icon: Settings },
];
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = withoutBasePath(usePathname());
  const { data: session, status } = useSession();
  const [menu, setMenu] = useState(false);
  const [account, setAccount] = useState(false);
  const client = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: status === "authenticated" && !!session?.accessToken,
  });
  const user = profile.data || session?.user;
  if (status !== "authenticated")
    return (
      <div className="page-loading">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="mt-8 h-80 w-full" />
      </div>
    );
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" aria-label="Aurox Day overview">
            <Brand />
          </Link>
          <nav
            className={menu ? "main-nav main-nav-open" : "main-nav"}
            aria-label="Main navigation"
          >
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                className={
                  pathname === href ||
                  (href !== "/" && pathname.startsWith(href))
                    ? "nav-link active"
                    : "nav-link"
                }
                key={href}
                href={href}
                onClick={() => setMenu(false)}
              >
                <Icon size={20} strokeWidth={1.7} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="account-wrapper">
            <button
              className="account-button"
              aria-expanded={account}
              onClick={() => setAccount(!account)}
            >
              <Avatar user={user} size="small" />
              <span>
                {user?.displayName ||
                  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                  "Administrator"}
              </span>
              <ChevronRight size={17} strokeWidth={1} />
            </button>
            {account && (
              <div className="account-menu">
                <Link href="/settings" onClick={() => setAccount(false)}>
                  <Settings size={17} />
                  Profile settings
                </Link>
                <button
                  onClick={async () => {
                    client.clear();
                    await signOut({ callbackUrl: withBasePath("/login") });
                  }}
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            )}
          </div>
          <button
            className="mobile-menu-button"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main className="dashboard-main">{children}</main>
    </>
  );
}
