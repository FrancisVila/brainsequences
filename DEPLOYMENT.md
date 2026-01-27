# Authentication System Deployment Checklist

## Pre-Deployment Steps

### 1. Install Dependencies
```bash
npm install bcryptjs @types/bcryptjs nodemailer @types/nodemailer
```

### 2. Configure Email (Gmail SMTP)

#### Create Gmail Account
- [ ] Create new Gmail account: `noreply.brainsequences@gmail.com`
- [ ] Log in to the new account

#### Enable 2-Step Verification
- [ ] Go to https://myaccount.google.com/security
- [ ] Enable 2-Step Verification
- [ ] Complete phone verification

#### Generate App Password
- [ ] Go to https://myaccount.google.com/apppasswords
- [ ] Select "Mail" and "Other (Custom name)"
- [ ] Enter "BrainSequences"
- [ ] Click Generate
- [ ] Copy the 16-character password

#### Configure Environment Variables
- [ ] Copy `.env.example` to `.env`
- [ ] Add Gmail email to `SMTP_USER`
- [ ] Add 16-character app password to `SMTP_PASS`
- [ ] Update `APP_URL` to your production URL (e.g., https://brainsequences.vercel.app)

### 3. Database Migration
The database migration should already be applied. Verify by checking:
- [ ] `users` table exists
- [ ] `sessions` table exists
- [ ] `invitations` table exists
- [ ] `sequence_collaborators` table exists
- [ ] `sequences` table has `user_id` and `is_published` columns

If not applied, run:
```bash
npx drizzle-kit migrate
```

### 4. Test Email Configuration (Optional)
Create a simple test script to verify email works before deploying.

## Deployment Steps

### 1. Deploy the Application
- [ ] Build the application: `npm run build`
- [ ] Deploy to your hosting platform (Vercel, Railway, etc.)
- [ ] Verify the app starts successfully

### 2. Create First Admin User
- [ ] Visit your deployed app's `/signup` page
- [ ] Sign up with YOUR email address
- [ ] Verify you can log in
- [ ] Check that you have admin access (should see "Admin" link in nav)

### 3. Migrate Existing Sequences
If you have existing sequences in the database:
- [ ] Run the migration script: `node scripts/migrate-existing-sequences.js`
- [ ] Verify all sequences are now owned by your admin account
- [ ] Check that sequences are visible on the home page

### 4. Test Key Functionality

#### Authentication
- [ ] Can sign up new users
- [ ] Can log in with existing user
- [ ] Can log out
- [ ] Session persists across page refreshes
- [ ] Logout clears session

#### Sequence Ownership
- [ ] Can create new sequence (requires login)
- [ ] Cannot edit someone else's sequence
- [ ] Can edit your own sequences
- [ ] Published sequences are visible to everyone
- [ ] Draft sequences are only visible to owner/collaborators

#### Collaboration
- [ ] Can invite collaborator via email
- [ ] Invitation email is received
- [ ] Can accept invitation (creates account if needed)
- [ ] Collaborator can edit the sequence
- [ ] Can remove collaborator
- [ ] Expired invitations cannot be accepted

#### Admin Functions
- [ ] Can access `/admin/users` panel
- [ ] Can change user roles
- [ ] Can view all users and their sequence counts
- [ ] Regular users cannot access admin panel

## Post-Deployment

### 1. Monitor Email Delivery
- [ ] Check that invitation emails are being delivered
- [ ] Check spam folder if emails not received
- [ ] Verify email links work correctly

### 2. Security Check
- [ ] `.env` file is NOT committed to git
- [ ] Sessions expire after 90 days of inactivity
- [ ] Passwords are hashed (never stored in plain text)
- [ ] CSRF protection via SameSite cookies
- [ ] HttpOnly cookies prevent JavaScript access

### 3. User Communication
If migrating from a public-access system:
- [ ] Notify existing users they need to create accounts
- [ ] Provide instructions for collaboration features
- [ ] Explain public vs. draft sequence visibility

## Troubleshooting

### Emails Not Sending
1. Check Gmail app password is correct
2. Verify 2-Step Verification is enabled
3. Check server logs for detailed error messages
4. Test with a different email address
5. Check Gmail account hasn't hit daily sending limits (500/day)

### Cannot Log In
1. Clear browser cookies
2. Check database has `users` and `sessions` tables
3. Verify password validation is working (8+ chars, letters + numbers)
4. Check server logs for authentication errors

### Permission Errors
1. Verify user is logged in (check session cookie)
2. Check sequence ownership in database
3. Verify collaborator relationships exist
4. Confirm admin role is correctly set

### Database Issues
1. Ensure all migrations have been applied
2. Check database file permissions
3. Verify schema matches code (run `npx drizzle-kit generate` to check)

## Rollback Plan

If you need to rollback the authentication system:

1. **Database**: The old sequences table is compatible (new columns have defaults)
2. **Code**: Revert to previous commit before auth changes
3. **Data**: Existing sequences remain intact (just lose ownership info)

Note: **Do not rollback after users have created accounts** - you'll lose user data!

## Support

For issues or questions:
1. Check server console logs
2. Review this checklist
3. Check React Router and Drizzle ORM documentation
4. Review the authentication code in `app/server/auth.ts`
