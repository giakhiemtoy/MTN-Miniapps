import type { AdGroupData, GeneratedAdGroup } from '../types';

export function exportToCSV(
    campaignTopic: string,
    adGroupsData: AdGroupData[],
    generatedAds: GeneratedAdGroup[]
) {
    if (!generatedAds || generatedAds.length === 0) return;

    const allColumns: string[][] = [];

    // 1. Build columns for each ad group
    generatedAds.forEach((adGroup, index) => {
        const contentCol: string[] = [];
        const lengthCol: string[] = [];

        const pushRow = (text: string, isHeader: boolean = false) => {
            contentCol.push(text);
            if (isHeader || text === '') {
                lengthCol.push('');
            } else {
                lengthCol.push(String(text.length));
            }
        };

        // Headlines
        pushRow('Headlines', true);
        const hasMultipleVariants = adGroup.variants.length > 1;
        adGroup.variants.forEach((variant, vIndex) => {
            if (hasMultipleVariants) {
                pushRow(`--- Ad Variant ${vIndex + 1} ---`, true);
            }
            variant.headlines.forEach(h => pushRow(h.text));
        });

        // Descriptions
        pushRow(''); 
        pushRow('Descriptions', true);
        adGroup.variants.forEach((variant, vIndex) => {
            if (hasMultipleVariants) {
                pushRow(`--- Ad Variant ${vIndex + 1} ---`, true);
            }
            variant.descriptions.forEach(d => pushRow(d.text));
        });

        // Sitelinks
        if (adGroup.sitelinks && adGroup.sitelinks.length > 0) {
            pushRow('');
            pushRow('Sitelinks', true);
            adGroup.sitelinks.forEach((s, sIndex) => {
                if(sIndex > 0) pushRow(''); // blank line between sitelinks for readability
                pushRow(`Sitelink ${sIndex + 1} Title:`, true);
                pushRow(s.title);
                pushRow(`Sitelink ${sIndex + 1} Desc 1:`, true);
                pushRow(s.description1);
                pushRow(`Sitelink ${sIndex + 1} Desc 2:`, true);
                pushRow(s.description2);
            });
        }

        // Callouts
        if (adGroup.callouts && adGroup.callouts.length > 0) {
            pushRow('');
            pushRow('Callouts', true);
            adGroup.callouts.forEach(c => pushRow(c.text));
        }

        allColumns.push(contentCol);
        allColumns.push(lengthCol);

        if (index < generatedAds.length - 1) {
            allColumns.push([]); // Blank separator column
        }
    });

    // 2. Find max rows and pad columns
    const maxRows = Math.max(0, ...allColumns.map(col => col.length));
    allColumns.forEach(col => {
        while (col.length < maxRows) {
            col.push('');
        }
    });

    // 3. Build CSV string
    const formatCell = (text: string): string => {
        if (text === undefined || text === null) return '""';
        return `"${text.replace(/"/g, '""')}"`;
    };

    let csvContent = "data:text/csv;charset=utf-8,";

    // Header Row
    const headerRow: string[] = [];
    generatedAds.forEach((adGroup, index) => {
        const headerText = adGroup.adGroupName || `Ad Group #${index + 1}`;
        headerRow.push(formatCell(headerText));
        headerRow.push(formatCell("Length"));
        if (index < generatedAds.length - 1) {
            headerRow.push(formatCell(""));
        }
    });
    csvContent += headerRow.join(',') + '\r\n';

    // Content Rows
    for (let i = 0; i < maxRows; i++) {
        const row = allColumns.map(col => formatCell(col[i]));
        csvContent += row.join(',') + '\r\n';
    }

    // 4. Trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `google_ads_copy_vertical_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}