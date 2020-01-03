import express from 'express';

export default function createRobotsRouter(_req: express.Request, res: express.Response, _next: AnyFunc) {
    res.header('Content-Type', 'text/plain; charset=UTF-8');

    res.status(200).send(
        'User-agent: *\n' +
        'Disallow: /',
    );
}
