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
import { CreateUserInput, LoginUserInput } from "../schemas/user.schema";

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


  export const registerUserHandler = async(
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


  export const loginUserHandler = async (
    req: Request<{}, {}, LoginUserInput>,
    res: Response,
    next: NextFunction
  ) =>{
    try{
      const {email, password} = req.body
      const user = findUserByEmail({email})

      if(!user || !(await User.comparePasswords(password,(await user).password))){
        return next(res.status(400).json('Invalid Email or password'));
      }

      const {access_token, refresh_token} = await signTokens(await user) 

      res.cookie('access_token', access_token, accessTokenCookieOptions)
      res.cookie('refresh_token', refresh_token, refreshTokenCookieOptions)
      res.cookie('logged_in', true, {
        ...accessTokenCookieOptions,
        httpOnly: false
      })

      res.status(200).json({
        status: 'Success',
        access_token
      })
    } catch(err){
      next(err)
    }
  }

    export const refreshAccessTokenHandler = async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try{
        const refresh_token = req.cookies.refresh_token

        const message = 'Could not refresh token'
        if(!refresh_token){
          return next(res.status(403).json(message))
        }

        const decoded = verifyJwt<{sub: String}>(
          refresh_token,
          'refreshTokenPublicKey'
        )

        if(!decoded){
          return next(res.status(403).json(message))
        }

        const session = await redisClient.get(decoded.sub);

        if(!session){
          return next(res.status(403).json(message))
        }

        const user = await findUserById(JSON.parse(session).id);

        if(!user){
          return next(res.status(403).json(message))
        }

        const access_token = signJwt({ sub: user.id }, 'accessTokenPrivateKey', {
          expiresIn: `${config.get<number>('accessTokenExpiresIn')}m`,
        });

        res.cookie('access_token', access_token, accessTokenCookieOptions);
        res.cookie('logged_in', true, {
          ...accessTokenCookieOptions,
          httpOnly: false,
        });

        res.status(200).json({
          status: 'success',
          access_token,
        });
    
      } catch(err){
        next(err);
      }
    }

    const logout = (res: Response) => {
      res.cookie('access_token', '', { maxAge: -1 });
      res.cookie('refresh_token', '', { maxAge: -1 });
      res.cookie('logged_in', '', { maxAge: -1 });
    };
    
    export const logoutHandler = async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const user = res.locals.user;
    
        await redisClient.del(user.id);
        logout(res);
    
        res.status(200).json({
          status: 'success',
        });
      } catch (err: any) {
        next(err);
      }
    };