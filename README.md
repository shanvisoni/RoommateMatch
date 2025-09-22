# 🏠 RoomieMatch

A full-stack roommate matching application built with React, Node.js, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v12+)

### Setup

1. **Install PostgreSQL** and create a database:
   ```sql
   CREATE DATABASE roomiematch;
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   # Create .env file with your database URL
   npm run db:generate
   npm run db:push
   npm run dev
   ```

3. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access the app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🎯 Features

- ✅ **User Registration & Login** - JWT authentication
- ✅ **Profile Management** - Create and edit your profile
- ✅ **Roommate Discovery** - Browse potential roommates
- ✅ **Matching System** - Like/pass on profiles
- ✅ **Real-time Messaging** - Chat with matches
- ✅ **Responsive Design** - Works on all devices

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- React Router
- Axios
- React Hook Form

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication

## 📁 Project Structure

```
├── frontend/          # React frontend
├── backend/           # Node.js backend
│   ├── prisma/        # Database schema
│   └── src/           # Backend source code
└── README.md
```

## 🔧 Development

- **Backend:** `cd backend && npm run dev`
- **Frontend:** `cd frontend && npm start`
- **Database:** Prisma handles migrations automatically

## 📝 Environment Variables

**Backend (.env):**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/roomiematch"
JWT_SECRET=your-secret-key
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:5000
```

---

**Start building your roommate matching app! 🎉**