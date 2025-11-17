
import React, { useState } from 'react';

interface ApiKeyModalProps {
    onSave: (apiKey: string) => void;
    currentApiKey: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, currentApiKey }) => {
    const [localApiKey, setLocalApiKey] = useState(currentApiKey);

    const handleSave = () => {
        onSave(localApiKey);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md mx-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Cung cấp API Key của bạn</h2>
                <p className="text-gray-600 mb-6">
                    Để sử dụng ứng dụng, vui lòng cung cấp Google AI API Key của bạn. Key của bạn sẽ được lưu trữ an toàn trong trình duyệt và không được gửi đi bất cứ đâu ngoài Google.
                </p>
                <input
                    type="password"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder="Nhập API Key của bạn tại đây"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    aria-label="API Key Input"
                    autoComplete="off"
                />
                 <p className="text-xs text-gray-500 mt-2">
                    Bạn có thể lấy API Key tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.
                </p>
                <button
                    onClick={handleSave}
                    disabled={!localApiKey.trim()}
                    className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    Lưu và Bắt đầu
                </button>
            </div>
        </div>
    );
};

export default ApiKeyModal;
