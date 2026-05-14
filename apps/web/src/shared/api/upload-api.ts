import { apiClient } from "./apiClient";

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<{ url: string }>("/upload", form);
  return data.url;
}
