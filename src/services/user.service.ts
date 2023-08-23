import { RoleEnumType, User } from '../entity/User';
import { CreateUserInput } from '../schemas/user.schema';
import { AppDataSource } from '../data-source';

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