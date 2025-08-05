import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readMigrationFiles } from 'drizzle-orm/migrator'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function compileMigrations() {
  const migrations = readMigrationFiles({ migrationsFolder: './src/drizzle/migrations' })

  await writeFile(
    join(__dirname, './src/drizzle/migrations.json'),
    JSON.stringify(migrations),
    'utf8',
  )

  console.log('Migrations compiled!')
}

compileMigrations().catch((err) => {
  console.error('Failed to compile migrations:', err)
  process.exit(1)
})
