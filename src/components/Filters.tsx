import filtersData from '../filters.json';
import type { TenderFilters } from '../services/api';

interface FiltersProps {
    filters: TenderFilters;
    onFilterChange: (newFilters: TenderFilters) => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

export function Filters({ filters, onFilterChange, theme, onToggleTheme }: FiltersProps) {
    const handleChange = (key: keyof TenderFilters, value: string) => {
        onFilterChange({ ...filters, [key]: value === "" ? undefined : value });
    };

    return (
        <div className="w-52 border-r border-black/10 dark:border-white/10 h-full p-4 flex flex-col gap-6 overflow-y-auto bg-white/50 dark:bg-[#121212]/50 backdrop-blur-sm transition-colors duration-300">
            <div>
                <h3 className="font-medium text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Department</h3>
                <select
                    className="w-full bg-transparent border border-gray-300 dark:border-gray-700 p-2 text-sm focus:border-black dark:focus:border-white focus:ring-0 outline-none transition-colors dark:text-gray-200"
                    value={filters.code_departement || ""}
                    onChange={(e) => handleChange('code_departement', e.target.value)}
                >
                    <option value="">Tous les départements</option>
                    {filtersData.code_departement.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </div>

            <div>
                <h3 className="font-medium text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Type de marché</h3>
                <div className="flex flex-col gap-2">
                    {filtersData.type_marche.map((type) => (
                        <label key={type} className="flex items-center gap-2 text-sm cursor-pointer group">
                            <input
                                type="radio"
                                name="type_marche"
                                value={type}
                                checked={filters.type_marche === type}
                                onChange={() => handleChange('type_marche', type)}
                                className="appearance-none w-3 h-3 border border-gray-400 dark:border-gray-600 checked:bg-black dark:checked:bg-white checked:border-black dark:checked:border-white transition-all"
                            />
                            <span className="group-hover:text-black dark:group-hover:text-white text-gray-700 dark:text-gray-300 transition-colors">{type}</span>
                        </label>
                    ))}
                    <label className="flex items-center gap-2 text-sm cursor-pointer group">
                        <input
                            type="radio"
                            name="type_marche"
                            value=""
                            checked={!filters.type_marche}
                            onChange={() => handleChange('type_marche', "")}
                            className="appearance-none w-3 h-3 border border-gray-400 dark:border-gray-600 checked:bg-black dark:checked:bg-white checked:border-black dark:checked:border-white transition-all"
                        />
                        <span className="group-hover:text-black dark:group-hover:text-white text-gray-700 dark:text-gray-300 transition-colors">Tout</span>
                    </label>
                </div>
            </div>

            <div>
                <h3 className="font-medium text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Catégorie</h3>
                <select
                    className="w-full bg-transparent border border-gray-300 dark:border-gray-700 p-2 text-sm focus:border-black dark:focus:border-white focus:ring-0 outline-none transition-colors dark:text-gray-200"
                    value={filters.famille_libelle || ""}
                    onChange={(e) => handleChange('famille_libelle', e.target.value)}
                >
                    <option value="">Toutes les catégories</option>
                    {filtersData.famille_libelle.map((fam) => (
                        <option key={fam} value={fam}>{fam}</option>
                    ))}
                </select>
            </div>

            <div>
                <h3 className="font-medium text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Mots clés</h3>
                <select
                    className="w-full bg-transparent border border-gray-300 dark:border-gray-700 p-2 text-sm focus:border-black dark:focus:border-white focus:ring-0 outline-none transition-colors dark:text-gray-200"
                    value={filters.descripteur_libelle || ""}
                    onChange={(e) => handleChange('descripteur_libelle', e.target.value)}
                >
                    <option value="">Tous les mots clés</option>
                    {filtersData.descripteur_libelle.sort().map((desc) => (
                        <option key={desc} value={desc}>{desc}</option>
                    ))}
                </select>
            </div>

            <div className="mt-auto pt-6 border-t border-black/10 dark:border-white/10">
                <button
                    onClick={() => {
                        console.log('Theme toggle button clicked');
                        onToggleTheme();
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors w-full"
                >
                    <div className="w-4 h-4 border border-current rounded-full relative">
                        <div className={`absolute inset-0.5 rounded-full bg-current transition-transform duration-300 ${theme === 'dark' ? 'scale-100' : 'scale-0'}`} />
                    </div>
                    <span>{theme === 'dark' ? 'Mode nuit' : 'Mode jour'}</span>
                </button>
            </div>
        </div>
    );
}
