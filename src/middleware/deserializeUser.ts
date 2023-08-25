import { NextFunction, Request, Response } from 'express';
import { findUserById } from '../services/user.service';

import {redisClient} from '../utils/connectRedis';
import { verifyJwt } from '../utils/jwt';

export const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let access_token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      access_token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.access_token) {
      access_token = req.cookies.access_token;
    }

    if (!access_token) {
      return next(res.status(401).json('You are not logged in'));
    }

    // Validate the access token
    const decoded = verifyJwt<{ sub: string }>(
      access_token,
      'accessTokenPublicKey'
    );

    if (!decoded) {
      return next(res.status(401).json('You are not logged in'));
    }

    // Check if the user has a valid session
    const session = await redisClient.get(decoded.sub);

    if (!session) {
      return next(res.status(401).json('You are not logged in'));
    }

    // Check if the user still exist
    const user = await findUserById(JSON.parse(session).id);

    if (!user) {
      return next(res.status(401).json('You are not logged in'));
    }

    // Add user to res.locals
    res.locals.user = user;

    next();
  } catch (err: any) {
    next(err);
  }
};

