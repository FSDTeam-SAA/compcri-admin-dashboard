import axios from "axios";

export function loginErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Sign in could not be completed. Please try again.";
  }
  if (!error.response) {
    return error.code === "ECONNABORTED" || error.code === "ETIMEDOUT"
      ? "The sign-in request timed out. Please try again."
      : "Cannot reach the authentication server. Please try again.";
  }
  const { status, data } = error.response;
  if (status >= 500) {
    return "The authentication server is temporarily unavailable. Please try again later.";
  }
  if (status === 401) return "Email or password is incorrect.";
  if (status === 429) return "Too many sign-in attempts. Please try again later.";
  if (status === 422) return "Please enter a valid email address and password.";
  if (status === 403) {
    switch (data?.error?.code) {
      case "ACCOUNT_SUSPENDED": return "Your account is suspended. Contact your administrator.";
      case "ACCOUNT_PENDING_DELETION": return "Your account is pending deletion. Contact your administrator.";
      case "ROLE_FORBIDDEN": return "This account does not have administrator access.";
      default: return "This account cannot sign in. Contact your administrator.";
    }
  }
  return "Sign in could not be completed. Please try again.";
}
