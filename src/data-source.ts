import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "batyr.db.elephantsql.com",
    port: 5432,
    username: "dcwrrrxb",
    password: "oJkKE5gjWrtZvjrDhoTp9vTEJekSbhC0",
    database: "dcwrrrxb",
    synchronize: true,
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
})
