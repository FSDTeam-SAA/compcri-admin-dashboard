"use client";
import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Trash2 } from "lucide-react";
import {
  getUsers,
  getDashboard,
  getUser,
  changeUserStatus,
  deleteUser,
} from "@/lib/api";
import { date, titleCase } from "@/lib/utils";
import type { User } from "@/lib/types";
import {
  Avatar,
  StatCard,
  SearchInput,
  useDebouncedValue,
  StatusBadge,
  PlanBadge,
  Pagination,
  ErrorState,
  EmptyState,
  TableSkeleton,
  DetailSkeleton,
  ConfirmDialog,
  Pending,
  Field,
} from "./shared";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Select } from "./ui/select";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./ui/table";
export function UsersPage() {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search);
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [reason, setReason] = useState("");
  const client = useQueryClient();
  const users = useQuery({
    queryKey: ["users", page, debounced, plan, status],
    queryFn: () =>
      getUsers({
        page,
        limit: 8,
        search: debounced || undefined,
        plan: plan === "all" ? undefined : plan,
        status: status === "all" ? undefined : status,
      }),
    placeholderData: keepPreviousData,
  });
  const stats = useQuery({
    queryKey: ["dashboard", "year"],
    queryFn: () => getDashboard("year"),
  });
  const remove = useMutation({
    mutationFn: () => deleteUser(deleting!._id, reason),
    onSuccess: () => {
      toast.success("User deletion scheduled");
      setDeleting(null);
      setReason("");
      setPage(1);
      client.invalidateQueries({ queryKey: ["users"] });
      client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  function filter(fn: () => void) {
    setPage(1);
    fn();
  }
  return (
    <>
      <div className="stats-grid stats-three">
        <StatCard
          label="Total Users"
          value={stats.data?.totals.totalUsers ?? "—"}
          loading={stats.isPending}
        />
        <StatCard
          label="Total Free Users"
          value={stats.data?.totals.freeUsers ?? "—"}
          color="cyan"
          loading={stats.isPending}
        />
        <StatCard
          label="Total Premium Users"
          value={stats.data?.totals.premiumUsers ?? "—"}
          color="green"
          loading={stats.isPending}
        />
      </div>
      <div className="table-toolbar">
        <SearchInput
          value={search}
          onChange={(v) => filter(() => setSearch(v))}
        />
        <div className="toolbar-filters">
          <Select
            label="Filter by plan"
            value={plan}
            onValueChange={(v) => filter(() => setPlan(v))}
            options={[
              { value: "all", label: "All Plans" },
              { value: "FREE", label: "Free" },
              { value: "PREMIUM", label: "Premium" },
            ]}
          />
          <Select
            label="Filter by user status"
            value={status}
            onValueChange={(v) => filter(() => setStatus(v))}
            options={[
              { value: "all", label: "All Status" },
              { value: "ACTIVE", label: "Active" },
              { value: "SUSPENDED", label: "Suspended" },
              { value: "PENDING_DELETION", label: "Pending deletion" },
              { value: "DELETED", label: "Deleted" },
            ]}
          />
        </div>
      </div>
      <section className="table-panel users-table" aria-label="Users">
        {users.isPending ? (
          <TableSkeleton />
        ) : users.isError ? (
          <ErrorState retry={() => users.refetch()} />
        ) : !users.data?.data.length ? (
          <EmptyState message="No users found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "User Name",
                  "Join Date",
                  "Email",
                  "Subscription Status",
                  "Status",
                  "Action",
                ].map((label) => (
                  <TableHead key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data.data.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="user-cell">
                      <Avatar user={user} />
                      <div>
                        <p>{user.displayName || user.email.split("@")[0]}</p>
                        <small>Code : {user.contactCode || "—"}</small>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{date(user.createdAt)}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <PlanBadge plan={user.plan} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell>
                    <div className="row-actions">
                      <button
                        className="action-view"
                        aria-label={`View ${user.displayName || user.email}`}
                        onClick={() => setSelected(user._id)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="action-delete"
                        aria-label={`Delete ${user.displayName || user.email}`}
                        disabled={
                          user.status === "DELETED" ||
                          user.status === "PENDING_DELETION"
                        }
                        onClick={() => {
                          setDeleting(user);
                          setReason("");
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
      <Pagination
        meta={users.data?.meta}
        onPage={setPage}
        fetching={users.isFetching}
      />
      <UserDetail id={selected} onClose={() => setSelected(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete user?"
        description={`Schedule deletion for ${deleting?.displayName || deleting?.email || "this user"}. Access will be revoked immediately; account data is removed after the configured grace period.`}
        pending={remove.isPending}
        onConfirm={() => {
          if (reason.trim().length < 3) {
            toast.error("Please enter a reason of at least 3 characters.");
            return;
          }
          remove.mutate();
        }}
        label="Schedule deletion"
      >
        <Field label="Reason for deletion" id="deletion-reason">
          <Input
            id="deletion-reason"
            value={reason}
            minLength={3}
            maxLength={300}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter a reason"
          />
        </Field>
      </ConfirmDialog>
    </>
  );
}
function UserDetail({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const detail = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser(id!),
    enabled: !!id,
  });
  const user = detail.data?.user;
  const change = useMutation({
    mutationFn: () =>
      changeUserStatus(
        id!,
        user?.status === "SUSPENDED" ? "UNBLOCK" : "SUSPEND",
      ),
    onSuccess: () => {
      toast.success(
        user?.status === "SUSPENDED" ? "User unblocked" : "User suspended",
      );
      client.invalidateQueries({ queryKey: ["users"] });
      client.invalidateQueries({ queryKey: ["user", id] });
    },
  });
  return (
    <Dialog
      open={!!id}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="detail-dialog">
        <DialogTitle className="sr-only">User details</DialogTitle>
        <DialogDescription className="sr-only">
          User profile and account access controls
        </DialogDescription>
        {detail.isPending ? (
          <DetailSkeleton />
        ) : detail.isError ? (
          <ErrorState retry={() => detail.refetch()} />
        ) : (
          user && (
            <>
              <div className="detail-avatar">
                <Avatar user={user} size="large" />
              </div>
              <div className="detail-banner">
                <div>
                  <small>Active Status</small>
                  <p>{titleCase(user.status)}</p>
                </div>
                <div>
                  <small>Subscription Status</small>
                  <p>
                    {user.plan === "FREE"
                      ? "Free"
                      : /year|annual/i.test(
                            detail.data.subscription?.productId || "",
                          )
                        ? "Premium Year"
                        : "Premium Month"}
                  </p>
                </div>
              </div>
              <dl className="detail-rows">
                {[
                  ["Join Date", date(user.createdAt)],
                  ["Code", user.contactCode],
                  ["Name", user.displayName],
                  ["Email", user.email],
                  ["Phone Number or Whatsapp", user.phone],
                  ["Profession", user.profession],
                  ["Country", user.country],
                  ["City", user.city],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value || "—"}</dd>
                  </div>
                ))}
                <div>
                  <dt>Interest</dt>
                  <dd className="interest-tags">
                    {user.interests?.length
                      ? user.interests.map((item) => (
                          <span key={item}>{item}</span>
                        ))
                      : "—"}
                  </dd>
                </div>
              </dl>
              {(user.status === "ACTIVE" || user.status === "SUSPENDED") && (
                <Button
                  className={
                    user.status === "SUSPENDED"
                      ? "unblock-button"
                      : "suspend-button"
                  }
                  variant={
                    user.status === "SUSPENDED" ? "outline" : "destructive"
                  }
                  disabled={change.isPending}
                  onClick={() => change.mutate()}
                >
                  <Pending pending={change.isPending}>
                    {user.status === "SUSPENDED" ? "Unblock" : "Suspend"}
                  </Pending>
                </Button>
              )}
            </>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
