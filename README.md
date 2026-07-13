# Ecom User Auth

Full-stack implementation of the Linear tickets for `ecom login`, `ecom signup`, and `ecom user crud`. The repository separates the frontend and backend into dedicated folders and ships a linked README describing the setup.

## Linear tickets implemented
- [ecom login](https://linear.app/sunnytec/issue/SUN-7/ecom-login)
- [ecom signup](https://linear.app/sunnytec/issue/SUN-6/ecom-signup)
- [ecom user crud](https://linear.app/sunnytec/issue/SUN-5/ecom-user-crud)

## Architecture overview
- **Backend**: Node.js + Express API with Prisma (SQLite) handling signup, login, and authenticated user CRUD plus JSON Web Token auth.
- **Frontend**: Create React App dashboard that allows login, registration, and administrative CRUD actions while consuming the secured backend APIs.

## Backend setup
1. `cd backend`
2. `cp .env.example .env` and update the values (`DATABASE_URL`, `JWT_SECRET`, `PORT`).
3. `npm install` (already done if cloning fresh).
4. `npm run prisma:generate`
5. `npm run prisma:migrate` (creates the SQLite file and applies migrations). If you just cloned the repo you may need to delete `dev.db` before re-running.
6. `npm run dev` to start the API on the port from `.env` (default 4000).

### Available endpoints
- `POST /api/auth/signup` – name/email/password registration (returns token).
- `POST /api/auth/login` – email/password login (returns token).
- `GET /api/users` – list all users (JWT required).
- `GET /api/users/:id` – fetch user detail.
- `PUT /api/users/:id` – update user metadata (name/email/role).
- `DELETE /api/users/:id` – delete user.

## Frontend setup
1. `cd frontend`
2. `cp .env.example .env` and adjust `REACT_APP_API_URL` if the backend runs elsewhere.
3. `npm install`
4. `npm start` to launch the dashboard on `http://localhost:3000`.

The React UI stores the JWT in `localStorage` and issues authenticated requests for user CRUD once logged in or registered.

## Testing & verification
- Use the React UI to create an account, verify login, and manage users.
- Back-end endpoints can be tested via curl/Postman with the JWT returned from login/signup. Add the `Authorization: Bearer <token>` header before calling protected routes.

## Next steps
- Replace `JWT_SECRET` and `DATABASE_URL` with production-safe values.
- Swap SQLite for Postgres/MySQL if needed and apply Prisma migrations accordingly.
