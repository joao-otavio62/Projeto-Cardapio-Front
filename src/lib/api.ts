import type * as T from "./types";

export const BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:5080";

const TOKEN_KEY = "pf_token";
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

type Init = {
  method?: string;
  body?: unknown;
  form?: FormData;
  auth?: boolean;
};

async function req<R>(path: string, init: Init = {}): Promise<R> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (init.form) body = init.form;
  else if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  if (init.auth) {
    const t = tokenStore.get();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: init.method ?? "GET",
      headers,
      body,
    });
  } catch {
    throw new ApiError(
      0,
      "Sem conexão com o servidor. Verifique sua internet.",
    );
  }

  if (res.status === 204) return undefined as R;
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* resposta não-JSON */
  }

  if (!res.ok) {
    if (res.status === 401 && init.auth) {
      tokenStore.clear();
      window.dispatchEvent(new Event("pf:unauthorized"));
    }
    const fields = data?.errors as Record<string, string[]> | undefined;
    const first = fields
      ? (Object.values(fields).flat()[0] as string | undefined)
      : undefined;
    const msg =
      res.status === 429
        ? "Muitas tentativas. Aguarde um instante e tente novamente."
        : (first ?? data?.title ?? "Erro inesperado.");
    throw new ApiError(res.status, msg, fields);
  }
  return data as R;
}

const pub = (slug: string) => `/api/public/stores/${encodeURIComponent(slug)}`;

export const publicApi = {
  store: (slug: string) => req<T.Store>(pub(slug)),
  menu: (slug: string, search?: string) =>
    req<T.Menu>(
      `${pub(slug)}/menu${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    ),
  checkout: (slug: string, body: T.CheckoutBody) =>
    req<T.CheckoutResponse>(`${pub(slug)}/checkout`, { method: "POST", body }),
  order: (slug: string, code: string) =>
    req<T.PublicOrder>(`${pub(slug)}/orders/${encodeURIComponent(code)}`),
  lookup: (slug: string, cpf: string) =>
    req<T.PublicOrder[]>(`${pub(slug)}/orders/lookup`, {
      method: "POST",
      body: { cpf },
    }),
  chat: (slug: string, messages: { role: string; content: string }[]) =>
    req<{ reply: string }>(`${pub(slug)}/chat`, {
      method: "POST",
      body: { messages },
    }),
};

const A = "/api/admin";
const a = { auth: true };
export const adminApi = {
  login: (email: string, password: string) =>
    req<T.LoginResponse>(`${A}/auth/login`, {
      method: "POST",
      body: { email, password },
    }),
  store: () => req<T.Store>(`${A}/store`, a),
  updateStore: (b: Omit<T.Store, "id" | "slug">) =>
    req<T.Store>(`${A}/store`, { ...a, method: "PUT", body: b }),

  categories: () => req<T.Category[]>(`${A}/categories`, a),
  saveCategory: (id: string | null, b: Omit<T.Category, "id">) =>
    req<T.Category>(id ? `${A}/categories/${id}` : `${A}/categories`, {
      ...a,
      method: id ? "PUT" : "POST",
      body: b,
    }),
  deleteCategory: (id: string) =>
    req<void>(`${A}/categories/${id}`, { ...a, method: "DELETE" }),

  promotions: () => req<T.Promotion[]>(`${A}/promotions`, a),
  savePromotion: (
    id: string | null,
    b: Omit<T.Promotion, "id" | "isCurrent">,
  ) =>
    req<T.Promotion>(id ? `${A}/promotions/${id}` : `${A}/promotions`, {
      ...a,
      method: id ? "PUT" : "POST",
      body: b,
    }),
  deletePromotion: (id: string) =>
    req<void>(`${A}/promotions/${id}`, { ...a, method: "DELETE" }),

  products: (search: string, page = 1) =>
    req<T.Paged<T.Product>>(
      `${A}/products?pageSize=50&page=${page}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
      a,
    ),
  saveProduct: (id: string | null, b: T.ProductBody) =>
    req<T.Product>(id ? `${A}/products/${id}` : `${A}/products`, {
      ...a,
      method: id ? "PUT" : "POST",
      body: b,
    }),
  deleteProduct: (id: string) =>
    req<void>(`${A}/products/${id}`, { ...a, method: "DELETE" }),
  adjustStock: (id: string, quantity: number) =>
    req<T.Product>(`${A}/products/${id}/stock`, {
      ...a,
      method: "POST",
      body: { quantity },
    }),
  uploadMedia: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return req<T.Media>(`${A}/products/${id}/media`, {
      ...a,
      method: "POST",
      form,
    });
  },
  deleteMedia: (id: string, mediaId: string) =>
    req<void>(`${A}/products/${id}/media/${mediaId}`, {
      ...a,
      method: "DELETE",
    }),

  orders: () =>
    req<T.Paged<T.AdminOrderListItem>>(`${A}/orders?pageSize=100`, a),
  unseen: () => req<T.AdminOrderListItem[]>(`${A}/orders/unseen`, a),
  order: (id: string) => req<T.AdminOrderDetail>(`${A}/orders/${id}`, a),
  markSeen: (id: string) =>
    req<void>(`${A}/orders/${id}/seen`, { ...a, method: "POST" }),
  setStatus: (id: string, status: T.OrderStatus) =>
    req<T.AdminOrderDetail>(`${A}/orders/${id}/status`, {
      ...a,
      method: "PATCH",
      body: { status },
    }),

  report: (from: string, to: string) =>
    req<T.Report>(`${A}/reports/summary?from=${from}&to=${to}`, a),
};
