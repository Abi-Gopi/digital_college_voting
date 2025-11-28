# Digital Voting System - Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- MySQL (v8 or higher)
- Git

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and update with your configuration:
- **Database**: Set your MySQL credentials
- **JWT_SECRET**: Generate a strong random string
- **SMTP**: Configure your email provider (Gmail example provided)
- **Twilio**: Add your Twilio credentials for SMS OTP

### 4. Set Up Database
```bash
# Login to MySQL
mysql -u root -p

# Run the schema
source ../database/schema.sql

# (Optional) Load sample data
source ../database/seed.sql
```

### 5. Start Backend Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Backend will run on `http://localhost:5000`

## Frontend Setup

### 1. Navigate to Project Root
```bash
cd ..
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

The default API URL is `http://localhost:5000/api`. Update if needed.

### 4. Start Frontend Development Server
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Default Credentials

### Admin Account
- **Email**: admin@votingsystem.com
- **Password**: admin123
- **Access**: Full admin panel, manage candidates, view statistics

### Test Voter Account
- **Email**: voter@example.com
- **Password**: voter123
- **Access**: Can vote and submit feedback

## Email Configuration (Gmail Example)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings → Security
   - Under "2-Step Verification", find "App passwords"
   - Generate a password for "Mail"
3. Use this password in `SMTP_PASS`

## Twilio SMS Configuration

1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token from the dashboard
3. Get a Twilio phone number
4. Add these to your backend `.env`

## Testing the System

### 1. Register a New Voter
- Go to http://localhost:5173/register
- Fill in the registration form
- You'll receive OTP via email and SMS
- Enter OTP to verify account

### 2. Login
- Use your credentials to login
- Dashboard shows voting status

### 3. Vote
- Go to Vote page
- Select one candidate per position
- Submit votes (can only vote once)

### 4. View Results
- Real-time results available on Results page
- Shows vote counts and percentages

### 5. Admin Panel
- Login with admin credentials
- Manage candidates (add/edit/delete)
- View voter statistics
- Monitor feedback

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/login` - Login user

### Candidates
- `GET /api/candidates` - Get all candidates
- `GET /api/candidates/position/:position` - Get by position

### Voting
- `POST /api/votes` - Submit votes
- `GET /api/votes/results` - Get results
- `GET /api/votes/check-voted` - Check if user voted

### Feedback
- `POST /api/feedback` - Submit feedback

### Admin (Requires Admin Role)
- `GET /api/admin/voters` - Get all voters
- `GET /api/admin/statistics` - Get statistics
- `POST /api/admin/candidates` - Add candidate
- `PUT /api/admin/candidates/:id` - Update candidate
- `DELETE /api/admin/candidates/:id` - Delete candidate
- `GET /api/admin/feedback` - Get all feedback

## Database Schema

### Tables
- **profiles**: User accounts with credentials
- **user_roles**: User role assignments (admin/voter)
- **candidates**: Election candidates with manifestos
- **votes**: Cast votes (one per position per user)
- **otp_verifications**: OTP codes for email/SMS verification
- **feedback**: User feedback and ratings

## Security Features
- Password hashing with bcrypt
- JWT token authentication
- One-time voting enforcement (database constraint)
- OTP verification for registration
- Admin-only routes protection
- SQL injection prevention (parameterized queries)

## Troubleshooting

### Backend won't start
- Check MySQL is running
- Verify database credentials in `.env`
- Ensure port 5000 is available

### Frontend won't connect to backend
- Verify backend is running on port 5000
- Check CORS settings in `backend/server.js`
- Verify `VITE_API_URL` in frontend `.env`

### OTP not sending
- Check email SMTP credentials
- Verify Twilio credentials and phone number format
- Check console logs for specific errors

### Database errors
- Ensure schema.sql was executed successfully
- Check MySQL user has proper permissions
- Verify foreign key constraints are satisfied

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use a process manager (PM2 recommended)
3. Set up HTTPS with SSL certificate
4. Use environment-specific database
5. Enable proper logging

### Frontend
1. Build production bundle: `npm run build`
2. Serve from `dist/` directory
3. Configure web server (Nginx/Apache)
4. Update `VITE_API_URL` to production API

### Database
1. Backup regularly
2. Use strong passwords
3. Limit remote access
4. Enable audit logging

## Support
For issues or questions, refer to the documentation or contact the development team.
