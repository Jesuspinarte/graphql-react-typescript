import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import connectRedis from 'connect-redis';
import express from 'express';
import { MikroORM } from '@mikro-orm/core';
import redis from 'redis';
import session from 'express-session';

import { HelloResolver } from './resolvers/hello.resolver';
import microConfig from './config/mikro-orm.config';
import { MyContext } from './utils/types';
import { __prod__ } from './utils/constants';
import { PostResolver } from './resolvers/post.resolver';
import { UserResolver } from './resolvers/user.resolver';

const main = async () => {
  console.clear();
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();

  const app = express();

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  app.use(
    session({
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: 'lax',
        secure: __prod__, // cookie only works in https
      },
      name: 'qid',
      resave: false,
      secret: process.env.SECRET_SESSIONS_HASH || '',
      saveUninitialized: false,
      store: new RedisStore({ client: redisClient, disableTouch: true }),
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
  });

  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log('Server started on http://localhost:4000/graphql');
  });
};

main().catch(err => {
  console.error(err);
});
