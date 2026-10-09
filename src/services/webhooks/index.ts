import fastify from 'fastify';
import { rwWh } from '../remnawave/webhook.js';
import { plWh } from '../platega/webhook.js';

export const serverFastify = () => {
    const server = fastify();

    server.register(rwWh);
    server.register(plWh);

    server.listen({ host: '0.0.0.0', port: 6663 }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server listening at ${address}`);
    });
};
