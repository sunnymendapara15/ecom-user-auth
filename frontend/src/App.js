import { useEffect, useState } from 'react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const Message = ({ message }) => {
  if (!message) return null;
  return (
    <div className={`message ${message.type}`}>
      <p>{message.text}</p>
    </div>
  );
};

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('ecom_token'));
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('ecom_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: '' });
  const [message, setMessage] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const isAuthed = Boolean(token);

  useEffect(() => {
    if (isAuthed) {
      fetchUsers();
    } else {
      setUsers([]);
      setSelectedUser(null);
    }
  }, [isAuthed]);

  const handleMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch(`${API_BASE}/api/users`, { headers });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      const payload = await response.json();
      if (!response.ok) {
        handleMessage(payload.message || 'Unable to load users', 'error');
        return;
      }
      setUsers(payload.users);
    } catch (error) {
      handleMessage('Unable to reach backend', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const payload = await response.json();
      if (!response.ok) {
        handleMessage(payload.message || 'Login failed', 'error');
        return;
      }
      localStorage.setItem('ecom_token', payload.token);
      localStorage.setItem('ecom_user', JSON.stringify(payload.user));
      setToken(payload.token);
      setCurrentUser(payload.user);
      handleMessage('Login successful', 'success');
    } catch (error) {
      handleMessage('Unable to reach backend', 'error');
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm),
      });
      const payload = await response.json();
      if (!response.ok) {
        handleMessage(payload.message || 'Signup failed', 'error');
        return;
      }
      handleMessage('Signup succeeded! You are now logged in.', 'success');
      localStorage.setItem('ecom_token', payload.token);
      localStorage.setItem('ecom_user', JSON.stringify(payload.user));
      setToken(payload.token);
      setCurrentUser(payload.user);
      setSignupForm({ name: '', email: '', password: '' });
    } catch (error) {
      handleMessage('Unable to reach backend', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ecom_token');
    localStorage.removeItem('ecom_user');
    setToken(null);
    setCurrentUser(null);
    setUsers([]);
    handleMessage('You have been logged out', 'info');
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setUserForm({ name: user.name, email: user.email, role: user.role });
  };

  const handleUserUpdate = async (event) => {
    event.preventDefault();
    if (!selectedUser) return;
    try {
      const response = await fetch(`${API_BASE}/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(userForm),
      });
      const payload = await response.json();
      if (!response.ok) {
        handleMessage(payload.message || 'Unable to save', 'error');
        return;
      }
      handleMessage('User updated', 'success');
      setSelectedUser(payload.user);
      setUsers((prev) => prev.map((user) => (user.id === payload.user.id ? payload.user : user)));
    } catch (error) {
      handleMessage('Unable to reach backend', 'error');
    }
  };

  const handleUserDelete = async () => {
    if (!selectedUser || !window.confirm('Remove this user?')) return;
    try {
      const response = await fetch(`${API_BASE}/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        const payload = await response.json();
        handleMessage(payload.message || 'Unable to delete', 'error');
        return;
      }
      handleMessage('User deleted', 'success');
      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));
      setSelectedUser(null);
      setUserForm({ name: '', email: '', role: '' });
    } catch (error) {
      handleMessage('Unable to reach backend', 'error');
    }
  };

  const authSection = (
    <section className="auth-grid">
      <div>
        <h2>Login</h2>
        <form onSubmit={handleLogin} className="form-card">
          <label>
            Email
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </label>
          <button type="submit">Login</button>
        </form>
      </div>
      <div>
        <h2>Signup</h2>
        <form onSubmit={handleSignup} className="form-card">
          <label>
            Name
            <input
              type="text"
              value={signupForm.name}
              onChange={(e) => setSignupForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={signupForm.email}
              onChange={(e) => setSignupForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={signupForm.password}
              onChange={(e) => setSignupForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </label>
          <button type="submit">Create Account</button>
        </form>
      </div>
    </section>
  );

  const adminSection = (
    <section className="admin-panel">
      <div className="panel-header">
        <h2>User administration</h2>
        <button className="ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="users-layout">
        <div className="user-list">
          <div className="list-header">
            <p>Click a user to edit</p>
            {loadingUsers && <span className="loading">Refreshing…</span>}
          </div>
          <ul>
            {users.map((user) => (
              <li
                key={user.id}
                className={selectedUser?.id === user.id ? 'selected' : ''}
                onClick={() => selectUser(user)}
              >
                <strong>{user.name}</strong>
                <span>{user.email}</span>
                <small>{user.role}</small>
              </li>
            ))}
            {users.length === 0 && <li className="empty">No users yet</li>}
          </ul>
        </div>
        <div className="user-form">
          <h3>{selectedUser ? 'Edit user' : 'Select a user'}</h3>
          {selectedUser ? (
            <form onSubmit={handleUserUpdate} className="form-card">
              <label>
                Name
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </label>
              <label>
                Role
                <input
                  type="text"
                  value={userForm.role}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}
                />
              </label>
              <div className="form-actions">
                <button type="submit">Save changes</button>
                <button type="button" className="ghost" onClick={handleUserDelete}>
                  Delete user
                </button>
              </div>
            </form>
          ) : (
            <p className="empty">Select a user to edit from the list.</p>
          )}
        </div>
      </div>
    </section>
  );

  return (
    <div className="app-shell">
      <header>
        <div>
          <h1>E-commerce user console</h1>
          <p>Login, register, and manage customers from one place.</p>
        </div>
        {currentUser && (
          <div className="user-chip">
            <span>{currentUser.name}</span>
            <small>{currentUser.email}</small>
          </div>
        )}
      </header>
      <main>
        <Message message={message} />
        {!isAuthed ? authSection : adminSection}
      </main>
      <footer>
        <small>Connected to: {API_BASE.replace('http://', '')}</small>
      </footer>
    </div>
  );
}

export default App;
