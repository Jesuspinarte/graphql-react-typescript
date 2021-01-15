import { Post } from '../entities/Post';
import { __prod__ } from '../utils/constants';
import path from 'path';
import { MikroORM } from '@mikro-orm/core';
import { User } from '../entities/User';

export default {
  migrations: {
    path: path.join(__dirname, './migrations'),
    pattern: /^[\w-]+\d+\.[jt]s$/,
  },
  entities: [Post, User],
  dbName: process.env.DATABASE_NAME,
  type: 'postgresql',
  debug: !__prod__,
  password: '123',
} as Parameters<typeof MikroORM.init>[0];
