import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert } from "typeorm"
import Model from "./model.entity"
import * as bcrypt from 'bcryptjs';

export enum RoleEnumType {
    USER = 'user',
    ADMIN = 'admin'
}

@Entity('users')
export class User extends Model {
    @Column()
    username: string

    @Column({
        unique: true
    })
    email: string

    @Column()
    password: string

    @Column({
        type: 'enum',
        enum: RoleEnumType,
        default: RoleEnumType.USER
    })
    role: RoleEnumType.USER

    toJSON(){
        return {...this, password: undefined}
    }

    @BeforeInsert()
    async hashedPassword(){
        this.password = await bcrypt.hash(this.password, 12)
    }

    static async comparePasswords(
        candidatePassword: string,
        hashedPassword: string
      ) {
        return await bcrypt.compare(candidatePassword, hashedPassword);
      }


}
