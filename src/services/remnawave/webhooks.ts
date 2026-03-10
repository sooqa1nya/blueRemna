import fastify from 'fastify';

export const serverFastify = () => {
    const server = fastify();

    server.post('/rwwebhooks', async (request, reply) => {
        const body = request.body;
        console.log(body);
        console.log('--------------------------------');
        console.log(JSON.stringify(body));
        return { received: body };
    });

    server.listen({ host: '0.0.0.0', port: 6663 }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server listening at ${address}`);
    });
};