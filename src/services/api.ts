import { tryCatch, type Result } from '../utils/result';

export interface BOAMPResponse {
    results: Tender[];
    total_count: number;
}

export interface Tender {
    id: string; // Assuming there is an ID, usually 'recordid' or similar in Opendatasoft
    objet: string;
    dateparution: string;
    datelimitereponse: string;
    code_departement: string;
    nom_acheteur: string;
    type_marche: string;
    famille_libelle: string;
    procedure_categorise: string;
    descripteur_libelle: string[];
    [key: string]: any; // Allow other properties for now
}

export interface TenderFilters {
    datePre?: string;
    datePost?: string;
    limit?: number;
    offset?: number;
    code_departement?: string;
    type_marche?: string;
    famille_libelle?: string;
    descripteur_libelle?: string;
    sort?: string;
    // Add other filters as needed
}

export async function fetchTenders(
    filters: TenderFilters
): Promise<Result<{ results: Tender[]; totalCount: number }>> {
    const baseUrl = "https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records";
    const now = new Date().toISOString();

    // Default to last 30 days if not specified
    const datePost = filters.datePost || new Date().toISOString().split('T')[0];
    const datePre = filters.datePre || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let whereClause = `dateparution > '${datePre}' AND dateparution < '${datePost}' AND datelimitereponse > '${now}'`;

    if (filters.code_departement) {
        whereClause += ` AND code_departement = '${filters.code_departement}'`;
    }
    if (filters.type_marche) {
        whereClause += ` AND type_marche = '${filters.type_marche}'`;
    }
    if (filters.famille_libelle) {
        whereClause += ` AND famille_libelle = '${filters.famille_libelle}'`;
    }
    if (filters.descripteur_libelle) {
        whereClause += ` AND descripteur_libelle = '${filters.descripteur_libelle}'`;
    }

    const params = new URLSearchParams({
        where: whereClause,
        limit: (filters.limit || 20).toString(),
        offset: (filters.offset || 0).toString(),
        order_by: filters.sort || "dateparution DESC"
    });

    const { data: response, error: fetchError } = await tryCatch(fetch(`${baseUrl}?${params}`));
    if (fetchError) return { data: null, error: fetchError };

    if (!response.ok) {
        return { data: null, error: new Error(`API Error: ${response.statusText}`) };
    }

    const { data, error: jsonError } = await tryCatch(response.json() as Promise<BOAMPResponse>);
    if (jsonError) return { data: null, error: jsonError };

    return {
        data: {
            results: data.results || [],
            totalCount: data.total_count || 0
        },
        error: null
    };
}

export async function fetchTendersByIds(ids: string[]): Promise<Result<Tender[]>> {
    if (ids.length === 0) return { data: [], error: null };

    const baseUrl = "https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records";
    // Construct a WHERE clause that looks for any of the provided IDs
    // Assuming 'idweb' is the field we are using for IDs. 
    // If the IDs stored are 'idweb', we use that.
    const whereClause = `idweb in (${ids.map(id => `'${id}'`).join(',')})`;

    const params = new URLSearchParams({
        where: whereClause,
        limit: "100" // Fetch up to 100 saved items at once
    });

    const { data: response, error: fetchError } = await tryCatch(fetch(`${baseUrl}?${params}`));
    if (fetchError) return { data: null, error: fetchError };

    if (!response.ok) {
        return { data: null, error: new Error(`API Error: ${response.statusText}`) };
    }

    const { data, error: jsonError } = await tryCatch(response.json() as Promise<BOAMPResponse>);
    if (jsonError) return { data: null, error: jsonError };

    return { data: data.results || [], error: null };
}
