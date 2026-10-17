"use client";
import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Trash2, ImageUp } from "lucide-react";
import {
  getCoupons,
  getCoupon,
  getCouponStats,
  createCoupon,
  deleteCoupon,
  uploadPhoto,
} from "@/lib/api";
import { date, money, titleCase } from "@/lib/utils";
import type { Coupon, CouponInput } from "@/lib/types";
import {
  Avatar,
  StatCard,
  SearchInput,
  useDebouncedValue,
  StatusBadge,
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
export function CouponsPage() {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const client = useQueryClient();
  const coupons = useQuery({
    queryKey: ["coupons", page, debounced, status],
    queryFn: () =>
      getCoupons({
        page,
        limit: 9,
        search: debounced || undefined,
        status: status === "all" ? undefined : status,
      }),
    placeholderData: keepPreviousData,
  });
  const stats = useQuery({
    queryKey: ["coupon-stats"],
    queryFn: getCouponStats,
  });
  const remove = useMutation({
    mutationFn: () => deleteCoupon(deleting!._id),
    onSuccess: () => {
      toast.success("Coupon deleted");
      setDeleting(null);
      setPage(1);
      client.invalidateQueries({ queryKey: ["coupons"] });
      client.invalidateQueries({ queryKey: ["coupon-stats"] });
    },
  });
  return (
    <>
      <div className="stats-grid stats-four">
        <StatCard
          label="Total Coupons"
          value={stats.data?.totalCoupons ?? "—"}
          icon="coupons"
          color="orange"
          loading={stats.isPending}
        />
        <StatCard
          label="Total Redemptions"
          value={stats.data?.totalRedemptions ?? "—"}
          color="blue"
          loading={stats.isPending}
        />
        <StatCard
          label="Discount Given"
          value={stats.data ? money(stats.data.discountGiven) : "—"}
          icon="discount"
          color="lime"
          loading={stats.isPending}
        />
        <StatCard
          label="Revenue Generated"
          value={stats.data ? money(stats.data.revenue) : "—"}
          icon="earnings"
          color="pink"
          loading={stats.isPending}
        />
      </div>
      <div className="table-toolbar coupon-toolbar">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <div className="toolbar-filters">
          <Select
            label="Filter coupon status"
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: "all", label: "All Status" },
              { value: "ACTIVE", label: "Active" },
              { value: "EXPIRED", label: "Expired" },
              { value: "SCHEDULED", label: "Scheduled" },
            ]}
          />
          <Button onClick={() => setAdding(true)}>Add Influencer</Button>
        </div>
      </div>
      <section className="table-panel coupon-table" aria-label="Coupons">
        {coupons.isPending ? (
          <TableSkeleton columns={9} rows={9} />
        ) : coupons.isError ? (
          <ErrorState retry={() => coupons.refetch()} />
        ) : !coupons.data?.data.length ? (
          <EmptyState
            message="No coupons found"
            hint="Add an influencer to create your first coupon."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Coupon Code",
                  "Influencer Name",
                  "Discount",
                  "Redemptions",
                  "Expiry Date",
                  "Revenue",
                  "Commission",
                  "Status",
                  "Action",
                ].map((label) => (
                  <TableHead key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.data.data.map((coupon) => (
                <TableRow key={coupon._id}>
                  <TableCell>{coupon.code}</TableCell>
                  <TableCell>
                    <div className="user-cell">
                      <Avatar
                        user={{
                          displayName: coupon.name,
                          avatarMediaId: coupon.avatarMediaId,
                        }}
                        size="small"
                      />
                      <p>{coupon.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="discount-badge">
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}%`
                        : money(coupon.discountValue)}{" "}
                      Off
                    </span>
                  </TableCell>
                  <TableCell>
                    {coupon.redemptions}/{coupon.totalUsageLimit}
                  </TableCell>
                  <TableCell>{date(coupon.endDate)}</TableCell>
                  <TableCell>{money(coupon.revenue)}</TableCell>
                  <TableCell>{money(coupon.commission)}</TableCell>
                  <TableCell>
                    <StatusBadge status={coupon.status} />
                  </TableCell>
                  <TableCell>
                    <div className="row-actions">
                      <button
                        className="action-view"
                        aria-label={`View coupon ${coupon.code}`}
                        onClick={() => setSelected(coupon._id)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="action-delete"
                        aria-label={`Delete coupon ${coupon.code}`}
                        onClick={() => setDeleting(coupon)}
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
        meta={coupons.data?.meta}
        onPage={setPage}
        fetching={coupons.isFetching}
      />
      <CouponDetail id={selected} onClose={() => setSelected(null)} />
      <AddInfluencer
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={() => setPage(1)}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete coupon?"
        description={`Delete coupon ${deleting?.code || ""} for ${deleting?.name || "this influencer"}? This cannot be undone.`}
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}
function CouponDetail({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const detail = useQuery({
    queryKey: ["coupon", id],
    queryFn: () => getCoupon(id!),
    enabled: !!id,
  });
  const c = detail.data;
  return (
    <Dialog
      open={!!id}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="detail-dialog coupon-detail">
        <DialogTitle className="sr-only">Coupon details</DialogTitle>
        <DialogDescription className="sr-only">
          Influencer information and coupon performance
        </DialogDescription>
        {detail.isPending ? (
          <DetailSkeleton />
        ) : detail.isError ? (
          <ErrorState retry={() => detail.refetch()} />
        ) : (
          c && (
            <>
              <div className="detail-avatar">
                <Avatar
                  user={{ displayName: c.name, avatarMediaId: c.avatarMediaId }}
                  size="large"
                />
              </div>
              <div className="detail-banner">
                <div>
                  <small>Active Status</small>
                  <p>{titleCase(c.status)}</p>
                </div>
                <div>
                  <small>Redemptions</small>
                  <p>
                    {c.redemptions}/{c.totalUsageLimit}
                  </p>
                </div>
              </div>
              <dl className="detail-rows">
                {[
                  ["Name", c.name],
                  ["Email", c.email],
                  ["Coupon Code", c.code],
                  [
                    "Discount Type",
                    c.discountType === "PERCENTAGE"
                      ? "Percentage(%)"
                      : "Fixed amount",
                  ],
                  [
                    "Discount Value",
                    c.discountType === "PERCENTAGE"
                      ? `${c.discountValue}%`
                      : money(c.discountValue),
                  ],
                  ["Start Date", date(c.startDate)],
                  ["End Date", date(c.endDate)],
                  ["Total Usage Limit", c.totalUsageLimit],
                  ["Per User Limit", c.perUserLimit],
                  ["Commission Rate( %)", `${c.commissionRate}%`],
                  ["Revenue", money(c.revenue)],
                  ["Commission", money(c.commission)],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <div
                className={`coupon-status-bar ${c.status === "ACTIVE" ? "active" : c.status === "SCHEDULED" ? "scheduled" : "expired"}`}
              >
                {titleCase(c.status)}
              </div>
            </>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
const blank: CouponInput = {
  name: "",
  email: "",
  code: "",
  discountType: "PERCENTAGE",
  discountValue: 0,
  commissionRate: 0,
  startDate: "",
  endDate: "",
  totalUsageLimit: 500,
  perUserLimit: 1,
};
function AddInfluencer({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CouponInput>(blank);
  const [photo, setPhoto] = useState<File | null>(null);
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: async () => {
      let avatarMediaId: string | undefined;
      if (photo) avatarMediaId = (await uploadPhoto(photo))._id;
      return createCoupon({
        ...form,
        avatarMediaId,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate + "T23:59:59").toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Influencer and coupon created");
      client.invalidateQueries({ queryKey: ["coupons"] });
      client.invalidateQueries({ queryKey: ["coupon-stats"] });
      setForm(blank);
      setPhoto(null);
      onSaved();
      onClose();
    },
  });
  function update<K extends keyof CouponInput>(key: K, value: CouponInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error("End date must be on or after the start date.");
      return;
    }
    if (form.discountType === "PERCENTAGE" && form.discountValue > 100) {
      toast.error("Percentage discounts cannot exceed 100%.");
      return;
    }
    if (form.perUserLimit > form.totalUsageLimit) {
      toast.error("Per user limit cannot exceed total usage limit.");
      return;
    }
    save.mutate();
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !save.isPending) onClose();
      }}
    >
      <DialogContent className="influencer-dialog">
        <DialogTitle>Add New Influencer</DialogTitle>
        <DialogDescription className="sr-only">
          Create an influencer and configure their discount coupon.
        </DialogDescription>
        <form onSubmit={submit}>
          <h3>Influencer Basic Information</h3>
          <Field label="Influencer Photo" id="influencer-photo">
            <label className="photo-dropzone" htmlFor="influencer-photo">
              <ImageUp size={24} />
              <span>{photo ? photo.name : "JPG, PNG · tap to browse"}</span>
              <input
                id="influencer-photo"
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size > 5 * 1024 * 1024) {
                    toast.error("Choose a photo smaller than 5 MB.");
                    return;
                  }
                  setPhoto(file || null);
                }}
              />
            </label>
          </Field>
          <div className="form-grid">
            <Field label="Influencer Name" id="influencer-name">
              <Input
                id="influencer-name"
                placeholder="Influencer Name"
                value={form.name}
                required
                maxLength={100}
                onChange={(e) => update("name", e.target.value)}
              />
            </Field>
            <Field label="Influencer Email" id="influencer-email">
              <Input
                id="influencer-email"
                type="email"
                placeholder="Influencer Email"
                value={form.email}
                required
                onChange={(e) => update("email", e.target.value)}
              />
            </Field>
          </div>
          <h3 className="coupon-config-heading">
            Discount Coupon Code Configuration
          </h3>
          <div className="form-grid">
            <Field label="Coupon Code" id="coupon-code">
              <Input
                id="coupon-code"
                placeholder="e.g. SARAH20"
                value={form.code}
                required
                minLength={3}
                pattern="[A-Za-z0-9_-]+"
                maxLength={50}
                onChange={(e) => update("code", e.target.value)}
              />
            </Field>
            <Field label="Influencer Commission" id="commission">
              <Input
                id="commission"
                type="number"
                placeholder="10%"
                min={0}
                max={100}
                step=".01"
                value={form.commissionRate || ""}
                required
                onChange={(e) =>
                  update("commissionRate", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Discount Type" id="discount-type">
              <select
                id="discount-type"
                className="input"
                value={form.discountType}
                onChange={(e) =>
                  update(
                    "discountType",
                    e.target.value as CouponInput["discountType"],
                  )
                }
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed amount ($)</option>
              </select>
            </Field>
            <Field label="Discount Value" id="discount-value">
              <Input
                id="discount-value"
                type="number"
                min=".01"
                max={form.discountType === "PERCENTAGE" ? 100 : undefined}
                step=".01"
                placeholder="e.g. 10%"
                value={form.discountValue || ""}
                required
                onChange={(e) =>
                  update("discountValue", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Start Date" id="start-date">
              <Input
                id="start-date"
                type="date"
                value={form.startDate}
                required
                onChange={(e) => update("startDate", e.target.value)}
              />
            </Field>
            <Field label="End Date" id="end-date">
              <Input
                id="end-date"
                type="date"
                min={form.startDate || undefined}
                value={form.endDate}
                required
                onChange={(e) => update("endDate", e.target.value)}
              />
            </Field>
            <Field label="Total Usage Limit" id="usage-limit">
              <Input
                id="usage-limit"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 500"
                value={form.totalUsageLimit}
                required
                onChange={(e) =>
                  update("totalUsageLimit", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Per User Limit" id="per-user">
              <Input
                id="per-user"
                type="number"
                min={1}
                max={form.totalUsageLimit}
                step={1}
                placeholder="e.g. 1"
                value={form.perUserLimit}
                required
                onChange={(e) => update("perUserLimit", Number(e.target.value))}
              />
            </Field>
          </div>
          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={save.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              <Pending pending={save.isPending}>Save</Pending>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
