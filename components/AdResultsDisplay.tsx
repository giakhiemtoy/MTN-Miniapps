
import React, { useState, useEffect } from 'react';
import type { GeneratedAdGroup, AdGroupData, Sitelink } from '../types';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { RegenerateIcon } from './icons/RegenerateIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface AdResultsDisplayProps {
    index: number;
    adGroupData: AdGroupData;
    generatedAdGroup: GeneratedAdGroup;
    onResultsChange: (index: number, updatedAdGroup: GeneratedAdGroup) => void;
    onRegenerateItem: (adGroupIndex: number, itemType: 'headline' | 'description' | 'sitelink' | 'callout', itemId: string, variantIndex?: number) => void;
    onAddItem: (adGroupIndex: number, itemType: 'headline' | 'description' | 'sitelink' | 'callout', variantIndex?: number) => void;
    onDeleteItem: (adGroupIndex: number, itemType: 'headline' | 'description' | 'sitelink' | 'callout', itemId: string, variantIndex?: number) => void;
    regeneratingItems: Set<string>;
}

const HEADLINE_LIMIT = 30;
const DESCRIPTION_LIMIT = 90;
const SITELINK_TITLE_LIMIT = 25;
const SITELINK_DESCRIPTION_LIMIT = 35;
const CALLOUT_LIMIT = 25;

const CharacterCounter: React.FC<{ text: string; limit: number }> = ({ text, limit }) => {
    const length = text.length;
    const colorClass = length > limit ? 'text-red-600 font-semibold' : 'text-gray-500';
    return <span className={`text-xs w-12 text-center ${colorClass}`}>{length}/{limit}</span>;
};

