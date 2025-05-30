import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

export const shortenUrl = async (longUrl: string) => {
  const response = await axios.post(`${API_BASE_URL}/shorten`, {
    originalUrl: longUrl,
  });

  const { shortCode } = response.data;
  const shortUrl = `http://localhost:8080/${shortCode}`;

  return {
    ...response.data,
    shortUrl,
  };
};
