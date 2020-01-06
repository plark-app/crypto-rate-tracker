import express from 'express';
import { get } from 'lodash';
import moment from 'moment';
import { InfluxDB } from 'influx';
import bodyParser from 'body-parser';
import config from 'config';
import logger from 'common/logger';
import { HttpError } from 'common/http-errors';
import CryptoPriceProvider, { CoinQuote } from 'common/providers/crypto-price-provider';
import { createHttpLogger } from './logger';
import { errorHandler } from './error-handler';


function getAssets(coinSymbols: string[]) {
    return async (req: express.Request, res: express.Response, next: AnyFunc) => {
        const influxConnection: InfluxDB = req.app.get('influx');
        const fiatProvider = new CryptoPriceProvider(influxConnection);

        const simple = Boolean(get(req.query, 'simple', false));
        const reqSymbols = (req.params.symbols || '').split(',');

        if (reqSymbols.length === 0) {
            return next(new HttpError('Must to check symbols', 400));
        }

        for (let symbol of reqSymbols) {
            if (coinSymbols.indexOf(symbol) < 0) {
                return next(new HttpError(`Invalid symbol ${symbol}`, 400));
            }
        }

        let response: Record<string, CoinQuote[]> = {};

        for (let symbol of reqSymbols) {
            let quotes: CoinQuote[] = [];
            try {
                quotes = await fiatProvider.getCoinQuotes(symbol, simple);
            } catch (error) {
                logger.error(error);

                continue;
            }

            response[symbol] = quotes;
        }

        res.status(200).send({
            result: response,
        });
    };
}


function getDailyChart(coinSymbols: string[]) {
    return async (req: express.Request, res: express.Response, next: AnyFunc) => {
        const influxConnection: InfluxDB = req.app.get('influx');
        const fiatProvider = new CryptoPriceProvider(influxConnection);

        const reqSymbols = (req.params.symbols || '').split(',');

        if (reqSymbols.length === 0) {
            return next(new HttpError('Must to check symbols', 400));
        }

        for (let symbol of reqSymbols) {
            if (coinSymbols.indexOf(symbol) < 0) {
                return next(new HttpError(`Invalid symbol ${symbol}`, 400));
            }
        }

        let response: Record<string, number[]> = {};
        const fromTime = moment().startOf('hour').subtract(23, 'hours');

        for (let symbol of reqSymbols) {
            let quotes: number[] = [];
            try {
                quotes = await fiatProvider.getCoinDailyChart(symbol, fromTime.unix());
            } catch (error) {
                logger.error(error);

                continue;
            }

            response[symbol] = quotes;
        }

        res.status(200).send({
            result: response,
        });
    };
}


export default (): express.Router => {
    const coinSymbols: string[] = config.get<string[]>('currency.coins') as string[];

    if (!coinSymbols || coinSymbols.length === 0) {
        throw new Error(`Coins must be provided in config`);
    }

    const apiRouter = express.Router();

    apiRouter.use(bodyParser.json({ type: 'application/json' }));
    apiRouter.use(createHttpLogger());

    apiRouter.get('/rate/:symbols', getAssets(coinSymbols));
    apiRouter.get('/daily-chart/:symbols', getDailyChart(coinSymbols));

    apiRouter.use(errorHandler);

    return apiRouter;
};
