const express = require('express');
const { Pool } = require('pg');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Подключение к базе Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Создание таблиц
pool.query(`
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, 
        name TEXT, 
        email TEXT UNIQUE NOT NULL, 
        password TEXT NOT NULL
    )
`);

// Маршрут РЕГИСТРАЦИИ
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, password]);
        res.json({ success: true, message: "Регистрация успешна!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Email уже зарегистрирован" });
    }
});

// Маршрут ВХОДА
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
        if (result.rows.length > 0) {
            res.json({ success: true, name: result.rows[0].name });
        } else {
            res.status(401).json({ success: false, message: "Неверный логин или пароль" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Server is running..."));
