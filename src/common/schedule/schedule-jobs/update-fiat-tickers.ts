import { InfluxDB, IPoint } from 'influx';
import { chunk, forEach } from 'lodash';
import Axios from 'axios';
import config from 'config';
import FiatRateProvider from 'common/providers/fiat-rate-provider';


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



const currencyConfig = config.get<CurrencyConfigUnit>('currency');
if (!currencyConfig) {
    throw new Error('Currency config must be implemented!');
}

const axios = Axios.create({
    baseURL: 'https://free.currencyconverterapi.com/api/v6',
});


export default (influxConnection: InfluxDB) => {
    const fiatProvider = new FiatRateProvider(influxConnection);

    return async (): Promise<void> => {

        const points: IPoint[] = [];

        for (let symbols of chunk(currencyConfig.fiats, 2)) {
            const response = await axios.get<ConverterResponse>('/convert', {
                params: {
                    q: symbols.map((symbol: string) => 'USD_' + symbol).join(','),
                },
            });

            const { results } = response.data;

            if (!results) {
                continue;
            }

            forEach(results, (ticker: TickerInfo) => {
                points.push(FiatRateProvider.mapPoint(ticker.to, ticker.val));
            });
        }

        await fiatProvider.writePoints(points);
    };
};
