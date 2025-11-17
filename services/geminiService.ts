import { GoogleGenAI } from '@google/genai';
import type { AdGroupData, GeneratedAdGroup, GenerationConfig, Sitelink } from '../types';

function extractJson(text: string): any {
    const jsonRegex = /```(json)?\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonRegex);
    if (match && match[2]) {
        try {
            return JSON.parse(match[2]);
        } catch (e) {
            console.error("Failed to parse extracted JSON:", e);
            throw new Error("Invalid JSON format in model response");
        }
    }
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse the entire response as JSON:", e);
        // Fallback for non-JSON text which might be an error message from the API
        if (text.toLowerCase().includes("api key not valid")) {
             throw new Error("API key not valid. Please pass a valid API key.");
        }
        throw new Error("Could not find or parse JSON in the model response.");
    }
}

function validateAndSanitize(data: any, config: GenerationConfig): GeneratedAdGroup {
    const sanitized: GeneratedAdGroup = {
        adGroupName: typeof data.adGroupName === 'string' ? data.adGroupName : 'Untitled Ad Group',
        variants: Array.isArray(data.variants) ? data.variants : [],
        sitelinks: Array.isArray(data.sitelinks) ? data.sitelinks : [],
        callouts: Array.isArray(data.callouts) ? data.callouts : [],
    };

    const createId = () => `item-${Date.now()}-${Math.random()}`;

    sanitized.variants = sanitized.variants.map((variant: any) => ({
        headlines: Array.isArray(variant.headlines) ? variant.headlines.map((h: any) => ({ id: createId(), text: typeof h.text === 'string' ? h.text : '' })) : [],
        descriptions: Array.isArray(variant.descriptions) ? variant.descriptions.map((d: any) => ({ id: createId(), text: typeof d.text === 'string' ? d.text : '' })) : [],
    })).slice(0, config.variants);
    
    sanitized.sitelinks = sanitized.sitelinks.map((s: any) => ({ 
        id: createId(), 
        title: typeof s.title === 'string' ? s.title : '',
        description1: typeof s.description1 === 'string' ? s.description1 : '',
        description2: typeof s.description2 === 'string' ? s.description2 : '',
    })).slice(0, config.sitelinks);

    sanitized.callouts = sanitized.callouts.map((c: any) => ({ id: createId(), text: typeof c.text === 'string' ? c.text : '' })).slice(0, config.callouts);

    return sanitized;
}


export async function generateAdCopy(
    campaignTopic: string,
    campaignExtensions: string,
    campaignCallouts: string,
    adGroupData: AdGroupData,
    config: GenerationConfig
): Promise<GeneratedAdGroup> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        You are an expert Google Ads copywriter. Your task is to generate compelling ad copy based on the provided information.
        The ad copy must be written in **${config.language}**.

        **Primary Information Source:** Your most important task is to analyze the provided Landing Page using Google Search to understand its content, products, services, features, benefits, and unique selling propositions. All generated ad copy should reflect the information found on the landing page. Keywords should be used as a secondary guide to focus the copy.

        **Overall Campaign Topic:** ${campaignTopic}
        **Campaign-level Extension Suggestions:** ${campaignExtensions || 'Not specified'}
        **Campaign-level Callout Suggestions:** ${campaignCallouts || 'Not specified'}

        **Ad Group Details:**
        - **Landing Page (Primary Source):** ${adGroupData.landingPage || 'Not specified'}
        - **Ad Group Topic:** ${adGroupData.topic || 'Not specified'}
        - **Related Keywords (Secondary Guide):** ${adGroupData.keywords || 'Not specified'}
        - **Keywords to Emphasize (must include if possible):** ${adGroupData.emphasizedKeywords || 'Not specified'}
        - **Desired Tone & Mood:** ${adGroupData.toneAndMood || 'Professional'}
        - **Content to Emphasize (Promotions, USP, etc.):** ${adGroupData.emphasizedContent || 'Not specified'}
        - **Content to AVOID:** ${adGroupData.contentToAvoid || 'Not specified'}
        - **Ad Group-specific Extension Suggestions (for inspiration):** ${adGroupData.extensions || 'Not specified'}

        **Generation Requirements:**
        - Generate ${config.variants} unique and diverse ad variants.
        - Each variant must have exactly ${config.headlines} headlines. **Headlines within an ad group should be distinct and not repetitive.**
        - Each variant must have exactly ${config.descriptions} descriptions. **Descriptions within an ad group should be distinct and not repetitive.**
        - Generate ${config.sitelinks} **enhanced Sitelink extensions** for the ad group. Each sitelink must have one title (Sitelink Text) and **two** separate description lines (Description Line 1, Description Line 2).
        - Generate ${config.callouts} Callout extensions for the ad group.
        - **CRITICAL - Strict Character Limits:** 
            - Headlines MUST be **30 characters or less**.
            - Descriptions MUST be **90 characters or less**.
            - Sitelink Titles MUST be **25 characters or less**.
            - Sitelink Description Lines (both 1 and 2) MUST be **35 characters or less**.
            - Callouts MUST be **25 characters or less**.
            - Adherence to these character limits is mandatory. DO NOT exceed them.
        - The adGroupName should be a concise, relevant name for the ad group based on its topic, written in the requested language.

        Return the response ONLY as a raw JSON object, without any markdown formatting (like \`\`\`json).
        The JSON structure MUST be:
        {
          "adGroupName": "string",
          "variants": [
            {
              "headlines": [{ "text": "string" }],
              "descriptions": [{ "text": "string" }]
            }
          ],
          "sitelinks": [{ "title": "string", "description1": "string", "description2": "string" }],
          "callouts": [{ "text": "string" }]
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        const jsonText = response.text.trim();
        const parsedResult = extractJson(jsonText);
        const sanitizedResult = validateAndSanitize(parsedResult, config);
        
        return sanitizedResult;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Return a fallback structure on error to prevent app crash
        return {
            adGroupName: adGroupData.topic || "Error Generating Name",
            variants: Array(config.variants || 1).fill(0).map(() => ({
                headlines: Array(config.headlines || 1).fill({ id: `err-${Math.random()}`, text: "Generation Failed" }),
                descriptions: Array(config.descriptions || 1).fill({ id: `err-${Math.random()}`, text: "Generation Failed" }),
            })),
            sitelinks: Array(config.sitelinks || 0).fill({ id: `err-${Math.random()}`, title: "Generation Failed", description1: "Generation Failed", description2: "Generation Failed" }),
            callouts: Array(config.callouts || 0).fill({ id: `err-${Math.random()}`, text: "Generation Failed" }),
        };
    }
}

type SingleItem = string | { title: string; description1: string; description2: string };

export async function generateSingleTextItem(
    context: {
        campaignTopic: string,
        adGroupData: AdGroupData,
        existingItems: any[],
        itemType: 'headline' | 'description' | 'sitelink' | 'callout',
        language: string,
    }
): Promise<SingleItem> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const { campaignTopic, adGroupData, existingItems, itemType, language } = context;

    const limits = {
        headline: 30,
        description: 90,
        sitelink_title: 25,
        sitelink_description: 35,
        callout: 25,
    };

    let taskPrompt = '';
    let responseFormat = 'Return ONLY the text for the new item. Do not include any extra formatting, labels, quotation marks, or explanations.';

    if (itemType === 'sitelink') {
        taskPrompt = `
        - Generate one new, creative **enhanced Sitelink**.
        - It MUST have one 'title' (Sitelink Text) and **two** separate description lines ('description1', 'description2').
        - **Uniqueness:** It MUST be unique and different from these existing sitelinks: [${existingItems.map(item => `"${item.title} - ${item.description1} / ${item.description2}"`).join(', ')}]
        - **CRITICAL - Character Limits:**
          - The 'title' MUST be **${limits.sitelink_title} characters or less**.
          - Both 'description1' and 'description2' MUST be **${limits.sitelink_description} characters or less**.
        - These are strict requirements. DO NOT exceed these limits.`;
        responseFormat = 'Return ONLY a raw JSON object with "title", "description1", and "description2" keys, like this: {"title": "New Sitelink Title", "description1": "New description line 1.", "description2": "New description line 2."}';
    } else {
         const itemLimit = itemType === 'headline' ? limits.headline : itemType === 'description' ? limits.description : limits.callout;
         taskPrompt = `
        - Generate one new, creative **${itemType}**.
        - **Uniqueness:** It MUST be unique and different from these existing items: [${existingItems.map(item => `"${item}"`).join(', ')}]
        - **CRITICAL - Character Limit:** The response MUST be **${itemLimit} characters or less**. This is a strict requirement. DO NOT exceed this limit.`;
    }

    const prompt = `
        You are an expert Google Ads copywriter. Your task is to generate a single, new, high-quality ad component based on the full context provided.
        The response must be in **${language}**.

        **Full Ad Group Context:**
        - **Overall Campaign Topic:** ${campaignTopic}
        - **Ad Group Topic:** ${adGroupData.topic || 'Not specified'}
        - **Landing Page (for context):** ${adGroupData.landingPage || 'Not specified'}
        - **Related Keywords:** ${adGroupData.keywords || 'Not specified'}
        - **Keywords to Emphasize (try to include):** ${adGroupData.emphasizedKeywords || 'Not specified'}
        - **Desired Tone & Mood:** ${adGroupData.toneAndMood || 'Professional'}
        - **Content to Emphasize (Promotions, USP, etc.):** ${adGroupData.emphasizedContent || 'Not specified'}
        - **IMPORTANT - Content to AVOID:** ${adGroupData.contentToAvoid || 'Not specified'}. You must not include any themes, words, or ideas from this section.

        **Specific Task:**
        ${taskPrompt}
        
        ${responseFormat}
    `;
    
    const MAX_RETRIES = 3;
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
        attempts++;
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
    
            const text = response.text.trim();

            if (itemType === 'sitelink') {
                const parsed = extractJson(text);
                const title = parsed.title || '';
                const description1 = parsed.description1 || '';
                const description2 = parsed.description2 || '';

                if (title.length > 0 && title.length <= limits.sitelink_title && 
                    description1.length > 0 && description1.length <= limits.sitelink_description &&
                    description2.length > 0 && description2.length <= limits.sitelink_description) {
                    return { title, description1, description2 };
                }
                console.warn(`Sitelink generation exceeded limits on attempt ${attempts}. Retrying...`, { title: title.length, d1: description1.length, d2: description2.length });
            } else {
                const itemLimit = itemType === 'headline' ? limits.headline : itemType === 'description' ? limits.description : limits.callout;
                const cleanedText = text.replace(/^"|"$/g, ''); // Remove quotes from start/end
                if (cleanedText.length > 0 && cleanedText.length <= itemLimit) {
                    return cleanedText;
                }
                console.warn(`${itemType} generation exceeded limit on attempt ${attempts}. Length: ${cleanedText.length}. Retrying...`);
            }
        } catch (error) {
             console.error(`Error generating single ${itemType} on attempt ${attempts}:`, error);
             // Don't retry on API error, just break and fall through to the final error return
             break;
        }
    }
    
    console.error(`Failed to generate ${itemType} within character limits after ${MAX_RETRIES} attempts.`);
    if (itemType === 'sitelink') {
        return { title: "Lỗi độ dài", description1: "Vui lòng tạo lại", description2: "Vui lòng tạo lại" };
    }
    return "Lỗi độ dài - Vui lòng tạo lại";
}