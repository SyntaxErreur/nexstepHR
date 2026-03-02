import { useState, useEffect, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: any[] = [],
  immediate = true
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fn();
      setState({ data, loading: false, error: null });
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message || 'An error occurred' }));
    }
  }, deps);

  useEffect(() => {
    if (immediate) execute();
  }, [execute, immediate]);

  return { ...state, refetch: execute };
}

export function useAsyncAction<T extends (...args: any[]) => Promise<any>>(action: T) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
    setLoading(true);
    setError(null);
    try {
      const result = await action(...args);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
      throw err;
    }
  }, [action]);

  return { execute, loading, error };
}
