require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const supabaseAdmin = require('../src/config/supabase');
const { User, sequelize } = require('../src/models');

const DEMOS = [
  { name: 'Admin User', email: 'admin123@gmail.com', password: 'Admin123', role: 'admin' },
  { name: 'Agency Admin', email: 'agency@example.com', password: 'Password@123', role: 'agency_admin' },
  { name: 'Driver User', email: 'driver@example.com', password: 'Password@123', role: 'driver' },
  { name: 'Traveler One', email: 'traveler@example.com', password: 'Password@123', role: 'traveler' },
  { name: 'Traveler Two', email: 'traveler2@example.com', password: 'Password@123', role: 'traveler' },
  { name: 'Ramesh Kumar', email: 'ramesh@example.com', password: 'Password@123', role: 'driver' },
];

async function getAuthUserId(email) {
  const isLocal = process.env.DATABASE_URL?.includes('127.0.0.1') || process.env.DATABASE_URL?.includes('localhost');
  const dbSsl = process.env.DB_SSL === 'true';
  const ssl = dbSsl || (process.env.DATABASE_URL && !isLocal) ? { rejectUnauthorized: false } : false;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: ssl,
  });
  await client.connect();
  try {
    const res = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
    if (res.rows.length > 0) {
      return res.rows[0].id;
    }
    return null;
  } finally {
    await client.end();
  }
}

async function createViaSQL(email, password) {
  const isLocal = process.env.DATABASE_URL?.includes('127.0.0.1') || process.env.DATABASE_URL?.includes('localhost');
  const dbSsl = process.env.DB_SSL === 'true';
  const ssl = dbSsl || (process.env.DATABASE_URL && !isLocal) ? { rejectUnauthorized: false } : false;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: ssl,
  });
  await client.connect();
  try {
    const hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    await client.query(
      `INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        confirmation_sent_at, confirmation_token, recovery_token,
        email_change_token_new, email_change, phone_change, phone_change_token,
        email_change_token_current, reauthentication_token,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        role, aud, is_sso_user, deleted_at
      ) VALUES (
        $1, $2, $3, $4, NOW(),
        NOW(), '', '',
        '', '', '', '',
        '', '',
        '{"provider":"email","providers":["email"]}',
        '{"email_verified":true}',
        NOW(), NOW(),
        'authenticated', 'authenticated', false, null
      ) RETURNING id`,
      [id, '00000000-0000-0000-0000-000000000000', email, hash]
    );
    return id;
  } finally {
    await client.end();
  }
}

async function main() {
  await sequelize.authenticate();
  console.log('Connected to database');

  for (const demo of DEMOS) {
    const existing = await User.findOne({ where: { name: demo.name } });
    if (existing && existing.supabaseUid) {
      console.log(`✓ ${demo.email} already linked to auth user ${existing.supabaseUid}`);
      continue;
    }

    // Check if the user email already exists in auth.users
    let uid = await getAuthUserId(demo.email);
    if (uid) {
      if (existing) {
        existing.supabaseUid = uid;
        await existing.save();
      }
      console.log(`✓ Linked existing auth user for ${demo.email} (${uid})`);
      continue;
    }

    // Try Supabase Admin API first
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: demo.email,
      password: demo.password,
      email_confirm: true,
      user_metadata: { name: existing?.name || demo.name },
    });

    if (error) {
      console.log(`Admin API failed for ${demo.email}, falling back to direct SQL insert...`);
      try {
        const uid = await createViaSQL(demo.email, demo.password);
        if (existing) {
          existing.supabaseUid = uid;
          await existing.save();
        }
        console.log(`✓ Created ${demo.email} via direct SQL (${uid})`);
      } catch (sqlErr) {
        console.error(`✗ Failed for ${demo.email}: ${sqlErr.message}`);
      }
      continue;
    }

    if (existing) {
      existing.supabaseUid = data.user.id;
      await existing.save();
    }
    console.log(`✓ Created auth user for ${demo.email} (${data.user.id})`);
  }

  await sequelize.close();
  console.log('\nDone! Demo users can now sign in with their passwords.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
