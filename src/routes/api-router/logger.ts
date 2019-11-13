import express from 'express';
import morgan, { TokenIndexer } from 'morgan';
import logger from 'common/logger';

function logFormatter(tokens: TokenIndexer, req: express.Request, res: express.Response): string | undefined {
    const method = tokens.method(req, res);
    const url = tokens.url(req, res);
    const status = tokens.status(req, res);
    const responseTime = tokens['response-time'](req, res);

    logger.info(
        `${method} ${url} - ${status} / ${responseTime} ms`,
        {
            params: {
                method: method,
                status: status,
                responseTime: responseTime,
                url: url,
            },
        },
    );

    return undefined;
}

export const createHttpLogger = () => morgan(logFormatter as any);
