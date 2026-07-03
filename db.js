const { Pool } = require('pg');

// Konfigurasi koneksi ke database lokal
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_T74cdWsOunVR@ep-floral-leaf-atar110d.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

pool.connect()
    .then(() => console.log('Sukses terhubung ke PostgreSQL!'))
    .catch(err => console.error('Gagal koneksi ke database:', err.stack));

module.exports = pool;

