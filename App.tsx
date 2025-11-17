import React, { useState, useCallback, useMemo } from 'react';
import { AdGroupData, GeneratedAdGroup, Sitelink, Headline, Description } from './types';
import AdGroupForm from './components/AdGroupForm';
import AdResultsDisplay from './components/AdResultsDisplay';
import { generateAdCopy, generateSingleTextItem } from './services/geminiService';
import { exportToCSV } from './utils/csvExporter';
import { GenerateIcon } from './components/icons/GenerateIcon';
import { ExportIcon } from './components/icons/ExportIcon';
import { LoadingSpinner } from './components/icons/LoadingSpinner';

const App: React.FC = () => {
    const [campaignTopic, setCampaignTopic] = useState<string>('');
    const [campaignExtensions, setCampaignExtensions] = useState<string>('');
    const [campaignCallouts, setCampaignCallouts] = useState<string>('');
    const [adGroupCount, setAdGroupCount] = useState<number>(1);
    const [adGroupsData, setAdGroupsData] = useState<AdGroupData[]>([{}]);
    const [generationConfig, setGenerationConfig] = useState({
        variants: 2,
        headlines: 3,
        descriptions: 2,
        sitelinks: 4,
        callouts: 4,
        language: 'Tiếng Việt',
    });
    const [generatedAds, setGeneratedAds] = useState<GeneratedAdGroup[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [regeneratingItems, setRegeneratingItems] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    const handleAdGroupCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let count = parseInt(e.target.value, 10);
        if (isNaN(count) || count < 1) {
            count = 1;
        } else if (count > 10) {
            count = 10;
        }
        setAdGroupCount(count);
        setAdGroupsData(currentData => {
            const newData = [...currentData];
            while (newData.length < count) {
                newData.push({});
            }
            return newData.slice(0, count);
        });
        setGeneratedAds([]);
    };

    const handleAdGroupDataChange = useCallback((index: number, data: AdGroupData) => {
        setAdGroupsData(currentData => {
            const newData = [...currentData];
            newData[index] = data;
            return newData;
        });
    }, []);

    const handleGenerationConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'language') {
             setGenerationConfig(prev => ({ ...prev, [name]: value }));
             return;
        }

        let numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) {
            numValue = 0;
        } else if (numValue > 10) {
            numValue = 10;
        }
        setGenerationConfig(prev => ({ ...prev, [name]: Number(numValue) }));
    };

    const handleGenerateClick = async () => {
        if (!campaignTopic.trim()) {
            setError('Vui lòng nhập Chủ đề Chung cho chiến dịch.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedAds([]);
        setRegeneratingItems(new Set());

        try {
            const results = await Promise.all(
                adGroupsData.map(groupData => 
                    generateAdCopy(campaignTopic, campaignExtensions, campaignCallouts, groupData, generationConfig)
                )
            );
            setGeneratedAds(results);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Đã có lỗi xảy ra trong quá trình tạo quảng cáo. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleResultsChange = useCallback((index: number, updatedAdGroup: GeneratedAdGroup) => {
        setGeneratedAds(currentAds => {
            const newAds = [...currentAds];
            newAds[index] = updatedAdGroup;
            return newAds;
        });
    }, []);

    const handleRegenerateItem = useCallback(async (
        adGroupIndex: number,
        itemType: 'headline' | 'description' | 'sitelink' | 'callout',
        itemId: string,
        variantIndex?: number,
    ) => {
        setRegeneratingItems(prev => new Set(prev).add(itemId));

        const adGroup = generatedAds[adGroupIndex];
        const adGroupData = adGroupsData[adGroupIndex];
        if (!adGroup || !adGroupData) return;

        let existingItems: any[] = [];
        if (itemType === 'headline' && variantIndex !== undefined) {
            existingItems = adGroup.variants[variantIndex].headlines.map(h => h.text);
        } else if (itemType === 'description' && variantIndex !== undefined) {
            existingItems = adGroup.variants[variantIndex].descriptions.map(d => d.text);
        } else if (itemType === 'sitelink') {
            existingItems = adGroup.sitelinks;
        } else if (itemType === 'callout') {
            existingItems = adGroup.callouts.map(c => c.text);
        }

        try {
            const newContent = await generateSingleTextItem({
                campaignTopic,
                adGroupData,
                existingItems,
                itemType,
                language: generationConfig.language,
            });

            setGeneratedAds(currentAds => {
                const newAds = JSON.parse(JSON.stringify(currentAds));
                const targetAdGroup = newAds[adGroupIndex];

                if (itemType === 'headline' && variantIndex !== undefined && typeof newContent === 'string') {
                    const headline = targetAdGroup.variants[variantIndex].headlines.find((h: Headline) => h.id === itemId);
                    if (headline) headline.text = newContent;
                } else if (itemType === 'description' && variantIndex !== undefined && typeof newContent === 'string') {
                    const description = targetAdGroup.variants[variantIndex].descriptions.find((d: Description) => d.id === itemId);
                    if (description) description.text = newContent;
                } else if (itemType === 'sitelink' && typeof newContent === 'object' && 'description1' in newContent) {
                    const sitelink = targetAdGroup.sitelinks.find((s: Sitelink) => s.id === itemId);
                    if (sitelink) {
                        sitelink.title = newContent.title;
                        sitelink.description1 = newContent.description1;
                        sitelink.description2 = newContent.description2;
                    }
                } else if (itemType === 'callout' && typeof newContent === 'string') {
                    const callout = targetAdGroup.callouts.find((c: {id: string}) => c.id === itemId);
                    if (callout) callout.text = newContent;
                }
                return newAds;
            });

        } catch (err: any) {
             console.error(`Error regenerating item ${itemId}:`, err);
             setError(err.message || `Lỗi khi tạo lại nội dung. Vui lòng thử lại.`);
        } finally {
            setRegeneratingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
        }
    }, [campaignTopic, adGroupsData, generatedAds, generationConfig.language]);

    const handleAddItem = useCallback((adGroupIndex: number, itemType: 'headline' | 'description' | 'sitelink' | 'callout', variantIndex?: number) => {
        setGeneratedAds(currentAds => {
            const newAds = JSON.parse(JSON.stringify(currentAds));
            const targetAdGroup = newAds[adGroupIndex];
            const createId = () => `item-${Date.now()}-${Math.random()}`;

            if (itemType === 'headline' && variantIndex !== undefined) {
                targetAdGroup.variants[variantIndex].headlines.push({ id: createId(), text: '' });
            } else if (itemType === 'description' && variantIndex !== undefined) {
                targetAdGroup.variants[variantIndex].descriptions.push({ id: createId(), text: '' });
            } else if (itemType === 'sitelink') {
                targetAdGroup.sitelinks.push({ id: createId(), title: '', description1: '', description2: '' });
            } else if (itemType === 'callout') {
                targetAdGroup.callouts.push({ id: createId(), text: '' });
            }
            
            return newAds;
        });
    }, []);

    const handleDeleteItem = useCallback((adGroupIndex: number, itemType: 'headline' | 'description' | 'sitelink' | 'callout', itemId: string, variantIndex?: number) => {
        setGeneratedAds(currentAds => {
            const newAds = JSON.parse(JSON.stringify(currentAds));
            const targetAdGroup = newAds[adGroupIndex];

            if (itemType === 'headline' && variantIndex !== undefined) {
                targetAdGroup.variants[variantIndex].headlines = targetAdGroup.variants[variantIndex].headlines.filter((h: Headline) => h.id !== itemId);
            } else if (itemType === 'description' && variantIndex !== undefined) {
                targetAdGroup.variants[variantIndex].descriptions = targetAdGroup.variants[variantIndex].descriptions.filter((d: Description) => d.id !== itemId);
            } else if (itemType === 'sitelink') {
                targetAdGroup.sitelinks = targetAdGroup.sitelinks.filter((s: Sitelink) => s.id !== itemId);
            } else if (itemType === 'callout') {
                targetAdGroup.callouts = targetAdGroup.callouts.filter((c: {id: string}) => c.id !== itemId);
            }

            return newAds;
        });
    }, []);


    const canGenerate = useMemo(() => {
        return campaignTopic.trim() !== '' && adGroupsData.every(group => group.topic && group.topic.trim() !== '');
    }, [campaignTopic, adGroupsData]);

    const canExport = useMemo(() => generatedAds.length > 0, [generatedAds]);

    return (
        <>
            <div className="container mx-auto p-4 md:p-8">
                <header className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">SEM Ad Text Generator</h1>
                    </div>
                     <p className="text-md text-gray-600">Tạo nội dung quảng cáo Google Ads cho các chiến dịch SEM của bạn với sức mạnh của Gemini.</p>
                </header>

                <main>
                    <div className="space-y-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-3">Cài đặt chung</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <label htmlFor="campaignTopic" className="block text-sm font-medium text-gray-700 mb-1">Chủ đề Chung của Chiến dịch (*)</label>
                                    <input type="text" id="campaignTopic" value={campaignTopic} onChange={e => setCampaignTopic(e.target.value)} placeholder="Ví dụ: Cửa hàng giày thể thao ABC" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label htmlFor="adGroupCount" className="block text-sm font-medium text-gray-700 mb-1">Số lượng Ad Group</label>
                                    <input type="number" id="adGroupCount" value={adGroupCount} onChange={handleAdGroupCountChange} min="1" max="10" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                 <div className="md:col-span-2">
                                    <label htmlFor="campaignExtensions" className="block text-sm font-medium text-gray-700 mb-1">Gợi ý Extension cấp Campaign (Sitelink, Price...)</label>
                                    <textarea id="campaignExtensions" value={campaignExtensions} onChange={e => setCampaignExtensions(e.target.value)} rows={2} placeholder="Sitelinks: Giày nam, Giày nữ. Price: Nike Air Max - 2.500.000đ" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="campaignCallouts" className="block text-sm font-medium text-gray-700 mb-1">Gợi ý Callout cấp Campaign</label>
                                    <textarea id="campaignCallouts" value={campaignCallouts} onChange={e => setCampaignCallouts(e.target.value)} rows={2} placeholder="Hàng chính hãng 100%, Giao hàng toàn quốc, Bảo hành 12 tháng" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-3">Cấu hình Nội dung</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                <div className="col-span-2 md:col-span-3 lg:col-span-2">
                                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
                                    <select name="language" id="language" value={generationConfig.language} onChange={handleGenerationConfigChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                        <option value="Tiếng Việt">Tiếng Việt</option>
                                        <option value="English">English</option>
                                    </select>
                                </div>
                                {Object.entries(generationConfig).filter(([key]) => key !== 'language').map(([key, value]) => (
                                    <div key={key}>
                                        <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                            {key}
                                        </label>
                                        <input
                                            type="number"
                                            id={key}
                                            name={key}
                                            value={value}
                                            onChange={handleGenerationConfigChange}
                                            min="0"
                                            max="10"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            {Array.from({ length: adGroupCount }).map((_, index) => (
                                <AdGroupForm key={index} index={index} data={adGroupsData[index] || {}} onChange={handleAdGroupDataChange} />
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                             {error && <div className="text-red-600 text-center mb-4">{error}</div>}
                            <button
                                onClick={handleGenerateClick}
                                disabled={isLoading || !canGenerate}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? <><LoadingSpinner /> Đang tạo...</> : <><GenerateIcon /> Tạo quảng cáo</>}
                            </button>
                             <button
                                onClick={() => exportToCSV(campaignTopic, adGroupsData, generatedAds)}
                                disabled={isLoading || !canExport}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                <ExportIcon /> Xuất CSV
                            </button>
                        </div>

                        {generatedAds.length > 0 && (
                            <div className="space-y-6 mt-10">
                                {generatedAds.map((adGroup, index) => (
                                    <AdResultsDisplay
                                        key={index}
                                        index={index}
                                        adGroupData={adGroupsData[index]}
                                        generatedAdGroup={adGroup}
                                        onResultsChange={handleResultsChange}
                                        onRegenerateItem={handleRegenerateItem}
                                        onAddItem={handleAddItem}
                                        onDeleteItem={handleDeleteItem}
                                        regeneratingItems={regeneratingItems}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
};

export default App;
