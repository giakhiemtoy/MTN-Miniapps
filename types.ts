
export interface AdGroupData {
    topic?: string;
    keywords?: string;
    emphasizedKeywords?: string;
    landingPage?: string;
    toneAndMood?: string;
    emphasizedContent?: string;
    extensions?: string;
    contentToAvoid?: string;
}

export interface Headline {
    id: string;
    text: string;
}

export interface Description {
    id: string;
    text: string;
}

export interface Sitelink {
    id: string;
    title: string;
    description1: string;
    description2: string;
}

export interface AdVariant {
    headlines: Headline[];
    descriptions: Description[];
}

export interface GeneratedAdGroup {
    adGroupName: string;
    variants: AdVariant[];
    sitelinks: Sitelink[];
    callouts: { id: string; text: string }[];
}

export interface GenerationConfig {
    variants: number;
    headlines: number;
    descriptions: number;
    sitelinks: number;
    callouts: number;
    language: string;
}
