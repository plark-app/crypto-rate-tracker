import express from 'express';
import { InfluxDB } from 'influx';
import bodyParser from 'body-parser';
import config from 'config';
import logger from 'common/logger';
import { HttpError } from 'common/http-errors';
import CryptoPriceProvider, { CoinQuote } from 'common/providers/crypto-price-provider';
import { createHttpLogger } from './logger';
import { errorHandler } from './error-handler';


const getAssets = () => {
    const coinSymbols: string[] = config.get<string[]>('currency.coins') as string[];

    if (!coinSymbols || coinSymbols.length === 0) {
        throw new Error(`Coins must be provided in config`);
    }

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

        let response: Record<string, CoinQuote[]> = {};

        for (let symbol of reqSymbols) {
            let quotes: CoinQuote[] = [];
            try {
                quotes = await fiatProvider.getCoinQuotes(symbol);
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
};


export default (): express.Router => {
    const apiRouter = express.Router();

    apiRouter.use(bodyParser.json({ type: 'application/json' }));
    apiRouter.use(createHttpLogger());

    apiRouter.get('/rate/:symbols', getAssets());

    apiRouter.use(errorHandler);

    return apiRouter;
};
