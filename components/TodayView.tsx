import React, { useState, useEffect, useCallback } from 'react';
import type { DailyBriefing, NewsArticle, Weather, Commodity, Stock, Source } from '../types';
import { fetchDailyBriefing } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { SunIcon } from './icons/SunIcon';
import { CloudIcon } from './icons/CloudIcon';
import { RainIcon } from './icons/RainIcon';

const WeatherIcon: React.FC<{ condition: Weather['condition']; className?: string }> = ({ condition, className }) => {
    switch (condition) {
        case 'Sunny':
            return <SunIcon className={className} />;
        case 'Cloudy':
        case 'Foggy':
            return <CloudIcon className={className} />;
        case 'Rainy':
        case 'Stormy':
            return <RainIcon className={className} />;
        default:
            return <CloudIcon className={className} />;
    }
};

const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => (
    <a href={article.url} target="_blank" rel="noopener noreferrer" className="block bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
        {article.isBreaking && (
            <span className="inline-block bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full mb-2">
                BREAKING
            </span>
        )}
        <h3 className="font-bold text-gray-800 dark:text-gray-100">{article.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{article.summary}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{article.country}</p>
    </a>
);

const WeatherCard: React.FC<{ weather: Weather }> = ({ weather }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{weather.location}</p>
            <p className="text-5xl font-bold text-gray-800 dark:text-gray-100">{weather.temperature}°C</p>
            <p className="text-gray-600 dark:text-gray-300">{weather.description}</p>
        </div>
        <WeatherIcon condition={weather.condition} className="w-20 h-20 text-blue-500 dark:text-blue-400" />
    </div>
);

const FinancialsCard: React.FC<{ commodities: Commodity[]; stocks: Stock[] }> = ({ commodities, stocks }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
        <div className="grid grid-cols-2 gap-4 mb-4">
            {commodities.map(c => (
                <div key={c.name} className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{c.name}</p>
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">${c.price.toLocaleString()}</p>
                </div>
            ))}
        </div>
        <div className="space-y-2">
            {stocks.map(s => (
                <div key={s.ticker} className="flex justify-between items-center">
                    <div>
                        <p className="font-bold text-gray-800 dark:text-gray-100">{s.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.ticker}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">${s.price.toLocaleString()}</p>
                        <p className={`text-sm font-semibold ${s.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const SourcesCard: React.FC<{ sources: Source[] }> = ({ sources }) => {
    if (sources.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Data Sources</h3>
            <ul className="list-disc list-inside space-y-1">
                {sources.map((source, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                            {source.title || new URL(source.uri).hostname}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const TodayView: React.FC = () => {
    const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
    const [sources, setSources] = useState<Source[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number, lon: number } | null>(null);

    const getBriefingData = useCallback(async (lat: number, lon: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const { briefing: data, sources: sourceData } = await fetchDailyBriefing(lat, lon);
            setBriefing(data);
            setSources(sourceData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
            },
            () => {
                setError('Geolocation permission denied. Please enable it in your browser settings to get local updates.');
                setIsLoading(false);
            }
        );
    }, []);

    useEffect(() => {
        if (location) {
            getBriefingData(location.lat, location.lon);
        }
    }, [location, getBriefingData]);

    if (isLoading) {
        return <div className="mt-16"><LoadingSpinner /></div>;
    }
    if (error) {
        return (
             <div className="mt-8 text-center p-4 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-lg mx-4">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        );
    }
    if (briefing) {
        return (
            <div className="space-y-6 pt-4">
                <section>
                     <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 px-4 mb-3">Weather</h2>
                     <div className="px-4">
                        <WeatherCard weather={briefing.weather} />
                     </div>
                </section>
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 px-4 mb-3">Top Stories</h2>
                    <div className="px-4 space-y-4">
                        {briefing.news.map((article, index) => <NewsCard key={index} article={article} />)}
                    </div>
                </section>
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 px-4 mb-3">Markets</h2>
                    <div className="px-4">
                        <FinancialsCard commodities={briefing.financials.commodities} stocks={briefing.financials.stocks} />
                    </div>
                </section>
                <section>
                     <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 px-4 mb-3">Sources</h2>
                     <div className="px-4">
                        <SourcesCard sources={sources} />
                     </div>
                </section>
            </div>
        );
    }
    return null;
};

export default TodayView;