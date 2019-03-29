import express from 'express';

export default (): express.Router => {
    const apiRouter = express.Router();

    apiRouter.get('/', (_req: express.Request, res: express.Response, _next: AnyFunc) => {

        res.status(200).send({
            success: true,
        });
    });

    return apiRouter;
};