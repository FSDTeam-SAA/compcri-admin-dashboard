"use client";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Users,
  TicketPercent,
  ShoppingCart,
  Search,
  Eye,
  EyeOff,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Meta, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/paths";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
export function Brand({ large = false }: { large?: boolean }) {
  return (
    <img
      src={withBasePath("/logo.png")}
      alt="Aurox Day"
      className={large ? "brand brand-large" : "brand"}
    />
  );
}
export function Avatar({
  user,
  size = "normal",
}: {
  user?: Pick<User, "displayName" | "avatarMediaId">;
  size?: "small" | "normal" | "large";
}) {
  const name = user?.displayName || "Admin";
  return user?.avatarMediaId?.secureUrl ? (
    <img
      src={user.avatarMediaId.secureUrl}
      alt={name}
      className={`avatar avatar-${size}`}
    />
  ) : (
    <span className={`avatar avatar-${size} avatar-fallback`} aria-label={name}>
      {name
        .split(" ")
        .map((x) => x[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );
}
const icons: Record<string, LucideIcon> = {
  earnings: DollarSign,
  users: Users,
  coupons: TicketPercent,
  discount: ShoppingCart,
};
export function StatCard({
  label,
  value,
  color = "purple",
  icon = "users",
  loading = false,
}: {
  label: string;
  value: string | number;
  color?: string;
  icon?: string;
  loading?: boolean;
}) {
  const Icon = icons[icon] || Users;
  return (
    <div className={`stat-card stat-${color}`}>
      <span className="stat-icon">
        <Icon size={21} strokeWidth={1.6} />
      </span>
      <div className="stat-value">
        {loading ? <Skeleton className="h-7 w-24" /> : value}
      </div>
      <p>{label}</p>
      <svg className="sparkline" viewBox="0 0 108 68" aria-hidden="true">
        <path
          d="M1 67 Q14 39 28 48 T49 37 T71 28 T107 1 L107 67Z"
          fill="currentColor"
          fillOpacity=".1"
        />
        <path
          d="M1 67 Q14 39 28 48 T49 37 T71 28 T107 1"
          fill="none"
          stroke="currentColor"
          strokeWidth=".9"
        />
      </svg>
    </div>
  );
}
export function Pagination({
  meta,
  onPage,
  fetching = false,
  compact = false,
}: {
  meta?: Meta;
  onPage: (page: number) => void;
  fetching?: boolean;
  compact?: boolean;
}) {
  if (!meta) return null;
  const { page, pages, limit, total } = meta;
  const pageNumbers = [
    ...new Set([
      1,
      ...(page > 2 ? [page - 1] : []),
      page,
      ...(page < pages ? [page + 1] : []),
      ...(page === 1 && pages > 2 ? [3] : []),
      pages,
    ]),
  ]
    .filter((n) => n > 0 && n <= pages)
    .sort((a, b) => a - b);
  return (
    <div className={cn("pagination", compact && "pagination-compact")}>
      <p>
        {total
          ? `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, total)} of ${total} results`
          : "Showing 0 results"}
      </p>
      <nav aria-label="Pagination">
        <button
          aria-label="Previous page"
          disabled={page <= 1 || fetching}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft size={20} />
        </button>
        {pageNumbers.map((n, i) => (
          <span className="page-group" key={n}>
            {i > 0 && n - pageNumbers[i - 1] > 1 && (
              <span className="page-ellipsis">…</span>
            )}
            <button
              aria-label={`Page ${n}`}
              aria-current={n === page ? "page" : undefined}
              className={n === page ? "active" : ""}
              disabled={fetching}
              onClick={() => onPage(n)}
            >
              {n}
            </button>
          </span>
        ))}
        <button
          aria-label="Next page"
          disabled={page >= pages || fetching}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight size={20} />
        </button>
      </nav>
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="search-box">
      <Search size={20} strokeWidth={1.4} />
      <Input
        aria-label="Search users or coupons"
        placeholder="Search user..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
export function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}
export function StatusBadge({ status = "ACTIVE" }: { status?: string }) {
  return (
    <span
      className={cn(
        "status-badge",
        status === "ACTIVE"
          ? "status-active"
          : status === "SCHEDULED"
            ? "status-scheduled"
            : "status-inactive",
      )}
    >
      {status
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^\w/, (c) => c.toUpperCase())}
    </span>
  );
}
export function PlanBadge({
  plan = "FREE",
  product,
}: {
  plan?: string;
  product?: string;
}) {
  const annual = /year|annual/i.test(product || "");
  return (
    <span
      className={cn(
        "plan-badge",
        plan === "FREE" ? "plan-free" : annual ? "plan-year" : "plan-month",
      )}
    >
      •&nbsp;{" "}
      {plan === "FREE"
        ? "Free"
        : annual
          ? "Premium Year"
          : product
            ? "Premium Month"
            : "Premium"}
    </span>
  );
}
export function PasswordInput({
  id,
  ...props
}: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <Input id={id} type={visible ? "text" : "password"} {...props} />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <Eye size={22} /> : <EyeOff size={22} />}
      </button>
    </div>
  );
}
export function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}
export function Pending({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending: boolean;
}) {
  return (
    <>
      {pending && <LoaderCircle size={17} className="animate-spin" />}
      {children}
    </>
  );
}
export function ErrorState({
  retry,
  message = "We couldn’t load this information.",
}: {
  retry: () => void;
  message?: string;
}) {
  return (
    <div className="empty-state" role="alert">
      <AlertCircle size={28} />
      <p>{message}</p>
      <Button variant="outline" size="sm" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
export function EmptyState({
  message = "No results found",
  hint = "Try a different search or filter.",
}: {
  message?: string;
  hint?: string;
}) {
  return (
    <div className="empty-state">
      <Search size={28} strokeWidth={1.3} />
      <p>{message}</p>
      <span>{hint}</span>
    </div>
  );
}
export function TableSkeleton({
  columns = 6,
  rows = 8,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="table-skeleton" aria-label="Loading results" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ gridTemplateColumns: `repeat(${columns},1fr)` }}>
          {Array.from({ length: columns }, (_, j) => (
            <Skeleton className="h-5 w-4/5" key={j} />
          ))}
        </div>
      ))}
    </div>
  );
}
export function DetailSkeleton() {
  return (
    <div className="detail-loading" role="status" aria-label="Loading details">
      <Skeleton className="mx-auto h-20 w-20 rounded-full" />
      <Skeleton className="h-12 w-full" />
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-5 w-full" />
      ))}
    </div>
  );
}
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onConfirm,
  pending,
  label = "Delete",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children?: React.ReactNode;
  onConfirm: () => void;
  pending: boolean;
  label?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="confirm-dialog">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        {children}
        <div className="form-actions">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            <Pending pending={pending}>{label}</Pending>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
