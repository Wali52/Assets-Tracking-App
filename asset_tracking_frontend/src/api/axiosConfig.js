import axios from "axios";
import api from "./axiosConfig";

const API_URL = "http://127.0.0.1:8000/api/v1/";

// ---- AUTH ----
export const login = (data) => axios.post(`${API_URL}auth/token/`, data);
export const changePassword = (data) => api.post("change-password/", data);

// ---- ORG SETTINGS / METRICS ----
export const getOrgMetrics = () => api.get("orgsettings/metrics/");
export const getOrgSettings = () => api.get("org-settings/");
export const updateOrgSettings = (id, data) =>
  api.put(`org-settings/${id}/`, data);

// ---- ASSETS ----
export const getAssets = () => api.get("assets/");
export const getAssetById = (id) => api.get(`assets/${id}/`);
export const createAsset = (data) => api.post("assets/", data);
export const updateAsset = (id, data) => api.put(`assets/${id}/`, data);
export const deleteAsset = (id) => api.delete(`assets/${id}/`);

// ---- CATEGORIES ----
export const getCategories = () => api.get("asset-categories/");
export const createCategory = (data) => api.post("asset-categories/", data);
export const updateCategory = (id, data) =>
  api.put(`asset-categories/${id}/`, data);
export const deleteCategory = (id) => api.delete(`asset-categories/${id}/`);

// ---- ASSIGNMENTS ----
export const getAssignments = () => api.get("assignments/");
export const createAssignment = (data) => api.post("assignments/", data);
export const returnAssignment = (id) =>
  api.post(`assignments/${id}/return-asset/`);

// ---- DEPARTMENTS ----
export const getDepartments = () => api.get("departments/");
export const createDepartment = (data) => api.post("departments/", data);
export const updateDepartment = (id, data) =>
  api.put(`departments/${id}/`, data);
export const deleteDepartment = (id) => api.delete(`departments/${id}/`);

// ---- USERS ----
export const getUsers = () => api.get("users/");
export const createUser = (data) => api.post("users/", data);
export const updateUser = (id, data) => api.put(`users/${id}/`, data);
export const deleteUser = (id) => api.delete(`users/${id}/`);