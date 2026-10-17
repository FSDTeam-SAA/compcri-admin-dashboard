import axios from "axios";
import { withBasePath } from "./paths";
import type {
  AuthPayload,
  Envelope,
  User,
  Dashboard,
  Period,
  Subscriptions,
  Activity,
  Coupon,
  CouponInput,
  CouponStats,
  Media,
} from "./types";
export const baseURL = (
  process.env.NEXTPUBLICBASEURL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:5000/api/v1"
).replace(/\/$/, "");
export const api = axios.create({ baseURL, timeout: 20000 });
let sessionToken: string | undefined;
export function setAccessToken(token?: string) {
  sessionToken = token;
}
api.interceptors.request.use(async (config) => {
  if (!sessionToken && typeof window !== "undefined") {
    const { getSession } = await import("next-auth/react");
    sessionToken = (await getSession())?.accessToken;
  }
  if (sessionToken) config.headers.Authorization = `Bearer ${sessionToken}`;
  return config;
});
let sessionRefresh: Promise<import("next-auth").Session | null> | undefined;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as
      | (import("axios").InternalAxiosRequestConfig & { retried?: boolean })
      | undefined;
    if (
      error.response?.status !== 401 ||
      error.response?.data?.error?.code !== "INVALID_TOKEN" ||
      !config ||
      config.retried
    )
      return Promise.reject(error);
    config.retried = true;
    const { getSession, signOut } = await import("next-auth/react");
    sessionRefresh ||= getSession().finally(() => {
      sessionRefresh = undefined;
    });
    const session = await sessionRefresh;
    if (session?.accessToken && !session.error) {
      setAccessToken(session.accessToken);
      config.headers.Authorization = `Bearer ${session.accessToken}`;
      return api(config);
    }
    setAccessToken(undefined);
    void signOut({ callbackUrl: withBasePath("/login") });
    return Promise.reject(error);
  },
);
export const errorMessage = (error: unknown) =>
  axios.isAxiosError(error)
    ? error.response?.data?.error?.message ||
      (error.code === "ERR_NETWORK"
        ? "Cannot reach the server. Please try again."
        : error.message)
    : error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.";
const authApi = axios.create({ baseURL, timeout: 20000 });
export const login = async (email: string, password: string) =>
  (
    await authApi.post<Envelope<AuthPayload>>("/auth/login", {
      email,
      password,
    })
  ).data.data;
export const refreshAccessToken = async (refreshToken: string) =>
  (await authApi.post<Envelope<AuthPayload>>("/auth/refresh", { refreshToken }))
    .data.data;
export const logout = async (refreshToken: string) => {
  await authApi.post("/auth/logout", { refreshToken });
};
export const forgotPassword = async (email: string) =>
  (await authApi.post("/auth/forgot-password", { email })).data;
export const verifyResetOtp = async (email: string, code: string) =>
  (
    await authApi.post<Envelope<{ resetToken: string }>>(
      "/auth/verify-reset-otp",
      { email, code },
    )
  ).data.data;
export const resetPassword = async (resetToken: string, password: string) =>
  (await authApi.post("/auth/reset-password", { resetToken, password })).data;
export const getDashboard = async (period: Period) =>
  (
    await api.get<Envelope<Dashboard>>("/admin/dashboard", {
      params: { period },
    })
  ).data.data;
export const getUsers = async (params: {
  page: number;
  limit: number;
  search?: string;
  plan?: string;
  status?: string;
}) => (await api.get<Envelope<User[]>>("/admin/users", { params })).data;
export const getUser = async (id: string) =>
  (
    await api.get<
      Envelope<{ user: User; subscription?: { productId?: string } }>
    >(`/admin/users/${id}`)
  ).data.data;
export const changeUserStatus = async (
  id: string,
  action: "SUSPEND" | "UNBLOCK",
) => (await api.patch(`/admin/users/${id}/status`, { action })).data;
export const deleteUser = async (id: string, reason: string) =>
  (await api.delete(`/admin/users/${id}`, { data: { reason } })).data;
export const getSubscriptions = async (period: Period) =>
  (
    await api.get<Envelope<Subscriptions>>("/admin/subscriptions", {
      params: { period },
    })
  ).data.data;
export const getActivity = async (page: number) =>
  (
    await api.get<Envelope<Activity[]>>("/admin/audit-logs", {
      params: { page, limit: 10 },
    })
  ).data;
export const getProfile = async () =>
  (await api.get<Envelope<{ user: User }>>("/admin/profile")).data.data.user;
export const updateProfile = async (input: {
  firstName: string;
  lastName: string;
  displayName: string;
  avatarMediaId?: string;
}) => (await api.patch<Envelope<User>>("/admin/profile", input)).data.data;
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
) => (await api.put("/admin/password", { currentPassword, newPassword })).data;
export const uploadPhoto = async (file: File) => {
  const form = new FormData();
  form.append("image", file);
  form.append("purpose", "AVATAR");
  return (await api.post<Envelope<Media>>("/media", form)).data.data;
};
export const getCoupons = async (params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}) => (await api.get<Envelope<Coupon[]>>("/admin/coupons", { params })).data;
export const getCoupon = async (id: string) =>
  (await api.get<Envelope<Coupon>>(`/admin/coupons/${id}`)).data.data;
export const getCouponStats = async () =>
  (await api.get<Envelope<CouponStats>>("/admin/coupons/stats")).data.data;
export const createCoupon = async (input: CouponInput) =>
  (await api.post<Envelope<Coupon>>("/admin/coupons", input)).data.data;
export const deleteCoupon = async (id: string) =>
  (await api.delete(`/admin/coupons/${id}`)).data;
