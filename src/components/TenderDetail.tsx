import type { Tender } from '../services/api';
import { useStore } from "../store";

interface TenderDetailProps {
    tender: Tender | null;
    onClose: () => void;
}

const decodeHtmlEntities = (text: string) => {
    if (!text) return '';
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    let decoded = textArea.value;
    // Handle double encoding if necessary
    if (decoded.includes('&lt;') || decoded.includes('&gt;')) {
        textArea.innerHTML = decoded;
        decoded = textArea.value;
    }
    return decoded;
};

export function TenderDetail({ tender, onClose }: TenderDetailProps) {
    const savedTenders = useStore((store) => store.savedTenders)
    const addHiddenTender = useStore((store) => store.addHiddenTender)
    const addSavedTender = useStore((store) => store.addSavedTender)
    const removeSavedTender = useStore((store) => store.removeSavedTender)

    if (!tender) return null;

    const isSaved = savedTenders.has(tender.idweb || tender.id);
    const tenderId = tender.idweb || tender.id;

    const handleSave = () => {
        if (isSaved) {
            removeSavedTender(tenderId);
        } else {
            addSavedTender(tenderId);
        }
    };

    const handleNotInterested = () => {
        addHiddenTender(tenderId);
        onClose();
    };

    // Helper to safely parse the nested JSON data
    let richData: any = null;
    try {
        if (tender.donnees) {
            richData = JSON.parse(tender.donnees);
        }
    } catch (e) {
        console.error("Failed to parse tender data", e);
    }

    // Extract useful fields safely
    const contractNotice = richData?.EFORMS?.ContractNotice;
    const procurementProject = contractNotice?.["cac:ProcurementProject"];
    const description = procurementProject?.["cbc:Description"]?.["#text"] || procurementProject?.["cbc:Description"]?.[0]?.["#text"];

    // Budget / Estimated Value
    const requestedTenderTotal = procurementProject?.["cac:RequestedTenderTotal"];
    const frameworkAmountNode = requestedTenderTotal?.["ext:UBLExtensions"]?.["ext:UBLExtension"]?.["ext:ExtensionContent"]?.["efext:EformsExtension"]?.["efbc:FrameworkMaximumAmount"];
    const estimatedValue = frameworkAmountNode?.["#text"] || requestedTenderTotal?.["cbc:EstimatedOverallContractAmount"]?.["#text"];
    const currency = frameworkAmountNode?.["@currencyID"] || requestedTenderTotal?.["cbc:EstimatedOverallContractAmount"]?.["@currencyID"];

    // Location
    const realizedLocation = procurementProject?.["cac:RealizedLocation"];
    const locationDesc = realizedLocation?.["cbc:Description"]?.["#text"];
    const address = realizedLocation?.["cac:Address"];
    const city = address?.["cbc:CityName"];
    const zip = address?.["cbc:PostalZone"];
    const country = address?.["cac:Country"]?.["cbc:IdentificationCode"]?.["#text"];

    // Lots
    const lotsNode = contractNotice?.["cac:ProcurementProjectLot"];
    const lots = Array.isArray(lotsNode) ? lotsNode : (lotsNode ? [lotsNode] : []);

    // Duration (Try top level, then fallback to first lot)
    const plannedPeriod = procurementProject?.["cac:PlannedPeriod"];
    let durationMeasure = plannedPeriod?.["cbc:DurationMeasure"];

    if (!durationMeasure && lots.length > 0) {
        // Fallback to first lot's duration
        durationMeasure = lots[0]?.["cac:ProcurementProject"]?.["cac:PlannedPeriod"]?.["cbc:DurationMeasure"];
    }

    const durationVal = durationMeasure?.["#text"];
    const durationUnit = durationMeasure?.["@unitCode"];

    // Buyer / Organization
    const contractingPartyId = contractNotice?.["cac:ContractingParty"]?.["cac:Party"]?.["cac:PartyIdentification"]?.["cbc:ID"];

    // Organizations can be deeply nested in UBLExtensions
    let organizations = contractNotice?.["efac:Organizations"]?.["efac:Organization"];
    if (!organizations) {
        const ublExtensions = contractNotice?.["ext:UBLExtensions"]?.["ext:UBLExtension"];
        const extensionContent = Array.isArray(ublExtensions) ? ublExtensions[0]?.["ext:ExtensionContent"] : ublExtensions?.["ext:ExtensionContent"];
        organizations = extensionContent?.["efext:EformsExtension"]?.["efac:Organizations"]?.["efac:Organization"];
    }

    let buyerOrg: any = null;

    if (organizations) {
        const orgsArray = Array.isArray(organizations) ? organizations : [organizations];

        // Filter out AWS/Avenue-Web Systèmes
        let candidates = orgsArray.filter((org: any) => {
            const nameNode = org?.["efac:Company"]?.["cac:PartyName"]?.["cbc:Name"];
            const name = (typeof nameNode === 'object' ? nameNode?.["#text"] : nameNode) || "";
            const lowerName = String(name).toLowerCase();
            return !lowerName.includes("avenue-web") && !lowerName.includes("aws");
        });

        // If we have candidates, try to filter out Tribunals if there are others
        if (candidates.length > 1) {
            const nonTribunals = candidates.filter((org: any) => {
                const nameNode = org?.["efac:Company"]?.["cac:PartyName"]?.["cbc:Name"];
                const name = (typeof nameNode === 'object' ? nameNode?.["#text"] : nameNode) || "";
                const lowerName = String(name).toLowerCase();
                return !lowerName.includes("tribunal");
            });
            if (nonTribunals.length > 0) {
                candidates = nonTribunals;
            }
        }

        // Try to match contractingPartyId against candidates
        if (contractingPartyId) {
            const targetId = typeof contractingPartyId === 'object' ? contractingPartyId?.["#text"] : contractingPartyId;
            const match = candidates.find((org: any) => {
                const idNode = org?.["efac:Company"]?.["cac:PartyIdentification"]?.["cbc:ID"];
                const companyId = typeof idNode === 'object' ? idNode?.["#text"] : idNode;
                return companyId === targetId;
            });
            if (match) buyerOrg = match;
        }

        // Fallback to first candidate
        if (!buyerOrg && candidates.length > 0) {
            buyerOrg = candidates[0];
        }

        // Last resort: if everything was filtered out, go back to original array
        if (!buyerOrg && orgsArray.length > 0) {
            buyerOrg = orgsArray[0];
        }
    }

    const buyerCompany = buyerOrg?.["efac:Company"];
    const buyerNameNode = buyerCompany?.["cac:PartyName"]?.["cbc:Name"];
    const buyerName = buyerNameNode?.["#text"] || buyerNameNode; // Handle if it's just a string or object with #text

    const buyerContact = buyerCompany?.["cac:Contact"];
    const buyerAddress = buyerCompany?.["cac:PostalAddress"];

    // Website URI might be in Company, Contact or in CallForTendersDocumentReference
    let websiteUri = buyerCompany?.["cbc:WebsiteURI"] || buyerContact?.["cbc:WebsiteURI"];

    if (!websiteUri) {
        const documentReferences = contractNotice?.["cac:ProcurementProjectLot"]?.["cac:TenderingTerms"]?.["cac:CallForTendersDocumentReference"];
        if (documentReferences) {
            const docRefArray = Array.isArray(documentReferences) ? documentReferences : [documentReferences];
            const externalRef = docRefArray.find((ref: any) => ref?.["cac:Attachment"]?.["cac:ExternalReference"]?.["cbc:URI"]);
            websiteUri = externalRef?.["cac:Attachment"]?.["cac:ExternalReference"]?.["cbc:URI"];
        }
    }

    return (
        <div className="w-[800px] max-w-full border-l border-black/10 dark:border-white/10 bg-white dark:bg-[#121212] h-full overflow-y-auto p-8 shadow-2xl absolute right-0 top-0 bottom-0 z-20 flex flex-col transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        className={`px-4 py-2 text-sm font-medium border transition-colors ${isSaved
                            ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                            : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white'
                            }`}
                    >
                        {isSaved ? 'Enregistré' : 'Enregistrer'}
                    </button>
                    <button
                        onClick={handleNotInterested}
                        className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        Pas intéressé
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <span className="inline-block px-2 py-1 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider">
                        {tender.type_marche}
                    </span>
                    {estimatedValue && (
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                            {parseInt(estimatedValue).toLocaleString()} {currency}
                        </span>
                    )}
                    {durationVal && (
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-700 pl-3">
                            {durationVal} {durationUnit}
                        </span>
                    )}
                </div>
                <h2 className="text-2xl font-bold leading-tight mb-3 text-black dark:text-white">{tender.objet}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm border-b border-gray-100 dark:border-gray-800 pb-6 mb-6">
                    {buyerName || tender.nom_acheteur}
                </p>

                {description && (
                    <div className="prose dark:prose-invert prose-sm max-w-none mb-8 text-gray-600 dark:text-gray-300">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-2 not-prose">Description</h3>
                        <div
                            className="whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(description) }}
                        />
                    </div>
                )}
            </div>

            <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Informations clés</h3>
                        <div className="space-y-3 text-sm text-gray-900 dark:text-gray-200">
                            <div>
                                <span className="block text-gray-500 dark:text-gray-400 text-xs mb-0.5">Département</span>
                                {Array.isArray(tender.code_departement)
                                    ? tender.code_departement.join(', ')
                                    : tender.code_departement}
                            </div>
                            <div>
                                <span className="block text-gray-500 dark:text-gray-400 text-xs mb-0.5">Procédure</span>
                                {tender.procedure_categorise}
                            </div>
                            <div>
                                <span className="block text-gray-500 dark:text-gray-400 text-xs mb-0.5">Publié le</span>
                                {new Date(tender.dateparution).toLocaleDateString()}
                            </div>
                            <div>
                                <span className="block text-gray-500 dark:text-gray-400 text-xs mb-0.5">Deadline</span>
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                    {new Date(tender.datelimitereponse).toLocaleDateString()}
                                </span>
                            </div>
                            {(locationDesc || city) && (
                                <div>
                                    <span className="block text-gray-500 dark:text-gray-400 text-xs mb-0.5">Localisation</span>
                                    {locationDesc && <div className="mb-1">{locationDesc}</div>}
                                    {city && <div>{city} {zip} {country}</div>}
                                </div>
                            )}
                        </div>
                    </div>

                    {(buyerContact || buyerAddress || websiteUri) && (
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Contact Details</h3>
                            <div className="space-y-3 text-sm text-gray-900 dark:text-gray-200">
                                {buyerContact?.["cbc:Name"] && (
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 text-xs mb-0.5">Contact Name</span>
                                        {buyerContact["cbc:Name"]}
                                    </div>
                                )}
                                {buyerContact?.["cbc:ElectronicMail"] && (
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 text-xs mb-0.5">Email</span>
                                        <a href={`mailto:${buyerContact["cbc:ElectronicMail"]}`} className="hover:underline">
                                            {buyerContact["cbc:ElectronicMail"]}
                                        </a>
                                    </div>
                                )}
                                {buyerContact?.["cbc:Telephone"] && (
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 text-xs mb-0.5">Phone</span>
                                        {buyerContact["cbc:Telephone"]}
                                    </div>
                                )}
                                {websiteUri && (
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 text-xs mb-0.5">Website</span>
                                        <a href={websiteUri} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">
                                            {websiteUri}
                                        </a>
                                    </div>
                                )}
                                {buyerAddress && (
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 text-xs mb-0.5">Address</span>
                                        {buyerAddress["cbc:StreetName"]}, {buyerAddress["cbc:PostalZone"]} {buyerAddress["cbc:CityName"]}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Lots Section */}
                {lots.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Lots ({lots.length})</h3>
                        <div className="grid gap-4">
                            {lots.map((lot: any, index: number) => {
                                const lotId = lot?.["cbc:ID"]?.["#text"] || index + 1;
                                const lotNameNode = lot?.["cac:ProcurementProject"]?.["cbc:Name"];
                                const lotName = lotNameNode?.["#text"] || lotNameNode;
                                const lotAmount = lot?.["cac:ProcurementProject"]?.["cac:RequestedTenderTotal"]?.["cbc:EstimatedOverallContractAmount"]?.["#text"];
                                const lotCurrency = lot?.["cac:ProcurementProject"]?.["cac:RequestedTenderTotal"]?.["cbc:EstimatedOverallContractAmount"]?.["@currencyID"];
                                const lotDuration = lot?.["cac:ProcurementProject"]?.["cac:PlannedPeriod"]?.["cbc:DurationMeasure"]?.["#text"];
                                const lotDurationUnit = lot?.["cac:ProcurementProject"]?.["cac:PlannedPeriod"]?.["cbc:DurationMeasure"]?.["@unitCode"];

                                return (
                                    <div key={index} className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-mono bg-gray-200 dark:bg-white/10 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
                                                {typeof lotId === 'string' ? lotId : `Lot ${index + 1}`}
                                            </span>
                                            {lotAmount && (
                                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                                    {parseInt(lotAmount).toLocaleString()} {lotCurrency}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-sm font-medium text-black dark:text-white mb-2">{lotName}</h4>
                                        {lotDuration && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Duration: {lotDuration} {lotDurationUnit}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {tender.descripteur_libelle && (
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {Array.isArray(tender.descripteur_libelle)
                                ? tender.descripteur_libelle.map((tag, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-white/10 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                        {tag}
                                    </span>
                                ))
                                : <span className="px-2 py-1 bg-gray-100 dark:bg-white/10 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{tender.descripteur_libelle}</span>
                            }
                        </div>
                    </div>
                )}

                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
                    <a
                        href={tender.url_avis || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-3 bg-black dark:bg-white text-white dark:text-black text-center text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                        Voir la source
                    </a>

                    {/* Debug Section */}
                    <div className="mt-8">
                        <details>
                            <summary className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 cursor-pointer hover:text-black dark:hover:text-white select-none">Données brutes</summary>
                            <pre className="mt-4 text-[10px] leading-relaxed font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all bg-gray-50 dark:bg-white/5 p-4 rounded border border-gray-100 dark:border-gray-800">
                                {JSON.stringify(richData, null, 2)}
                            </pre>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
}
