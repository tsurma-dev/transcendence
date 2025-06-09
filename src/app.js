import Fastify from 'fastify';
import dbPlugin from './plugins/db.js';
import userRoutes from './routes/userRoutes.js';

const app = Fastify({ logger: true });

app.register(dbPlugin);
app.register(userRoutes);

export default app;
