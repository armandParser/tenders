import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchTenders, fetchTendersByIds, type TenderFilters } from '../services/api';

export function useTenders(filters: TenderFilters) {
    return useInfiniteQuery({
        queryKey: ['tenders', filters],
        queryFn: async ({ pageParam = 0 }) => {
            const { data, error } = await fetchTenders({ ...filters, offset: pageParam });
            if (error) throw error;
            return data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const loadedCount = allPages.reduce((acc, page) => acc + page.results.length, 0);
            if (loadedCount < lastPage.totalCount) {
                return loadedCount;
            }
            return undefined;
        }
    });
}

export function useSavedTenders(ids: string[]) {
    return useQuery({
        queryKey: ['savedTenders', ids],
        queryFn: async () => {
            const { data, error } = await fetchTendersByIds(ids);
            if (error) throw error;
            return data;
        },
        enabled: ids.length > 0
    });
}
