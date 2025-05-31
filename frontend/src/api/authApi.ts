import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

interface AuthPayload {
  username: string;
  password: string;
}

export const register = async (data: AuthPayload): Promise<void> => {
  await axios.post(`${API_BASE_URL}/auth/register`, data);
};

export const login = async (data: AuthPayload): Promise<string> => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
  return response.data;
};
