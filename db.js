import pkg from 'pg'
const { Pool: pool } = pkg
import dotenv from 'dotenv'
dotenv.config({ path: `${process.cwd()}/.env` })

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD
}

const db = new pool(config)

export default db