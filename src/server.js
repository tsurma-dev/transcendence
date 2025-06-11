import app from './app.js';

const start = async () => {
  try {
    await app.listen({ port: 8443 });
    console.log('Server running at https://localhost:8443');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
