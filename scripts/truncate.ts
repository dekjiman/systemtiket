import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://postgres:sqladmin@localhost:5432/db_tiket',
})

async function truncateAll() {
  const client = await pool.connect()
  
  try {
    // Get all tables
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `)
    
    const tables = tablesResult.rows.map(row => row.tablename)
    console.log(`Found ${tables.length} tables:`, tables.join(', '))
    
    // Disable triggers temporarily
    await client.query('DROP TABLE IF EXISTS ' + tables.map(t => `"${t}"`).join(', ') + ' CASCADE')
    
    console.log('\n✅ All tables dropped successfully!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

truncateAll()