// config/db.js
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'azim404',
    waitForConnections: true,
    connectionLimit: 10,
});

export async function query(sql, params = []) {
    const [results] = await pool.execute(sql, params);
    return results;
}

export async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL connecté');
        connection.release();
        return true;
    } catch (error) {
        console.error('Erreur MySQL:', error.message);
        return false;
    }
}

export default pool;
