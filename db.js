import mysql from 'mysql2/promise'

import { readFileSync } from "fs"
const config = JSON.parse(readFileSync("./config.json"))
//Waiting for assert stage 4 so that it would be added to ESlint
//import config from './config.json' assert { type: 'json' }
import logger from './logger.js'

//MySQL config
const dbHost = config.db.host
const dbUser = config.db.user
const dbPwd = config.db.pwd
const dbSchema = config.db.schema

//Run MySQL query
const dbReq = async (query) => {
    const con = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPwd,
        database: dbSchema
    })
    
    logger.info(`[db.js] dbReq: Run a query to DB: ${query}`)
    const [rows, fields] = await con.query(query).catch(error => logger.error(`[db.js] dbReq: ${error}`))

    con.close()

    return rows
}

//Insert URLs to DB
const dbInsert = async (urlArr) => {
    let insertString = ''

    for (let i = 0; i < urlArr.length; i++) {
        const el = urlArr[i];
        
        if (i == 0)
            insertString += `("${el[1]}", from_unixtime(${el[0]}))`
        else
            insertString += `,("${el[1]}", from_unixtime(${el[0]}))`
    }
    
    const query = `INSERT INTO Images (URL, Date) VALUES ${insertString}`
    logger.info(`[db.js] dbInsert: Run a query to DB`)
    await dbReq(query)
}

//Get URL values with status 0
const dbGetNotSynced = async () => {
    logger.info(`[db.js] dbGetNotSynced: Get a list of not synced entries`)
    const arr = await dbReq('SELECT URL FROM Images WHERE Status = 0 ORDER BY Date')
    logger.info(`[db.js] dbGetNotSynced: Got`)

    let res = []
    arr.forEach(e => {
        res.push(e.URL)
    })
    
    return res
}

export { dbReq, dbInsert, dbGetNotSynced }