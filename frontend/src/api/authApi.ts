import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

export const login = async (data: LoginPayload): Promise<LoginResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
  return response.data;
};
