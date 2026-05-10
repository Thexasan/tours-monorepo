// Базовые общие типы

export type Locale = "ru" | "en" | "tj";

export type LocalizedText = Partial<Record<Locale, string>> & { ru: string };

export type LocalizedList = Partial<Record<Locale, string[]>> & { ru: string[] };

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
