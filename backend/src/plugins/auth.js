import fp from 'fastify-plugin';

async function authPlugin(fastify) {
  fastify.decorate('verifyAuth', async function (req, reply) {
    const token = req.cookies.logintoken;
    if (!token) {
      return reply.code(401).send({ error: 'Missing token' });
    }

    const { value, valid } = reply.unsignCookie(token);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid cookie signature' });
    }

    try {
      const decoded = await fastify.jwt.verify(value);

      // Check Redis for valid session
      const sessionData = await fastify.redis.get(decoded.id);
      if (!sessionData) {
        return reply.code(401).send({ error: 'Session not found' });
      }

      const parsed = JSON.parse(sessionData);
      if (parsed.sessionId !== decoded.sessionId) {
        return reply.code(401).send({ error: 'Session mismatch' });
      }

      req.user = decoded;
    } catch (err) {
      req.log.warn('JWT verification failed:', err);
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}

export default fp(authPlugin);
