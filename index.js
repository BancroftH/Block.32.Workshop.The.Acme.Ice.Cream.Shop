const pg = require('pg');
const express = require('express');
const app = express();
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_icecream_db');

app.use(express.json());
app.use(require('morgan')('dev'));

// CREATE
// CREATE Route for flavors
app.post('/api/flavors', async (req, res, next) => {
    try {
        const { name, is_favorite } = req.body;
        const SQL = /* sql */ `
            INSERT INTO flavors(name, is_favorite)
            VALUES ($1, $2)
            RETURNING *
        `;
        const response = await client.query(SQL, [name, is_favorite]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

// GET Route to retrieve all flavors
app.get('/api/flavors', async (req, res, next) => {
    try {
        const SQL = /* sql */ `
            SELECT * FROM flavors
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
});

// GET Route to retrieve a single flavor by ID
app.get('/api/flavors/:id', async (req, res, next) => {
    try {
        const flavorId = req.params.id;
        const SQL = /* sql */ `
            SELECT * FROM flavors WHERE id = $1
        `;
        const response = await client.query(SQL, [flavorId]);
        if (response.rows.length === 0) {
            res.status(404).json({ error: 'Flavor not found' });
        } else {
            res.send(response.rows[0]);
        }
    } catch (error) {
        next(error);
    }
});

// DELETE Route to delete a flavor by ID
app.delete('/api/flavors/:id', async (req, res, next) => {
    try {
        const flavorId = req.params.id;
        const SQL = /* sql */ `
            DELETE FROM flavors WHERE id = $1
        `;
        await client.query(SQL, [flavorId]);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// PUT Route to update a flavor by ID
app.put('/api/flavors/:id', async (req, res, next) => {
    try {
        const flavorId = req.params.id;
        const { name, is_favorite } = req.body;
        const SQL = /* sql */ `
            UPDATE flavors
            SET name = $1, is_favorite = $2, updated_at = now()
            WHERE id = $3
            RETURNING *
        `;
        const response = await client.query(SQL, [name, is_favorite, flavorId]);
        if (response.rows.length === 0) {
            res.status(404).json({ error: 'Flavor not found' });
        } else {
            res.send(response.rows[0]);
        }
    } catch (error) {
        next(error);
    }
});

// Database initialization and server startup
const init = async () => {
    try {
        await client.connect();
        console.log('Connected to database');

        let SQL = `
            DROP TABLE IF EXISTS flavors;
            CREATE TABLE flavors (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                is_favorite BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now()
            );
        `;
        await client.query(SQL);
        console.log('Tables created');

        SQL = /* sql */ `
            INSERT INTO flavors(name, is_favorite) VALUES
            ('Chocolate', true),
            ('Vanilla', false),
            ('Strawberry', true),
            ('Mint Chip', false),
            ('Cookie Dough', true);
        `;
        await client.query(SQL);
        console.log('Data seeded');

        const port = process.env.PORT || 3000;
        app.listen(port, () => console.log(`Listening on port ${port}`));
    } catch (error) {
        console.error('Error initializing application:', error);
        process.exit(1);
    }
};

init();