import jwt from '@fastify/jwt';
import Fastify from 'fastify';
const app = Fastify();
app.register(jwt, { secret: 'replace-this-before-production' });
app.ready(async () => {
  const token = app.jwt.sign({ userId: 'cm0ab1j5w000499o2w01f0g0d', telegramId: '123' });
  const res = await fetch('https://gemet-api.onrender.com/auctions/cm0ab1j5w000499o2w01f0g0d/pay', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` }
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.json());
});
