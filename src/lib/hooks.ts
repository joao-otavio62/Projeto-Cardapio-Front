import { useCallback, useEffect, useRef, useState } from 'react'

export function useFetch<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const fnRef = useRef(fn)
  fnRef.current = fn
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(async () => {
    setLoading(true)
    try { setData(await fnRef.current()); setError(null) }
    catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, deps)
  useEffect(() => { void reload() }, [reload])
  return { data, error, loading, reload, setData }
}

export function useDebounce<T>(value: T, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}
