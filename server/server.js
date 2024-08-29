import express from 'express';
import cors from 'cors';
import pg from 'pg';
import env from 'dotenv';
import bodyParser from 'body-parser';

env.config();

const app = express();
const port = 5000;
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

db.connect();

app.use(bodyParser.urlencoded({extended: true}))
app.use(cors())
app.use(express.json())

app.get('/api/:table', async (req, res) => {
    var fields = [];
    const table = req.params.table;

    try {
        const result = await db.query('SELECT column_name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = $1', [table])
        result.rows.forEach((field) => {
            fields.push(field.column_name);
        })
    } catch (err) {
        console.log(`Table was not found ${err}`);
    }

    res.send(fields);
})

app.get('/api/:table/:field', async (req, res) => {
    var tasks = [];
    const table = req.params.table;
    const field = req.params.field;

    try {
        const result = await db.query(`SELECT ${field} FROM ${table} WHERE ${field} IS NOT NULL`)
        result.rows.forEach((task) => {
            tasks.push(task[`${field}`]);
        })

    } catch (err) {
        console.error(`Field not found ${err}`)
    }

    res.send(tasks);
})

app.post('/api/add-table', async (req, res) => {
    const table = req.body.tableName;

    try {
        await db.query(
            `CREATE TABLE ${table} (
                id SERIAL PRIMARY KEY
            )`
        )
    } catch (err) {
        console.error(err);
    }
})

app.post('/api/table/add-field', async (req, res) => {
    const table = req.body.tableName;
    const field = req.body.fieldName;

    try {
        await db.query(
            `ALTER TABLE ${table} ADD ${field} TEXT`
        )
    } catch (err) {
        console.error(err);
    }
})

app.post('/api/table/field/add-task', async (req, res) => {
    const { tableName, fieldName, taskName } = req.body;

    try {
        await db.query(
        `INSERT INTO ${tableName} (${fieldName}) VALUES ($1)`
        , [taskName])
    } catch (err) {
        console.error(err)
    }
})

app.delete('/api/table/delete-field', async (req, res) => {
    const { tableName, fieldName } = req.body;

    try {
        await db.query(`ALTER TABLE ${tableName} DROP COLUMN ${fieldName}`)
    } catch (err) {
        console.error(err);
    }
})

app.delete('/api/table/field/delete-task', async (req, res) => {
    const { tableName, fieldName, taskName } = req.body;

    try {
        await db.query(`DELETE FROM ${tableName} WHERE ${fieldName} = $1`, [taskName])
    } catch (err) {
        console.error(err);
    }
})

app.listen(port, () =>{
    console.log(`Listen on port ${port}`)
})