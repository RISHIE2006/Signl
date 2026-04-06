const fs = require('fs');

async function createUser() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const secretKeyMatch = envFile.match(/CLERK_SECRET_KEY=(.+)/);
  if (!secretKeyMatch) {
    console.log('No secret key found');
    return;
  }
  const secretKey = secretKeyMatch[1].trim();

  try {
    const res = await fetch('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: ['rishiejha@outlook.com'],
        username: 'RishieJha',
        password: 'Password123!',
        first_name: 'Rishie',
        last_name: 'Jha',
        skip_password_checks: true,
        skip_password_requirement: true
      })
    });

    const data = await res.json();
    if (res.ok) {
      console.log('SUCCESS: User created! You can now log in.');
    } else {
      console.log('ERROR:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}

createUser();
