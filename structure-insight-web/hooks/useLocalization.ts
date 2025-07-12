import React from 'react';
import { usePersistentState } from './usePersistentState';
import en from '../locales/en.json';
import zh from '../locales/zh.json';

const translations = { en, zh };

export type Language = 'en' | 'zh';
export type TranslationKey = keyof typeof en;

const getInitialLanguage = (): Language => {
    // navigator.language can be 'zh-CN', 'en-US', etc.
    const browserLang = navigator.language.split(/[-_]/)[0];
    return browserLang === 'zh' ? 'zh' : 'en';
};

// A helper function for translations with placeholders
const translate = (lang: Language, key: TranslationKey, options?: { [key: string]: string | number }): string => {
    let str: string = (translations[lang] as any)[key] || (translations['en'] as any)[key] || key;
    if (options) {
        Object.keys(options).forEach(optKey => {
            str = str.replace(`{${optKey}}`, String(options[optKey]));
        });
    }
    return str;
};


interface LocalizationContextValue {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey, options?: { [key: string]: string | number }) => string;
}

const LocalizationContext = React.createContext<LocalizationContextValue | null>(null);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = usePersistentState<Language>('language', getInitialLanguage());

    const t = React.useCallback((key: TranslationKey, options?: { [key: string]: string | number }) => {
        return translate(language, key, options);
    }, [language]);

    React.useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const value = { language, setLanguage, t };
    
    return (
        <LocalizationContext.Provider value={value}>
            {children}
        </LocalizationContext.Provider>
    );
};

export const useLocalization = () => {
    const context = React.useContext(LocalizationContext);
    if (!context) {
        throw new Error('useLocalization must be used within a LocalizationProvider');
    }
    return context;
};
