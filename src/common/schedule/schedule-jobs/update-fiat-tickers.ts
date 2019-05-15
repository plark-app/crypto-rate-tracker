import { InfluxDB, IPoint } from 'influx';
import { chunk, forEach, get } from 'lodash';
import Axios, { AxiosInstance } from 'axios';
import config from 'config';
import logger from 'common/logger';
import FiatPriceProvider from 'common/providers/fiat-price-provider';


class CurrencyApiClient {
    protected client: AxiosInstance;

    public constructor() {
        this.client = Axios.create({
            baseURL: 'https://min-api.cryptocompare.com',
        });
    }

    public async getSymbols(symbols: string[]): Promise<Record<string, number>> {
        const { data } = await this.client.get('/data/pricemulti', {
            params: {
                fsyms: 'USD',
                tsyms: symbols.join(','),
            },
        });

        return get(data, 'USD', {});
    }
}


export default (influxConnection: InfluxDB) => {
    const currencyClient = new CurrencyApiClient();

    const currencyConfig = config.get<CurrencyConfigUnit>('currency');
    if (!currencyConfig) {
        throw new Error('Currency config must be implemented!');
    }

    const fiatProvider = new FiatPriceProvider(influxConnection);

    return async (): Promise<void> => {
        const points: IPoint[] = [];

        for (let symbols of chunk(currencyConfig.fiats, 10)) {
            let data;

            try {
                data = await currencyClient.getSymbols(symbols);
            } catch (error) {
                logger.error('Error on Fetch cryptocompare.com: ' + error.message);

                return;
            }

            forEach(data, (value: number, symbol: string) => {
                points.push(FiatPriceProvider.mapPoint(symbol, value));
            });
        }

        await fiatProvider.writePoints(points);
    };
};
