import fp from 'fastify-plugin';

async function authPlugin(fastify) {
  fastify.decorate('verifyAuth', async function (req, reply) {
    const token = req.cookies.logintoken;
    if (!token) return reply.code(401).send({ error: 'Missing token' });

    const { value, valid } = reply.unsignCookie(token);
    if (!valid) return reply.code(401).send({ error: 'Invalid cookie' });

    req.user = await fastify.jwt.verify(value);
  });
}

export default fp(authPlugin);
