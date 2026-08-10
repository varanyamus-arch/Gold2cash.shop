const SUPABASE_URL = "https://qauowpegkgfirmybphtt.supabase.co";
const SUPABASE_KEY = "sb_publishable_zERYYQzTsklJ2bMeCP1mMg_k_QsKqP4";

export const TROY_OUNCE_GRAMS = 31.1034768;
export const THAI_BAHT_GRAMS = 15.244;

type SupabaseOptions = {
  signal?: AbortSignal;
};

export async function readSupabase<T>(path: string, options: SupabaseOptions = {}): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Supabase read failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function finiteNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

