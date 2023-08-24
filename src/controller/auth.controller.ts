import config  from "config";
import { CookieOptions, NextFunction, Request, Response } from 'express';

import {
  createUser,
  findUserByEmail,
  findUserById,
  signTokens,
} from '../services/user.service';

import {redisClient} from '../utils/connectRedis';
import { signJwt, verifyJwt } from '../utils/jwt';
import { User } from '../entity/User';
import { CreateUserInput } from "../schemas/user.schema";

const cookiesOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
}

if (process.env.NODE_ENV === 'production') cookiesOptions.secure = true;

const accessTokenCookieOptions: CookieOptions = {
    ...cookiesOptions,
    expires: new Date(
      Date.now() + config.get<number>('accessTokenExpiresIn') * 60 * 1000
    ),
    maxAge: config.get<number>('accessTokenExpiresIn') * 60 * 1000,
  };


  const refreshTokenCookieOptions: CookieOptions = {
    ...cookiesOptions,
    expires: new Date(
      Date.now() + config.get<number>('refreshTokenExpiresIn') * 60 * 1000
    ),
    maxAge: config.get<number>('refreshTokenExpiresIn') * 60 * 1000,
  };


  export const requestUserHandler = async(
    req: Request<{}, {}, CreateUserInput>,
    res: Response,
    next: NextFunction
  ) =>{
    try{
        const{username, password, email} = req.body

        const user = await createUser({
            username,
            email: email.toLowerCase(),
            password
        })

        res.status(201).json({
            status: 'success',
            data:{
                user
            }
        })
    } catch(err: any){
        if(err.code === '23505'){
            return res.status(409).json({
                status: 'fail',
                message: 'User with that email already exists'
            })
        }
        next(err)
    }

  }