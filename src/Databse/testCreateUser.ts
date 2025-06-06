import { UserRepository } from './UserRepository';

function testCreateUser() {
  const username = 'alice';
  const email = 'alice@example.com';
  const passwordHash = 'hashed_password_here';

  const newUser = UserRepository.createUser(username, email, passwordHash);

  if (newUser) {
    console.log('User created successfully:', newUser);
  } else {
    console.log('Failed to create user (username or email may already exist)');
  }
}

testCreateUser();
