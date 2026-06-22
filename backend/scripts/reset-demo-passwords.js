/**
 * Resets demo user passwords in Supabase Auth.
 * Run: node scripts/reset-demo-passwords.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const supabaseAdmin = require('../src/config/supabase');

const DEMOS = [
  { email: 'hari@gmail.com', password: 'Hari@123' },
  { email: 'agency@example.com', password: 'Agency@123' },
  { email: 'john@gmail.com', password: 'John@123' },
];

async function main() {
  for (const demo of DEMOS) {
    const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listErr) { console.error('Error listing users:', listErr.message); continue; }

    const user = users.find(u => u.email === demo.email);
    if (!user) {
      console.log(`User ${demo.email} not found in auth. Create via sync-demo-auth.js first.`);
      continue;
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: demo.password });
    if (error) {
      console.error(`Failed to reset password for ${demo.email}: ${error.message}`);
    } else {
      console.log(`Reset password for ${demo.email}: ${demo.password}`);
    }
  }

  console.log('Done!');
}

main().catch(console.error);
