# Superuser Management Scripts

These scripts help manage superuser creation and deletion with proper approval status handling.

## Problem

When creating a superuser with `python manage.py createsuperuser`, the user still has a status of `pending`, which requires admin approval before they can login. This prevents initial system setup.

## Solution

Two management commands are provided:

### 1. `delete_old_superusers` - Remove existing superusers

**Delete all superusers with confirmation prompt:**
```bash
python manage.py delete_old_superusers
```

**Delete without prompt (confirmation flag):**
```bash
python manage.py delete_old_superusers --confirm
```

**Example output:**
```
Found 1 superuser(s):
  - admin@school.com (admin)

⚠️  Are you sure you want to delete these superusers? (yes/no): yes
✓ Successfully deleted 1 superuser(s).
```

### 2. `create_approved_superuser` - Create superuser with immediate approval

**Interactive mode (prompts for input):**
```bash
python manage.py create_approved_superuser
```

**With command-line arguments:**
```bash
python manage.py create_approved_superuser \
  --email admin@school.com \
  --username admin \
  --password SecurePassword123 \
  --first-name Admin \
  --last-name User
```

**Example interactive session:**
```
Email address: admin@school.com
Username: admin
Password: 
Password (again): 
First name (optional): Admin
Last name (optional): User

✓ Successfully created approved superuser:
  Email: admin@school.com
  Username: admin
  Name: Admin User
  Status: Approved
  Is Superuser: True
  Is Staff: True
✅ User can now login immediately without waiting for admin approval!
```

## Key Differences

| Feature | `manage.py createsuperuser` | `create_approved_superuser` |
|---------|-------|---------|
| Status | `pending` (needs approval) | `approved` (immediate access) |
| Can Login | ❌ No (pending approval) | ✅ Yes (approved) |
| Role | Not set | Always `admin` |
| Superuser | ✅ Yes | ✅ Yes |
| Staff | ✅ Yes | ✅ Yes |

## Complete Setup Commands

### Fresh Production Setup

```bash
cd /root/Omar-s-SMC/backend
source venv/bin/activate

# Delete any existing superusers
python manage.py delete_old_superusers --confirm

# Create new approved superuser
python manage.py create_approved_superuser \
  --email admin@school.com \
  --username admin \
  --password YourSecurePassword123 \
  --first-name Admin \
  --last-name User

deactivate
```

### Development Setup

```bash
cd backend
source venv/bin/activate

# Delete old superusers
python manage.py delete_old_superusers --confirm

# Create new approved superuser (interactive)
python manage.py create_approved_superuser

deactivate
```

## Why This Matters

**Without these scripts:**
- Admin creates superuser → user status = `pending`
- Admin visits login page → sees "Account Pending Approval" message
- Admin is locked out and must use Django admin or database to approve themselves
- Creates chicken-and-egg problem during initial setup

**With these scripts:**
- Admin creates superuser → user status = `approved`
- Admin visits login page → can login immediately
- No additional steps needed
- Smooth onboarding experience

## Files Location

```
backend/
└── users/
    └── management/
        ├── __init__.py
        └── commands/
            ├── __init__.py
            ├── create_approved_superuser.py
            └── delete_old_superusers.py
```

## Notes

- Both commands are safe and reversible
- `delete_old_superusers` prompts for confirmation (use `--confirm` to skip)
- `create_approved_superuser` validates email format and checks for duplicates
- User role is automatically set to `admin`
- User is automatically created as superuser and staff member