const EditableField: React.FC<{
    value: string;
    onChange: (newValue: string) => void;
    limit: number;
    isTextarea?: boolean;
    disabled?: boolean;
    placeholder?: string;
}> = ({ value, onChange, limit, isTextarea = false, disabled = false, placeholder }) => {
    const Component = isTextarea ? 'textarea' : 'input';
    const baseClasses = "w-full text-sm py-1 px-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500";
    const errorClasses = value.length > limit ? "border-red-500 bg-red-50" : "";
    const disabledClasses = disabled ? "bg-gray-100 cursor-wait" : "";
    
    return (
        <Component
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseClasses} ${errorClasses} ${disabledClasses}`}
            rows={isTextarea ? 2 : undefined}
            disabled={disabled}
            placeholder={placeholder}
        />
    );
};


const AdResultsDisplay: React.FC<AdResultsDisplayProps> = ({ index, adGroupData, generatedAdGroup, onResultsChange, onRegenerateItem, onAddItem, onDeleteItem, regeneratingItems }) => {
    const [localAdGroup, setLocalAdGroup] = useState<GeneratedAdGroup>(generatedAdGroup);

    useEffect(() => {
        setLocalAdGroup(generatedAdGroup);
    }, [generatedAdGroup]);
    
    const handleTextChange = (path: (string|number)[], newText: string) => {
        const newAdGroup = JSON.parse(JSON.stringify(localAdGroup));
        let current: any = newAdGroup;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        current[path[path.length-1]] = newText;

        setLocalAdGroup(newAdGroup);
        onResultsChange(index, newAdGroup);
    };

    const renderCallout = (
        item: { id: string; text: string },
        itemType: 'callout',
        limit: number,
        path: (string|number)[]
    ) => {
        const isRegenerating = regeneratingItems.has(item.id);
        return (
            <div key={item.id} className="flex items-center gap-2">
                <div className="flex-grow">
                    <EditableField 
                        value={item.text} 
                        onChange={(newText) => handleTextChange([...path, 'text'], newText)} 
                        limit={limit}
                        disabled={isRegenerating}
                    />
                </div>
                <CharacterCounter text={item.text} limit={limit} />
                <button
                    onClick={() => onRegenerateItem(index, itemType, item.id)}
                    disabled={isRegenerating}
                    title="Tạo lại"
                    className="p-1 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-wait"
                >
                    {isRegenerating ? <LoadingSpinner /> : <RegenerateIcon />}
                </button>
                 <button
                    onClick={() => onDeleteItem(index, itemType, item.id)}
                    title="Xóa"
                    className="p-1 text-gray-500 hover:text-red-600"
                >
                    <TrashIcon />
                </button>
            </div>
        );
    };

    const renderSitelink = (
        item: Sitelink,
        sIndex: number,
        path: (string | number)[]
    ) => {
        const isRegenerating = regeneratingItems.has(item.id);
        return (
            <div key={item.id} className="space-y-2 border-t border-gray-200 pt-3 first:border-t-0 first:pt-0">
                 <p className="text-xs font-semibold text-gray-600">Sitelink #{sIndex + 1}</p>
                 <div className="flex items-start gap-2">
                    <div className="flex-grow space-y-2">
                        <div>
                            <label className="text-xs text-gray-500">Sitelink Text (tối đa {SITELINK_TITLE_LIMIT} ký tự)</label>
                            <div className="flex items-center gap-2">
                                <EditableField
                                    value={item.title}
                                    onChange={(newText) => handleTextChange([...path, 'title'], newText)}
                                    limit={SITELINK_TITLE_LIMIT}
                                    disabled={isRegenerating}
                                    placeholder="Sitelink Text"
                                />
                                <CharacterCounter text={item.title} limit={SITELINK_TITLE_LIMIT} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Description Line 1 (Tối đa {SITELINK_DESCRIPTION_LIMIT} ký tự)</label>
                            <div className="flex items-center gap-2">
                                <EditableField
                                    value={item.description1}
                                    onChange={(newText) => handleTextChange([...path, 'description1'], newText)}
                                    limit={SITELINK_DESCRIPTION_LIMIT}
                                    disabled={isRegenerating}
                                    placeholder="Description Line 1"
                                />
                                <CharacterCounter text={item.description1} limit={SITELINK_DESCRIPTION_LIMIT} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Description Line 2 (Tối đa {SITELINK_DESCRIPTION_LIMIT} ký tự)</label>
                            <div className="flex items-center gap-2">
                                <EditableField
                                    value={item.description2}
                                    onChange={(newText) => handleTextChange([...path, 'description2'], newText)}
                                    limit={SITELINK_DESCRIPTION_LIMIT}
                                    disabled={isRegenerating}
                                    placeholder="Description Line 2"
                                />
                                <CharacterCounter text={item.description2} limit={SITELINK_DESCRIPTION_LIMIT} />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col h-full justify-center items-center pt-4">
                        <button
                            onClick={() => onRegenerateItem(index, 'sitelink', item.id)}
                            disabled={isRegenerating}
                            title="Tạo lại"
                            className="p-1 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-wait"
                        >
                            {isRegenerating ? <LoadingSpinner /> : <RegenerateIcon />}
                        </button>
                        <button
                            onClick={() => onDeleteItem(index, 'sitelink', item.id)}
                            title="Xóa"
                            className="p-1 text-gray-500 hover:text-red-600"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const renderAdCopyItem = (
        item: { id: string; text: string },
        itemType: 'headline' | 'description',
        limit: number,
        path: (string|number)[]
    ) => {
        const isRegenerating = regeneratingItems.has(item.id);
        const variantIndex = path[1] as number;
        return (
            <div key={item.id} className="flex items-center gap-2">
                <div className="flex-grow">
                    <EditableField 
                        value={item.text} 
                        onChange={(newText) => handleTextChange([...path, 'text'], newText)} 
                        limit={limit}
                        isTextarea={itemType === 'description'}
                        disabled={isRegenerating}
                    />
                </div>
                <CharacterCounter text={item.text} limit={limit} />
                <button
                    onClick={() => onRegenerateItem(index, itemType, item.id, variantIndex)}
                    disabled={isRegenerating}
                    title="Tạo lại"
                    className="p-1 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-wait"
                >
                    {isRegenerating ? <LoadingSpinner /> : <RegenerateIcon />}
                </button>
                 <button
                    onClick={() => onDeleteItem(index, itemType, item.id, variantIndex)}
                    title="Xóa"
                    className="p-1 text-gray-500 hover:text-red-600"
                >
                    <TrashIcon />
                </button>
            </div>
        );
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-blue-700 mb-4">
                Kết quả cho Ad Group: <span className="font-bold">{adGroupData.topic || `Ad Group #${index + 1}`}</span>
            </h3>

            <div className="space-y-6 mt-4">
                {localAdGroup.variants.map((variant, vIndex) => (
                    <div key={vIndex} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Phiên bản quảng cáo #{vIndex + 1}</h4>
                        <div className="space-y-3">
                            <div>
                                <h5 className="text-sm font-medium text-gray-600 mb-2">Headlines</h5>
                                <div className="space-y-2">
                                    {variant.headlines.map((headline, hIndex) => renderAdCopyItem(headline, 'headline', HEADLINE_LIMIT, ['variants', vIndex, 'headlines', hIndex]))}
                                </div>
                                <button onClick={() => onAddItem(index, 'headline', vIndex)} className="text-sm text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1">
                                    <PlusIcon /> Thêm Headline
                                </button>
                            </div>
                            <div>
                                <h5 className="text-sm font-medium text-gray-600 mb-2">Descriptions</h5>
                                <div className="space-y-2">
                                    {variant.descriptions.map((description, dIndex) => renderAdCopyItem(description, 'description', DESCRIPTION_LIMIT, ['variants', vIndex, 'descriptions', dIndex]))}
                                </div>
                                <button onClick={() => onAddItem(index, 'description', vIndex)} className="text-sm text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1">
                                    <PlusIcon /> Thêm Description
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {localAdGroup.sitelinks?.length > 0 && (
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <h5 className="text-sm font-medium text-gray-600 mb-2">Sitelinks</h5>
                            <div className="space-y-3">
                                {localAdGroup.sitelinks.map((sitelink, sIndex) => renderSitelink(sitelink, sIndex, ['sitelinks', sIndex]))}
                            </div>
                            <button onClick={() => onAddItem(index, 'sitelink')} className="text-sm text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1">
                                <PlusIcon /> Thêm Sitelink
                            </button>
                        </div>
                    )}
                    {localAdGroup.callouts?.length > 0 && (
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <h5 className="text-sm font-medium text-gray-600 mb-2">Callouts</h5>
                            <div className="space-y-2">
                                {localAdGroup.callouts.map((callout, cIndex) => renderCallout(callout, 'callout', CALLOUT_LIMIT, ['callouts', cIndex]))}
                            </div>
                             <button onClick={() => onAddItem(index, 'callout')} className="text-sm text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1">
                                <PlusIcon /> Thêm Callout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdResultsDisplay;
