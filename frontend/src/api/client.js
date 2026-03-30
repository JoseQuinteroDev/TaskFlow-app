import axios from "axios";

const backendUrl = process.env.REACT_APP_BACKEND_URL;

if (!backendUrl) {
  // eslint-disable-next-line no-console
  console.warn("REACT_APP_BACKEND_URL is not defined. Falling back to http://localhost:8000");
}

export const API_BASE_URL = `${backendUrl || "http://localhost:8000"}/api`;

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
