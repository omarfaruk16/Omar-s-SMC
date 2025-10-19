# 🚀 Quick Start Guide - School Management System

## Step 1: Initial Setup

### 1.1 Create Superuser (Admin Account)

```bash
cd backend
python manage.py createsuperuser
```

When prompted, enter:
- **Email**: admin@school.com
- **Username**: admin
- **Password**: (choose a strong password)
- **First name**: Admin
- **Last name**: User

Then manually set in Django Admin:
- Role: `admin`
- Status: `approved`

### 1.2 Start Development Server

```bash
python manage.py runserver
```

The API will be available at: `http://localhost:8000`

## Step 2: Access Django Admin Panel

1. Open browser: `http://localhost:8000/admin`
2. Login with admin credentials
3. You can now:
   - Create classes
   - Manage users
   - Create notices and results
   - View all data

## Step 3: Create Sample Data

### 3.1 Create Classes

In Django Admin, go to **Classes** → **Add Class**:
- Class 1: Name: `Class 9`, Section: `A`
- Class 2: Name: `Class 10`, Section: `B`

### 3.2 Create a Notice

Go to **Notices** → **Add Notice**:
- Title: `Welcome to New Academic Year`
- Description: `We welcome all students to the new academic year 2025.`
- Is active: ✓

### 3.3 Upload a Result

Go to **Results** → **Add Result**:
- Title: `First Term Exam Results 2025`
- File: (upload a PDF)
- Is active: ✓

## Step 4: Test API Endpoints with Examples

### 4.1 Authentication

#### Register as Teacher

```bash
curl -X POST http://localhost:8000/api/users/register/teacher/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@school.com",
    "password": "SecurePass123",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+880123456789",
    "nid": "1234567890"
  }'
```

Response:
```json
{
  "message": "Teacher registration successful. Please wait for admin approval.",
  "teacher_id": 1,
  "status": "pending"
}
```

#### Register as Student

```bash
curl -X POST http://localhost:8000/api/users/register/student/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.smith@school.com",
    "password": "SecurePass123",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+880987654321",
    "student_class": 1
  }'
```

#### Admin Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "your-admin-password"
  }'
```

Response:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Save the access token** - you'll need it for authenticated requests!

### 4.2 Admin Operations

#### Approve Teacher

```bash
curl -X POST http://localhost:8000/api/users/teachers/1/approve/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Approve Student

```bash
curl -X POST http://localhost:8000/api/users/students/1/approve/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Assign Classes to Teacher

```bash
curl -X POST http://localhost:8000/api/users/teachers/1/assign_classes/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_ids": [1, 2]
  }'
```

#### Create Fee

```bash
curl -X POST http://localhost:8000/api/fees/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Monthly Tuition Fee",
    "class_assigned": 1,
    "amount": "1500.00",
    "month": "january",
    "status": "running"
  }'
```

### 4.3 Teacher Operations

#### Teacher Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@school.com",
    "password": "SecurePass123"
  }'
```

#### Upload Class Material

```bash
curl -X POST http://localhost:8000/api/materials/ \
  -H "Authorization: Bearer TEACHER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Chapter 1: Introduction to Physics",
    "description": "Basic concepts and principles",
    "link": "https://example.com/physics-chapter1.pdf",
    "class_assigned": 1
  }'
```

### 4.4 Student Operations

#### Student Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.smith@school.com",
    "password": "SecurePass123"
  }'
```

#### View My Fees

```bash
curl -X GET http://localhost:8000/api/fees/my_fees/ \
  -H "Authorization: Bearer STUDENT_ACCESS_TOKEN"
```

#### Submit Payment

```bash
curl -X POST http://localhost:8000/api/payments/ \
  -H "Authorization: Bearer STUDENT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fee": 1,
    "method": "bkash",
    "number": "01712345678",
    "transaction_id": "BKH123456789"
  }'
```

### 4.5 Public Endpoints (No Authentication)

#### Get All Classes

```bash
curl -X GET http://localhost:8000/api/classes/
```

#### Get Active Notices

```bash
curl -X GET http://localhost:8000/api/notices/
```

#### Get Active Results

```bash
curl -X GET http://localhost:8000/api/results/
```

## Step 5: Using Postman/Thunder Client

### Import API Collection

Create a Postman collection with these environment variables:
- `base_url`: `http://localhost:8000`
- `access_token`: (set after login)

### Common Headers

For authenticated requests:
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

## Step 6: Testing Complete Workflows

### Workflow 1: Teacher Registration & Material Upload

1. Teacher registers → Status: Pending
2. Admin logs in → Approves teacher
3. Admin assigns classes to teacher
4. Teacher logs in → Uploads class material
5. Students can view material

### Workflow 2: Student Registration & Fee Payment

1. Student registers with class → Status: Pending
2. Admin logs in → Approves student
3. Admin creates fee for student's class
4. Student logs in → Views fees
5. Student submits payment with details
6. Admin approves/rejects payment

### Workflow 3: Notice Management

1. Admin creates notice with file
2. Notice appears in public API
3. Frontend displays in ticker/notice board
4. Admin can deactivate when expired

## Step 7: Database Inspection

### View Data in Django Admin

Access `http://localhost:8000/admin` to:
- View all users (teachers, students)
- See payment statuses
- Manage all content

### SQLite Database Browser (Optional)

```bash
sqlite3 backend/db.sqlite3
```

Common queries:
```sql
-- View all users
SELECT * FROM users_user;

-- View pending teachers
SELECT * FROM users_user WHERE role='teacher' AND status='pending';

-- View fees
SELECT * FROM fees_fee;
```

## Step 8: Testing Tips

### Use VS Code REST Client Extension

Create `test.http` file:

```http
### Admin Login
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "email": "admin@school.com",
  "password": "your-password"
}

### Get Classes
GET http://localhost:8000/api/classes/
```

### Test Error Handling

Try these to see error responses:
- Login with wrong credentials
- Access protected endpoint without token
- Submit payment without required fields
- Create duplicate classes

## Step 9: Next Steps

### Frontend Development

1. **Set up React project**:
   ```bash
   npx create-react-app frontend
   cd frontend
   npm install axios react-router-dom tailwindcss
   ```

2. **Install TailwindCSS**:
   ```bash
   npx tailwindcss init
   ```

3. **Configure API base URL**:
   ```javascript
   const API_BASE_URL = 'http://localhost:8000/api';
   ```

4. **Create authentication context**
5. **Build public pages** (Home, About, Notices, etc.)
6. **Build dashboards** for each role
7. **Implement forms** for all operations

### Production Deployment

1. **Render (Backend)**:
   - Create PostgreSQL database
   - Add environment variables
   - Deploy from GitHub

2. **Hostinger (Frontend)**:
   - Build React app
   - Upload to hosting
   - Configure domain

## 🔧 Troubleshooting

### Issue: "CSRF Failed"
**Solution**: Ensure you're sending JSON, not form data

### Issue: "Authentication credentials not provided"
**Solution**: Include `Authorization: Bearer <token>` header

### Issue: "Token has expired"
**Solution**: Use refresh token endpoint to get new access token

### Issue: "Permission denied"
**Solution**: Check user role and status (must be approved)

## 📞 Support

For issues:
1. Check Django logs: Console where `runserver` is running
2. Check API response messages
3. Verify database state in Django Admin
4. Review model validation rules

---

**Happy Testing! 🎉**
