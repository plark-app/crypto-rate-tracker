import { InfluxDB, IPoint } from 'influx';
import { forEach, findKey } from 'lodash';
import Axios from 'axios';
import config from 'config';
import FiatRateProvider from 'common/providers/fiat-rate-provider';
import CryptoRateProvider from 'common/providers/crypto-rate-provider';

const currencyConfig = config.get<CurrencyConfigUnit>('currency');

function floorSatosi(value: number): number {
    return Math.floor(value * 100000000) / 100000000;
}

function floorUsd(value: number): number {
    return Math.floor(value * 10000) / 10000;
}

const bitfinex = Axios.create({
    baseURL: 'https://api.bitfinex.com/v2/',
});


async function getCoinRates(
    symbols: string[],
    coinAliases: Record<string, string> = {},
): Promise<Record<string, number>> {
    const coinMap = symbols.map((coin: string) => `t${coinAliases[coin] || coin}USD`);

    const { data } = await bitfinex.get<any[][]>('/tickers', {
        params: {
            symbols: coinMap.join(','),
        },
    });

    if (!data) {
        return {};
    }

    const rateMap: Record<string, number> = {};

    data.map((ticker: any[]) => {
        const id: string = ticker[0];
        let symbol = id.substr(1, 3);

        const originalId: string | undefined = findKey(coinAliases, (val: string) => val === symbol);
        if (originalId) {
            symbol = originalId;
        }

        rateMap[symbol] = ticker[7];
    });

    return rateMap;
}


export default (influxConnection: InfluxDB) => {
    if (!currencyConfig) {
        throw new Error('Currency config must be implemented!');
    }

    const coins = currencyConfig.coins;
    const coinAliases = currencyConfig.coin_aliases;

    const fiatProvider = new FiatRateProvider(influxConnection);
    const cryptoProvider = new CryptoRateProvider(influxConnection);

    return async () => {

        const lastFiatRates = await fiatProvider.getLasts();
        const coinRates = await getCoinRates(coins, coinAliases);

        const points: IPoint[] = [];
        let bitcoinRate: number = 0;

        forEach(coinRates, (rate: number, coinSymbol: string) => {
            points.push(CryptoRateProvider.mapPoint(coinSymbol, 'USD', rate));
            if (coinSymbol === 'BTC') {
                bitcoinRate = rate;
            }

            forEach(lastFiatRates, (fiatRate: number, fiatSymbol: string) => {
                points.push(CryptoRateProvider.mapPoint(coinSymbol, fiatSymbol, floorUsd(rate * fiatRate)));
            });
        });

        if (bitcoinRate) {
            forEach(coinRates, (rate: number, coinSymbol: string) => {
                points.push(CryptoRateProvider.mapPoint(coinSymbol, 'BTC', floorSatosi(rate / bitcoinRate)));
            });
        }

        await cryptoProvider.writePoints(points);
    };
};
