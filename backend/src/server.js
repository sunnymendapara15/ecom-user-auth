require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { z } = require('zod');
const prisma = require('./prisma');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Expose-Headers', 'Authorization');
  next();
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Email must be valid'),
  password: z.string().min(6, 'Password must be 6+ characters'),
});

const loginSchema = z.object({
  email: z.string().email('Email must be valid'),
  password: z.string().min(6, 'Password must be 6+ characters'),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
});

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return res.status(401).json({ message: 'Invalid authorization header' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const createToken = (user) =>
  jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '12h',
  });

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors.map((e) => e.message).join(', ') });
    }
    console.error(error);
    return res.status(500).json({ message: 'Unable to register user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, password: true },
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { password: _, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword, token: createToken(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors.map((e) => e.message).join(', ') });
    }
    console.error(error);
    return res.status(500).json({ message: 'Unable to login' });
  }
});

app.get('/api/users', authMiddleware, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });
  return res.json({ users });
});

app.get('/api/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.json({ user });
});

app.put('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = updateUserSchema.parse(req.body);
    if (payload.email) {
      const existing = await prisma.user.findUnique({ where: { email: payload.email } });
      if (existing && existing.id !== id) {
        return res.status(409).json({ message: 'Email already in use' });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: payload,
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    return res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors.map((e) => e.message).join(', ') });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error(error);
    return res.status(500).json({ message: 'Unable to update user' });
  }
});

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error(error);
    return res.status(500).json({ message: 'Unable to delete user' });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
