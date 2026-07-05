const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:12345@localhost:5432/bos_fifa_db'
});

pool.on('error', (err) => {
    console.error('Koneksi database terputus:', err.message);
});

pool.connect()
    .then(() => console.log('Sukses terhubung ke PostgreSQL LOKAL!'))
    .catch(err => console.error('Gagal koneksi ke database:', err.stack));

module.exports = pool;