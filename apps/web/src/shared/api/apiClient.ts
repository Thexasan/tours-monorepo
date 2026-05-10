import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // отправляем httpOnly cookies
  timeout: 15_000,
});

// Auto-refresh при 401: пробуем один раз обновить access-токен через /auth/refresh
let refreshPromise: Promise<void> | null = null;

async function refreshAccess(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const status = err.response?.status;
    const config = err.config as AxiosRequestConfig & { _retried?: boolean };

    // Не пытаемся рефрешить запросы к самим auth-endpoint'ам
    const url = config?.url ?? "";
    const isAuthEndpoint = /\/auth\/(login|register|refresh|logout)/.test(url);

    if (status === 401 && !config?._retried && !isAuthEndpoint) {
      try {
        await refreshAccess();
        if (config) {
          config._retried = true;
          return apiClient.request(config);
        }
      } catch {
        // refresh не получился → пробрасываем 401
      }
    }
    return Promise.reject(err);
  },
);

export type ApiErrorPayload = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

/** Унифицированный extractor сообщения ошибки. */
export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorPayload | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(", ") : data.message;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}
