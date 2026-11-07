import { QueryClient } from '@tanstack/react-query';

export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: 10 * 60_000,
    },
  },
});
