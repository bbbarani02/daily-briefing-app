export interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  country: string;
  isBreaking: boolean;
}

export interface Weather {
  temperature: number;
  condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Snowy' | 'Windy' | 'Stormy' | 'Foggy';
  description: string;
  location: string;
}

export interface Commodity {
  name: string;
  price: number;
}

export interface Stock {
  name: string;
  ticker: string;
  price: number;
  change: number;
}

export interface Financials {
  commodities: Commodity[];
  stocks: Stock[];
}

export interface Source {
  title: string;
  uri: string;
}

export interface DailyBriefing {
  news: NewsArticle[];
  weather: Weather;
  financials: Financials;
}