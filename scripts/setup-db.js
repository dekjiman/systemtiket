const { Client } = require('pg')

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:sqladmin@localhost:5432/db_tiket'

const client = new Client(connectionString)

async function setupDatabase() {
  try {
    await client.connect()
    console.log('Connected to database')

    // Read SQL file
    const fs = require('fs')
    const sql = fs.readFileSync('./drizzle/schema.sql', 'utf8')

    // Execute SQL
    await client.query(sql)
    console.log('✅ Database schema created successfully!')

    // Verify tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)

    console.log('\n📋 Tables created:')
    tables.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

setupDatabase()
