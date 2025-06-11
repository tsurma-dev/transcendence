export async function verifyAuth(request, reply) {
  try {
    const token = request.cookies.logintoken;

    if (!token) {
      return reply.code(401).send({ error: 'Missing authentication token' });
    }

    const { value, valid } = request.unsignCookie(token);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid cookie signature' });
    }

    const payload = await request.server.jwt.verify(value);
    request.user = payload;

  } catch (err) {
    request.log.error(err);
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}
