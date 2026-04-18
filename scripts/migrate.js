const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:sqladmin@localhost:5432/db_tiket',
})

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS lineup TEXT,
      ADD COLUMN IF NOT EXISTS rundown TEXT,
      ADD COLUMN IF NOT EXISTS venue_map_url TEXT,
      ADD COLUMN IF NOT EXISTS venue_latitude TEXT,
      ADD COLUMN IF NOT EXISTS venue_longitude TEXT
    `)
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()