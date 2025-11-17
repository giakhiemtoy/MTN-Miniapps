
import React, { useState, useEffect, useCallback } from 'react';
import type { AdGroupData } from '../types';

interface AdGroupFormProps {
    index: number;
    data: AdGroupData;
    onChange: (index: number, data: AdGroupData) => void;
}

const AdGroupForm: React.FC<AdGroupFormProps> = ({ index, data, onChange }) => {
    const [localData, setLocalData] = useState<AdGroupData>(data);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalData(prevData => ({ ...prevData, [name]: value }));
    }, []);

    useEffect(() => {
        onChange(index, localData);
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localData, index]);


    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-shadow hover:shadow-md">
            <h3 className="text-xl font-semibold mb-4 border-b pb-3 text-gray-800">
                Chi tiết Ad Group #{index + 1}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                    <label htmlFor={`topic-${index}`} className="block text-sm font-medium text-gray-700">Chủ đề Ad Group</label>
                    <input type="text" id={`topic-${index}`} name="topic" value={localData.topic || ''} onChange={handleChange} placeholder="Ví dụ: Giày Nike Air Max cho nam" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div>
                    <label htmlFor={`keywords-${index}`} className="block text-sm font-medium text-gray-700">Các Keyword liên quan</label>
                    <textarea id={`keywords-${index}`} name="keywords" value={localData.keywords || ''} onChange={handleChange} rows={4} placeholder="Ví dụ: nike air max, giày thể thao nam, mua giày nike" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>

                <div>
                    <label htmlFor={`emphasizedKeywords-${index}`} className="block text-sm font-medium text-gray-700">Keyword cần nhấn mạnh (có trong ad text)</label>
                    <textarea id={`emphasizedKeywords-${index}`} name="emphasizedKeywords" value={localData.emphasizedKeywords || ''} onChange={handleChange} rows={4} placeholder="Ví dụ: Giảm giá, Miễn phí vận chuyển" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>

                <div className="md:col-span-2">
                    <label htmlFor={`landingPage-${index}`} className="block text-sm font-medium text-gray-700">Landing page (để lấy thông tin)</label>
                    <input type="url" id={`landingPage-${index}`} name="landingPage" value={localData.landingPage || ''} onChange={handleChange} placeholder="https://example.com/nike-air-max" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div>
                    <label htmlFor={`toneAndMood-${index}`} className="block text-sm font-medium text-gray-700">Tone & Mood</label>
                     <input type="text" id={`toneAndMood-${index}`} name="toneAndMood" value={localData.toneAndMood || ''} onChange={handleChange} placeholder="Ví dụ: Chuyên nghiệp, Thân thiện, Khẩn cấp" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div className="md:col-span-2">
                    <label htmlFor={`emphasizedContent-${index}`} className="block text-sm font-medium text-gray-700">Nội dung cần nhấn mạnh</label>
                    <textarea id={`emphasizedContent-${index}`} name="emphasizedContent" value={localData.emphasizedContent || ''} onChange={handleChange} rows={3} placeholder="Ví dụ: Chương trình khuyến mãi tháng 6, tặng voucher 100k, bảo hành 12 tháng" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>

                <div className="md:col-span-2">
                    <label htmlFor={`contentToAvoid-${index}`} className="block text-sm font-medium text-gray-700">Các nội dung tránh đề cập</label>
                    <textarea id={`contentToAvoid-${index}`} name="contentToAvoid" value={localData.contentToAvoid || ''} onChange={handleChange} rows={3} placeholder="Ví dụ: Không đề cập đến đối thủ, tránh dùng từ 'giá rẻ'" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                
                <div className="md:col-span-2">
                    <label htmlFor={`extensions-${index}`} className="block text-sm font-medium text-gray-700">Extension đi theo (Gợi ý)</label>
                    <textarea id={`extensions-${index}`} name="extensions" value={localData.extensions || ''} onChange={handleChange} rows={3} placeholder="Ví dụ: Sitelinks: Mẫu mới về, Giày nam, Giày nữ. Callouts: Giao hàng nhanh, Hàng chính hãng 100%" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
            </div>
        </div>
    );
};

export default AdGroupForm;