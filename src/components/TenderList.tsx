import { useStore } from '../store';
import type { Tender } from '../services/api';

interface TenderListProps {
    tenders: Tender[];
    loading: boolean;
    onSelectTender: (id: string) => void;
    selectedTenderId?: string;
    onLoadMore?: () => void;
    sort?: string;
    onSortChange?: (sort: string) => void;
}

const normalizeTitles = (title: string) => {
    if (!title) return '';
    if (title === title.toUpperCase()) {
        return title.charAt(0) + title.slice(1).toLowerCase();
    }
    return title;
}

export function TenderList({ tenders, loading, onSelectTender, selectedTenderId, onLoadMore }: TenderListProps) {
    const readTenders = useStore((state) => state.readTenders)

    if (loading && tenders.length === 0) {
        return <div className="p-8 text-gray-500 animate-pulse">Loading tenders...</div>;
    }

    if (tenders.length === 0) {
        return <div className="p-8 text-gray-500">No tenders found matching your criteria.</div>;
    }

    return (
        <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="p-4 font-medium text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 w-20">Dept</th>
                        <th
                            className="p-4 font-medium text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white select-none"
                        >
                            Sujet
                        </th>
                        <th
                            className="p-4 font-medium text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 w-32 hover:text-black dark:hover:text-white select-none"
                        >
                            Date butoire
                        </th>
                        <th
                            className="p-4 font-medium text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 w-32 hover:text-black dark:hover:text-white select-none"
                        >
                            Type
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {tenders.map((tender) => {
                        const isRead = readTenders.has(tender.idweb || tender.id);
                        return (
                            <tr
                                key={tender.idweb || tender.id}
                                onClick={() => onSelectTender(tender.idweb || tender.id)}
                                className={`
                                        group cursor-pointer transition-colors duration-200
                                        ${selectedTenderId === (tender.idweb || tender.id)
                                        ? 'bg-gray-100 dark:bg-white/10'
                                        : 'hover:bg-gray-50 dark:hover:bg-white/5'}
                                    `}
                            >
                                <td className="p-4 text-sm font-mono text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                                    {Array.isArray(tender.code_departement)
                                        ? tender.code_departement.join(', ')
                                        : tender.code_departement}
                                </td>
                                <td className="p-4">
                                    <div className={`font-medium text-sm line-clamp-2 mb-1 ${isRead ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>{normalizeTitles(tender.objet)}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{tender.nom_acheteur}</div>
                                </td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                    {new Date(tender.datelimitereponse).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-xs">
                                    <span className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                        {tender.type_marche}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {onLoadMore && (
                <div className="p-8 flex justify-center">
                    <button
                        onClick={onLoadMore}
                        disabled={loading}
                        className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-full hover:opacity-80 disabled:opacity-50 transition-opacity"
                    >
                        {loading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
}
