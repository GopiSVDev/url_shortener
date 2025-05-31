import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

interface AuthPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

export const login = async (data: AuthPayload): Promise<LoginResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
  const token = response.data;
  localStorage.setItem("token", token);
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  return response.data;
};

export const register = async (data: AuthPayload): Promise<void> => {
  await axios.post(`${API_BASE_URL}/auth/register`, data);
};
