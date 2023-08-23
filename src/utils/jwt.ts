import * as jwt from 'jsonwebtoken'
import config from 'config'

export const signJwt = (
    payload: Object,
    keyName: 'accessTokenPrivateKey' |  'refreshTokenPrivateKey',
    options: jwt.SignOptions
) =>{
    const privateKey = Buffer.from(
        config.get<string>(keyName),
        'base64'
    ).toString('ascii');
    return jwt.sign(payload, privateKey, {
        ...(options && options),
        algorithm: 'RS256'
    })
}