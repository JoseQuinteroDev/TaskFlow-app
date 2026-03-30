import { apiClient } from "./client";

export const authApi = {
  me: async () => (await apiClient.get("/auth/me")).data,
  login: async (payload) => (await apiClient.post("/auth/login", payload)).data,
  register: async (payload) => (await apiClient.post("/auth/register", payload)).data,
  logout: async () => apiClient.post("/auth/logout", {}),
};

export const tasksApi = {
  list: async (params) => (await apiClient.get("/tasks", { params })).data,
  create: async (payload) => (await apiClient.post("/tasks", payload)).data,
  update: async (taskId, payload) => (await apiClient.put(`/tasks/${taskId}`, payload)).data,
  remove: async (taskId) => (await apiClient.delete(`/tasks/${taskId}`)).data,
  updateStatus: async (taskId, status) => (await apiClient.patch(`/tasks/${taskId}/status`, { status })).data,
};

export const categoriesApi = {
  list: async () => (await apiClient.get("/categories")).data,
  create: async (payload) => (await apiClient.post("/categories", payload)).data,
};

export const statsApi = {
  get: async () => (await apiClient.get("/stats")).data,
};
