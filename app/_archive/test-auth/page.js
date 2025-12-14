'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function TestAuth() {
  const { user, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    const { error } = await signIn(email, password);
    if (error) alert(error.message);
  };

  const handleSignUp = async () => {
    const { error } = await signUp(email, password);
    if (error) alert(error.message);
  };

  return (
    <div style={{ padding: '2rem' }}>
      {user ? (
        <>
          <h2>Welcome, {user.email}</h2>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <>
          <h2>Sign In or Sign Up</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleSignIn}>Sign In</button>
          <button onClick={handleSignUp}>Sign Up</button>
        </>
      )}
    </div>
  );
}
