const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  formData?: FormData;
  token?: string;
  query?: Record<string, string | number | undefined>;
};

const buildUrl = (path: string, query?: RequestOptions["query"]): string => {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return API_BASE_URL.startsWith("http") ? url.toString() : `${url.pathname}${url.search}`;
};

export const http = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers: {
      ...(options.formData ? {} : { "Content-Type": "application/json" }),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.formData ?? (options.body ? JSON.stringify(options.body) : undefined),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }

  return (await response.json()) as T;
};
