import express from 'express'
const app = express()
import dotenv from 'dotenv'
import db from './db.js'
import { randomInt } from 'crypto'
app.use(express.json())

app.post('/api/location', async (req, res) => {
    try {
        const { loc_code, type, parentId } = req.body
        //1 is store and 2 is child
        let query;
        let paramenter;
        let randomIntId = randomInt(10, 1000)
        if (type == 1) {
            query = `Insert into locations(loc_code,type,parent_id,status) values($1,$2,$3,$4)`
            paramenter = [`I-${randomIntId}`, type, null, 1]
        } else {
            query = `Insert into locations(loc_code,type,parent_id,status) values($1,$2,$3,$4)`
            paramenter = [`I-${randomIntId}`, type, parentId, 1]
        }

        let info = await db.query(query, paramenter)

        res.status(200).json({
            message: (info.rowCount > 0) ? "Insert Records Successfully" : "Insert Records Unsuccessfully"
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})

app.get('/api/locations/tree/:storeId', async (req, res) => {
    try {
        let id = req.params.storeId

        //check id in location table
        let store = await db.query(`select id from locations where id = $1 and status = 1`, [id])

        if (store.rowCount === 0) {
            return res.status(404).json({
                message: "Id is not found"
            })
        }

        async function buildTree(parentId) {
            const childrenResult = await db.query(
                `SELECT id, loc_code
                 FROM locations
                 WHERE parent_id = $1
                 AND status = 1`,
                [parentId]
            );

            const children = [];

            for (const child of childrenResult.rows) {
                const nestedChildren = await buildTree(child.id);

                const node = {
                    locCode: child.loc_code
                };

                if (nestedChildren.length > 0) {
                    node.children = nestedChildren;
                }

                children.push(node);
            }

            return children;
        }

        const tree = {
            storeId: store.rows[0].id,
            storeCode: store.rows[0].loc_code,
            children: await buildTree(store.rows[0].id)
        };
        res.status(200).json({
            message: "Fetch Records Successfully",
            data: tree
        })


    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})

app.get('/api/locations/:storeId/desc', async (req, res) => {
    try {
        const id = req.params.storeId

        const fetchInfo = await db.query(`
                    WITH RECURSIVE descendants AS (
                        SELECT id, loc_code, parent_id
                        FROM locations
                        WHERE parent_id = $1
                        AND status = 1

                        UNION ALL

                        SELECT l.id, l.loc_code, l.parent_id
                        FROM locations l
                        INNER JOIN descendants d
                            ON l.parent_id = d.id
                        WHERE l.status = 1
                    )
                    SELECT ARRAY_AGG(loc_code) AS descendants
                    FROM descendants
                `, [id]);

        res.status(200).json({
            message: (fetchInfo.rowCount > 0) ? "Fetch Successfully" : "Unsuccessfully",
            data: {
                storeId: Number(id),
                descendants: fetchInfo.rows[0]?.descendants || []
            }
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})

app.delete('/api/location/:storeId', async (req, res) => {
    try {
        const id = req.params.storeId
        if (id.rowCount == 0) {
            return res.status(404).json({
                message: "Id is not found"
            })
        }

        let deleteInfo = await db.query(`Update locations set status = $1 where id = $2`, [0, id])

        res.status(200).json({
            message: (deleteInfo.rowCount > 0) ? "Delete Data Successfully" : "UnSuccessfully"
        })

    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})


app.listen(4000, () => {
    console.log("runing app")
})