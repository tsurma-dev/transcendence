import app from './app.js';

const start = async () => {
  try {
    await app.listen({ port: 8443, host: '0.0.0.0' });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
