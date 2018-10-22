import express from 'express';
import { InfluxDB } from 'influx';
import bodyParser from 'body-parser';
import { createLogger } from './logger';
import { errorHandler } from './error-handler';

import { Measurements } from 'common/influx-database';


const getAssets = (influxConnection: InfluxDB) => {
    return async (_req: express.Request, res: express.Response, next: AnyFunc) => {
        try {
            const response = await influxConnection.query(`select * from ${Measurements.FiatRate}`);
            console.log(response);
        } catch (error) {
            next(error);
            return;
        }

        res.status(200).send({
            data: {
                BTC: {
                    BTC: 1,
                    USD: 1000,
                    EUR: 940,
                    UAH: 177000,
                },
                LTC: {
                    BTC: 0.00041,
                    USD: 2019,
                    EUR: 940,
                    UAH: 1438,
                },
            },
        });
    };
};


export const createApiRouter = (influxConnection: InfluxDB): express.Router => {
    const apiRouter = express.Router();

    apiRouter.use(bodyParser.json({ type: 'application/json' }));
    apiRouter.use(createLogger());

    apiRouter.get('/rate/:assets', getAssets(influxConnection));

    apiRouter.use(errorHandler);

    return apiRouter;
};
