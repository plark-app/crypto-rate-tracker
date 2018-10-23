import express from 'express';
import { InfluxDB } from 'influx';
import bodyParser from 'body-parser';
import config from 'config';
import { HttpError } from 'common/http-errors';
import CryptoRateProvider, { CoinQuote } from 'common/providers/crypto-rate-provider';
import { createLogger } from './logger';
import { errorHandler } from './error-handler';


const getAssets = (influxConnection: InfluxDB) => {

    const coinMap: string[] = config.get<string[]>('currency.coins') as string[];

    if (!coinMap || coinMap.length === 0) {
        throw new Error(`Coin list must be provided`);
    }

    const fiatProvider = new CryptoRateProvider(influxConnection);

    return async (req: express.Request, res: express.Response, next: AnyFunc) => {
        const reqSymbols = (req.params.symbols || '').split(',');

        if (reqSymbols.length === 0) {
            return next(new HttpError('No symbols', 400));
        }

        for (let symbol of reqSymbols) {
            if (coinMap.indexOf(symbol) < 0) {
                return next(new HttpError(`Invalid symbol ${symbol}`, 400));
            }
        }

        let response: Record<string, CoinQuote[]> = {};

        for (let symbol of reqSymbols) {
            let quotes: CoinQuote[] = [];
            try {
                quotes = await fiatProvider.getCoinQuotes(symbol);
            } catch (error) {
                console.log(error);
                continue;
            }

            response[symbol] = quotes;
        }

        res.status(200).send({
            result: response,
        });
    };
};


export const createApiRouter = (influxConnection: InfluxDB): express.Router => {
    const apiRouter = express.Router();

    apiRouter.use(bodyParser.json({ type: 'application/json' }));
    apiRouter.use(createLogger());

    apiRouter.get('/rate/:symbols', getAssets(influxConnection));

    apiRouter.use(errorHandler);

    return apiRouter;
};
