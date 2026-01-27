# Welcome to the Brainsequence project

The project is in its infancy, here is the first peek of what it is trying to achieve:
- https://brainsequences.vercel.app/sequences/1 
Some more details about the context of the project is available here:
- https://brainsequences.vercel.app/about 

## Features of React Router 
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Email Configuration (Gmail SMTP Setup)

The application uses Gmail SMTP to send collaboration invitation emails. Follow these steps to configure it:

#### Step 1: Create a Gmail Account for the Application

1. Create a new Gmail account specifically for the app (e.g., `noreply.brainsequences@gmail.com`)
2. This keeps your personal email separate from application emails

#### Step 2: Enable 2-Step Verification

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** in the left sidebar
3. Under "How you sign in to Google," click **2-Step Verification**
4. Follow the prompts to enable 2-Step Verification (you'll need your phone)

#### Step 3: Generate App Password

1. After enabling 2-Step Verification, go back to **Security**
2. Under "How you sign in to Google," click **App passwords**
3. You may need to sign in again
4. In the "Select app" dropdown, choose **Mail**
5. In the "Select device" dropdown, choose **Other** and enter "BrainSequences"
6. Click **Generate**
7. Google will display a 16-character password (e.g., `abcd efgh ijkl mnop`)
8. **Copy this password immediately** - you won't be able to see it again

#### Step 4: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Gmail credentials:
   ```bash
   SMTP_USER=noreply.brainsequences@gmail.com
   SMTP_PASS=abcd-efgh-ijkl-mnop  # Your 16-character app password (with or without spaces)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   APP_URL=http://localhost:5173
   ```

3. **Important:** Never commit the `.env` file to version control. It's already in `.gitignore`.

#### Troubleshooting Email

- If emails fail to send, check the server console for error messages
- Verify your Gmail account has 2-Step Verification enabled
- Confirm the app password is correct (try generating a new one)
- Gmail has a sending limit of ~500 emails/day for free accounts

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Authentication & User Management

The application includes a complete authentication system:

### User Roles

- **Regular User**: Can create and edit their own sequences, invite collaborators
- **Admin**: Full access to all sequences, user management panel at `/admin/users`
- **First User**: The first user to sign up is automatically assigned the admin role

### Features

- **User Authentication**: Login, signup, and session management with 90-day inactivity expiry
- **Sequence Ownership**: All sequences have an owner who can edit and delete them
- **Collaboration**: Owners can invite other users via email to collaborate on sequences
- **Email Invitations**: 7-day expiring invitation links sent to collaborators
- **Published/Draft Sequences**: 
  - Published sequences (`is_published=1`) are publicly viewable
  - Draft sequences (`is_published=0`) are only visible to owner and collaborators
- **Admin Panel**: Admins can manage user roles and view all users/sequences

### Default Routes

- `/login` - User login
- `/signup` - New user registration
- `/logout` - Log out current user
- `/sequences/new` - Create new sequence (requires login)
- `/sequences/edit?id=X` - Edit sequence (requires ownership or collaborator access)
- `/sequences/:id/collaborators` - Manage sequence collaborators (requires ownership)
- `/invitations/accept?token=X` - Accept collaboration invitation
- `/admin/users` - Admin user management panel (requires admin role)

### Migrating Existing Sequences

If you're adding authentication to an existing installation with sequences already in the database:

1. **Complete the database migration** (this is done automatically when you run the app after updating the schema)

2. **Sign up as the first user** at `/signup` - you'll automatically be assigned the admin role

3. **Run the migration script** to assign all existing sequences to your admin account:
   ```bash
   node scripts/migrate-existing-sequences.js
   ```

This script will:
- Find the first admin user
- Assign all sequences without owners (user_id = NULL) to that admin
- Mark all existing sequences as published (is_published = 1)

After running this script, existing sequences will be viewable by everyone but only editable by you (the admin).

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

---

Built with ❤️ using React Router.
