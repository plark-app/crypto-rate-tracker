import { IPoint, IResults } from 'influx';
import { Measurements, Tags } from 'common/influx-database';
import { convertPercent } from 'common/helper';
import AbstractProvider from './abstract-provider';


export type TickerMap = Record<string, Record<string, number[]>>;

export type CoinQuote = {
    symbol: string;
    price: number;
    change_24h: number;
};


export type CryptoPoint = {
    time: Date;
    rate: number;
    coin_symbol: string;
    symbol: string;
};


export type CryptoOHLC = {
    time: Date;
    open: number;
    close: number;
    high: number;
    low: number;
    symbol: string;
};


export default class CryptoPriceProvider extends AbstractProvider {
    public static mapPoint(from: string, to: string, rate: number): IPoint {
        return {
            measurement: Measurements.CryptoPrice,
            tags: {
                [Tags.SymbolQuote]: from,
                [Tags.Symbol]: to,
            },
            fields: {
                rate: rate,
            },
        };
    }


    public async getLasts(): Promise<TickerMap> {
        const response: IResults<CryptoPoint> = await this.influxDatabase.query<CryptoPoint>(
            `SELECT LAST(rate) as rate, ${Tags.SymbolQuote}, ${Tags.Symbol} 
            FROM ${Measurements.CryptoPrice}
            GROUP BY ${Tags.Symbol}, ${Tags.SymbolQuote}`,
        );

        const data: TickerMap = {};

        response.forEach((ticker: CryptoPoint) => {
            if (typeof data[ticker.coin_symbol] === 'undefined') {
                data[ticker.coin_symbol] = {};
            }

            data[ticker.coin_symbol][ticker.symbol] = [ticker.rate, 0];
        });

        return data;
    }


    public async getCoinQuotes(symbol: string): Promise<CoinQuote[]> {
        const response: IResults<CryptoOHLC> = await this.influxDatabase.query<CryptoOHLC>(
            `SELECT
                FIRST(rate) as open,
                LAST(rate) as close,
                MAX(rate) as high,
                MIN(rate) as low
            FROM ${Measurements.CryptoPrice}
            WHERE ${Tags.SymbolQuote} = '${symbol}' AND time > now() - 1d
            GROUP BY ${Tags.Symbol}`,
        );

        const quotes: CoinQuote[] = [];
        // console.log(response);

        response.forEach((ticker: CryptoOHLC) => {
            quotes.push({
                symbol: ticker.symbol,
                price: ticker.close,
                change_24h: convertPercent((ticker.close - ticker.open) / ticker.close),
            });
        });

        return quotes;
    }
}
