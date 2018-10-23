import { IPoint, IResults } from 'influx';
import { Measurements, Tags } from 'common/influx-database';
import AbstractProvider from './abstract-provider';

export type FiatTicker = {
    time: Date;
    rate: number;
    symbol: string;
}

export default class FiatRateProvider extends AbstractProvider {

    public static mapPoint(symbol: string, rate: number): IPoint {
        return {
            measurement: Measurements.FiatRate,
            tags: {
                [Tags.Symbol]: symbol,
            },
            fields: {
                rate: rate,
            },
        };
    }

    public async getLasts(): Promise<Record<string, number>> {
        const response: IResults<FiatTicker> = await this.influxDatabase.query<FiatTicker>(
            `SELECT last(rate) as rate, ${Tags.Symbol} FROM ${Measurements.FiatRate} GROUP BY ${Tags.Symbol}`,
        );

        const data: Record<string, number> = {};

        response.forEach((ticker: FiatTicker) => {
            data[ticker.symbol] = ticker.rate;
        });

        return data;
    }
}
