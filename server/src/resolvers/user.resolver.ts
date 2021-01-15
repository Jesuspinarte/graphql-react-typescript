import { User } from '../entities/User';
import { MyContext } from 'src/utils/types';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import argon2 from 'argon2';

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext) {
    // Not logged in
    if (!req.session.userId) {
      return null;
    }

    return await em.findOne(User, { id: req.session.userId });
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length < 5) {
      return {
        errors: [
          {
            field: 'username',
            message: 'Not a valid username',
          },
        ],
      };
    }

    if (options.password.length < 5) {
      return {
        errors: [
          {
            field: 'password',
            message: 'Not a valid password',
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });

    try {
      await em.persistAndFlush(user);
    } catch (error) {
      if (error.code === '23505') {
        return {
          errors: [
            {
              field: 'username',
              message: 'Username has already been taken',
            },
          ],
        };
      }
      console.error('message', error.message);
    }

    // Log in user after register
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length < 5) {
      return {
        errors: [
          {
            field: 'username',
            message: 'Not a valid username',
          },
        ],
      };
    }

    if (options.password.length < 5) {
      return {
        errors: [
          {
            field: 'password',
            message: 'Not a valid password',
          },
        ],
      };
    }

    const user = await em.findOne(User, {
      username: options.username,
    });
    if (!user) {
      return {
        errors: [
          {
            field: 'username',
            message: "Username doesn't exists",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password',
          },
        ],
      };
    }

    req.session.userId = user.id;

    return { user };
  }
}
