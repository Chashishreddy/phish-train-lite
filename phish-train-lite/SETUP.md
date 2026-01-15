# Phish Train Lite - Setup Instructions

## Prerequisites

- Node.js 18+
- npm or yarn

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

**IMPORTANT:** Generate secure keys for production:

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Encryption Key (32 bytes for AES-256)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update your `.env` file with these generated values:

```env
PORT=4000
BASE_URL=http://localhost:4000
ADMIN_ORIGIN=http://localhost:5173
NODE_ENV=development

JWT_SECRET=<your-generated-jwt-secret>
JWT_REFRESH_SECRET=<your-generated-refresh-secret>
ENCRYPTION_KEY=<your-generated-encryption-key>

ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourSecurePassword123!
```

### 3. Create Admin User

Run the setup script to create your first admin user:

```bash
node setup-admin.js
```

You can either:
- Set `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in `.env` file
- Or enter them interactively when prompted

### 4. Start the Backend Server

```bash
node server.js
```

The API will be available at `http://localhost:4000`

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## First Login

1. Navigate to `http://localhost:5173`
2. Log in with the admin credentials you created
3. You're ready to start creating phishing campaigns!

## Security Notes

- **NEVER** commit `.env` files to version control
- Change all default passwords immediately
- Use strong, unique values for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `ENCRYPTION_KEY`
- In production, set `NODE_ENV=production`
- Configure proper CORS origins in production (update `ADMIN_ORIGIN`)
- Regularly rotate your encryption keys (requires re-encrypting existing data)

## User Roles

- **Admin**: Full access - create/edit/approve/send campaigns, manage users
- **Manager**: Create and edit campaigns, manage allowlist, view analytics
- **Viewer**: Read-only access to campaigns and analytics

## Troubleshooting

### Database Issues

The SQLite database will be created automatically at `backend/data/phish-train-lite.sqlite`

If you need to reset:

```bash
rm backend/data/phish-train-lite.sqlite
node backend/setup-admin.js
```

### Port Conflicts

If ports 4000 or 5173 are in use, update:
- Backend: `PORT` in `.env`
- Frontend: `server.port` in `vite.config.js`

### Authentication Issues

If you can't log in:
1. Check that the backend server is running
2. Verify your admin user was created: check `backend/data/phish-train-lite.sqlite`
3. Check browser console for CORS errors
4. Ensure `ADMIN_ORIGIN` in `.env` matches your frontend URL
