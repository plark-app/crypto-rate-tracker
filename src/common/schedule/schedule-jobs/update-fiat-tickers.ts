import { InfluxDB, IPoint } from 'influx';
import { chunk, forEach, get } from 'lodash';
import Axios from 'axios';
import config from 'config';
import logger from 'common/logger';
import FiatPriceProvider from 'common/providers/fiat-price-provider';


type TickerInfo = {
    id: string;
    val: number;
    to: string;
    fr: string;
};

type ConverterResponse = {
    query: {
        count: number;
    };
    results: {
        [market_id: string]: TickerInfo;
    }
};


export default (influxConnection: InfluxDB) => {

    const currencyClient = Axios.create({
        baseURL: 'https://free.currencyconverterapi.com/api/v6',
    });

    const currencyConfig = config.get<CurrencyConfigUnit>('currency');
    if (!currencyConfig) {
        throw new Error('Currency config must be implemented!');
    }

    const fiatProvider = new FiatPriceProvider(influxConnection);
    const apiKey = get(currencyConfig, 'currencyconverterapi.apiKey');

    return async (): Promise<void> => {
        const points: IPoint[] = [];

        for (let symbols of chunk(currencyConfig.fiats, 2)) {
            let data: ConverterResponse;

            try {
                const response = await currencyClient.get<ConverterResponse>('/convert', {
                    params: {
                        apiKey: apiKey,
                        q: symbols.map((symbol: string) => 'USD_' + symbol).join(','),
                    },
                });

                data = response.data;
            } catch (error) {
                logger.error('Error on Fetch CurrencyConverterAPI', error.message);

                return;
            }

            if (!data || !data.results) {
                continue;
            }

            forEach(data.results, (ticker: TickerInfo) => {
                points.push(FiatPriceProvider.mapPoint(ticker.to, ticker.val));
            });
        }

        await fiatProvider.writePoints(points);
    };
};
