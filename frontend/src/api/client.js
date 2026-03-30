import axios from "axios";

export const API_BASE_URL = "https://taskflow-app-production-46a0.up.railway.app/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export function formatApiError(error, fallbackMessage = "Something went wrong. Please try again.") {
  const detail = error?.response?.data?.detail;
  if (!detail) return fallbackMessage;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((entry) => (entry?.msg ? entry.msg : JSON.stringify(entry)))
      .filter(Boolean)
      .join(" ");
  }
  if (typeof detail?.msg === "string") return detail.msg;
  return fallbackMessage;
}