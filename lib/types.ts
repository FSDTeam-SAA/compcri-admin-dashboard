export interface Media {
  _id: string;
  secureUrl: string;
}
export interface User {
  _id: string;
  email: string;
  role: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarMediaId?: Media | null;
  contactCode?: string;
  createdAt?: string;
  plan?: string;
  status?: string;
  phone?: string;
  profession?: string;
  country?: string;
  city?: string;
  interests?: string[];
}
export interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}
export interface Meta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
export interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: Meta;
}
export interface Activity {
  _id: string;
  actorId?: User | null;
  action: string;
  createdAt: string;
}
export type Period = "week" | "month" | "year";
export interface Dashboard {
  totals: { totalUsers: number; freeUsers: number; premiumUsers: number };
  userGrowth: {
    _id: { year: number; month: number; day: number };
    count: number;
    free?: number;
    premium?: number;
  }[];
  revenueByCurrency: { _id: string; amountMinor: number }[];
  recentActivity: Activity[];
}
export interface Subscriptions {
  statusCounts: { _id: string; count: number }[];
  productCounts: {
    _id: { productId: string; platform: string };
    count: number;
  }[];
  revenue: {
    _id: { currency: string; year: number; month: number };
    amountMinor: number;
  }[];
}
export interface Coupon {
  _id: string;
  name: string;
  email: string;
  avatarMediaId?: Media | null;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  commissionRate: number;
  startDate: string;
  endDate: string;
  totalUsageLimit: number;
  perUserLimit: number;
  redemptions: number;
  revenue: number;
  discountGiven: number;
  commission: number;
  status: "ACTIVE" | "EXPIRED" | "SCHEDULED";
}
export type CouponInput = Omit<
  Coupon,
  | "_id"
  | "status"
  | "redemptions"
  | "revenue"
  | "discountGiven"
  | "commission"
  | "avatarMediaId"
> & { avatarMediaId?: string };
export interface CouponStats {
  totalCoupons: number;
  totalRedemptions: number;
  discountGiven: number;
  revenue: number;
}
