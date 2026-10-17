"use client";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getActivity, getDashboard, getSubscriptions } from "@/lib/api";
import type { Period } from "@/lib/types";
import { money, titleCase } from "@/lib/utils";
import { Avatar, StatCard, EmptyState, ErrorState, Pagination } from "./shared";
import { Skeleton } from "./ui/skeleton";
import { Select } from "./ui/select";
import { ChartHeader, EarningsChart, GrowthChart } from "./charts";
export function Overview({
  subscriptionsOnly = false,
}: {
  subscriptionsOnly?: boolean;
}) {
  const [growthPeriod, setGrowthPeriod] = useState<Period>("year");
  const [earningsPeriod, setEarningsPeriod] = useState<Period>("year");
  const [activityPage, setActivityPage] = useState(1);
  const [chosenCurrency, setCurrency] = useState("");
  const dashboard = useQuery({
    queryKey: ["dashboard", growthPeriod],
    queryFn: () => getDashboard(growthPeriod),
  });
  const subscriptions = useQuery({
    queryKey: ["subscriptions", earningsPeriod],
    queryFn: () => getSubscriptions(earningsPeriod),
  });
  const activity = useQuery({
    queryKey: ["activity", activityPage],
    queryFn: () => getActivity(activityPage),
    enabled: !subscriptionsOnly,
    placeholderData: keepPreviousData,
  });
  const currencies = [
    ...new Set(
      subscriptions.data?.revenue.map((row) => row._id.currency) || [],
    ),
  ];
  const currency = currencies.includes(chosenCurrency)
    ? chosenCurrency
    : currencies[0] || "USD";
  const earnings =
    subscriptions.data?.revenue
      .filter((row) => row._id.currency === currency)
      .reduce((sum, row) => sum + row.amountMinor / 100, 0) || 0;
  const totals = dashboard.data?.totals;
  const stats = (
    <div
      className={`stats-grid ${subscriptionsOnly ? "stats-three" : "stats-four"}`}
    >
      <StatCard
        label="Total Earnings"
        value={money(earnings, currency)}
        icon="earnings"
        color="pink"
        loading={subscriptions.isPending}
      />
      {!subscriptionsOnly && (
        <StatCard
          label="Total Users"
          value={totals?.totalUsers ?? "—"}
          loading={dashboard.isPending}
        />
      )}
      <StatCard
        label={subscriptionsOnly ? "Active Subscriptions" : "Total Free Users"}
        value={
          subscriptionsOnly
            ? (subscriptions.data?.statusCounts
                .filter((row) => row._id === "ACTIVE")
                .reduce((sum, row) => sum + row.count, 0) ?? "—")
            : (totals?.freeUsers ?? "—")
        }
        color={subscriptionsOnly ? "green" : "cyan"}
        loading={
          subscriptionsOnly ? subscriptions.isPending : dashboard.isPending
        }
      />
      <StatCard
        label="Total Premium Users"
        value={totals?.premiumUsers ?? "—"}
        color="green"
        loading={dashboard.isPending}
      />
    </div>
  );
  const earningsPanel = (
    <section className="panel earnings-panel">
      <ChartHeader
        title="Earning Overview"
        period={earningsPeriod}
        onPeriod={setEarningsPeriod}
      >
        {currencies.length > 1 && (
          <Select
            label="Earnings currency"
            value={currency}
            onValueChange={setCurrency}
            options={currencies.map((c) => ({ value: c, label: c }))}
          />
        )}
      </ChartHeader>
      {subscriptions.isError ? (
        <ErrorState retry={() => subscriptions.refetch()} />
      ) : (
        <EarningsChart
          data={subscriptions.data?.revenue}
          currency={currency}
          loading={subscriptions.isPending}
        />
      )}
    </section>
  );
  if (subscriptionsOnly)
    return (
      <div className="subscriptions-page">
        {stats}
        {earningsPanel}
      </div>
    );
  return (
    <>
      {stats}
      <div className="overview-grid">
        <div className="overview-charts">
          <section className="panel growth-panel">
            <ChartHeader
              title="Users Overview (Free vs Premium)"
              period={growthPeriod}
              onPeriod={setGrowthPeriod}
            />
            {dashboard.isError ? (
              <ErrorState retry={() => dashboard.refetch()} />
            ) : (
              <GrowthChart
                data={dashboard.data?.userGrowth}
                period={growthPeriod}
                loading={dashboard.isPending}
              />
            )}
          </section>
          {earningsPanel}
        </div>
        <aside className="panel activity-panel">
          <h2>Recent Activity</h2>
          {activity.isPending ? (
            <div className="activity-list">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : activity.isError ? (
            <ErrorState retry={() => activity.refetch()} />
          ) : !activity.data?.data.length ? (
            <EmptyState
              message="No recent activity"
              hint="Account activity will appear here."
            />
          ) : (
            <div className="activity-list">
              {activity.data.data.map((item) => (
                <div className="activity-item" key={item._id}>
                  <Avatar user={item.actorId || undefined} />
                  <div className="activity-person">
                    <p>
                      {item.actorId?.displayName ||
                        item.actorId?.email ||
                        "System"}
                    </p>
                    <span>Code : {item.actorId?.contactCode || "—"}</span>
                  </div>
                  <div className="activity-event">
                    <p>
                      {titleCase(item.action.replace(/^(USER_|ADMIN_)/, ""))}
                    </p>
                    <time dateTime={item.createdAt}>
                      {relativeTime(item.createdAt)}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination
            compact
            meta={activity.data?.meta}
            onPage={setActivityPage}
            fetching={activity.isFetching}
          />
        </aside>
      </div>
    </>
  );
}
function relativeTime(value: string) {
  const mins = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  return mins < 1
    ? "Just now"
    : mins < 60
      ? `${mins} minutes ago`
      : mins < 1440
        ? `${Math.floor(mins / 60)} hours ago`
        : `${Math.floor(mins / 1440)} days ago`;
}
