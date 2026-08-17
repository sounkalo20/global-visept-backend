require('dotenv').config();
const pool = require('./src/config/db');
const { generateToken } = require('./src/utils/token');

async function test() {
  try {
    // get a caissier user
    const [memberships] = await pool.query(`
      SELECT m.*, u.email, u.id as user_id 
      FROM memberships m 
      JOIN roles r ON m.role_id = r.id 
      JOIN users u ON m.user_id = u.id 
      WHERE r.name = 'Caissier' LIMIT 1
    `);
    
    if (memberships.length === 0) {
      console.log('No caissier found');
      return;
    }
    
    const membership = memberships[0];
    const user = { id: membership.user_id, email: membership.email, role: 'user' };
    const token = generateToken(user);
    
    console.log('Testing with user:', user.email, 'company:', membership.company_id);
    
    // Test GET /cash/sessions/active
    try {
      const res = await fetch(`http://localhost:5000/api/cash/sessions/active?company_id=${membership.company_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('GET active session: status', res.status);
    } catch (e) {
      console.error('GET active session failed:', e);
    }
    
    // Test GET /cash/registers
    try {
      const res = await fetch(`http://localhost:5000/api/cash/registers?company_id=${membership.company_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('GET registers: status', res.status, data?.data?.map(r => r.name));
    } catch (e) {
      console.error('GET registers failed:', e);
    }

    // Test POST /cash/sessions/open
    try {
      const res = await fetch(`http://localhost:5000/api/cash/sessions/open`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: membership.company_id,
          cash_register_id: 1, // dummy
          opening_amount: 100
        })
      });
      console.log('POST open session: status', res.status);
      if (res.status === 403) console.log(await res.text());
    } catch (e) {
      console.error('POST open session failed:', e);
    }

  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

test();
