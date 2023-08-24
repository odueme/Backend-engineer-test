import { RoleEnumType, User } from '../entity/User';
import { CreateUserInput } from '../schemas/user.schema';
import { AppDataSource } from '../data-source';
import { signJwt } from '../utils/jwt';
import config from 'config';
import {redisClient} from '../utils/connectRedis';


const userRepository = AppDataSource.getRepository(User)

export const createUser = async (input: CreateUserInput) =>{
    return (await AppDataSource.manager.save(
        AppDataSource.manager.create(User, {...input, role: RoleEnumType.USER})
    )) as User
   
};

export const findUserByEmail = async ({email}: {email: string}) => {
    return await userRepository.findOneBy({email})
}

export const findUserById = async(userId: string) =>{
    return await userRepository.findOneBy({id: userId})
}

export const findUser = async (query: Object) => {
    return await userRepository.findOneBy(query);
  };

export const signTokens = async(user: User)=>{
    redisClient.set(user.id, JSON.stringify(user), {
        EX: config.get<number>('redisCacheExpiresIn') * 60
    })

    const access_token = signJwt({sub:  user.id}, 'accessTokenPrivateKey', {
        expiresIn: `${config.get<number>('accessTokenExpiresIn')}m`
    })

    const refresh_token = signJwt({sub: user.id}, 'refreshTokenPrivateKey', {
        expiresIn: `${config.get<number>('refreshTokenExpiresIn')}m`
    })

    return {access_token, refresh_token}
}

