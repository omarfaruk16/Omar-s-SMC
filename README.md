# 🏫 School Management System (SMS)

A comprehensive, modern school management platform built with Django REST Framework (Backend) and React + TailwindCSS (Frontend).

## 🎯 Features

### User Roles & Permissions

#### **Admin**
- Full system access
- Approve/Reject teacher and student registrations
- Manage classes, teachers, and students
- Assign teachers to classes
- Change student class
- Create and manage notices, results, and fees
- Approve/Reject payment submissions

#### **Teacher**
- Register with approval workflow
- Manage profile and change password
- View assigned classes
- Upload and manage class materials (CRUD)

#### **Student**
- Register with approval workflow  
- Manage profile and change password
- View class materials based on enrolled class
- View and pay fees
- Submit payment proof for admin approval

### Core Features

- **Authentication**: JWT-based authentication with role-based access control
- **Public Website**: Home, About, Teachers, Results, Notices, Contact pages
- **Notice Board**: Scrolling ticker on homepage + dedicated notice page
- **Results Management**: Public result downloads
- **Class Materials**: Teachers upload materials, students view by class
- **Fee Management**: 
  - Admin creates fees (title, class, amount, month)
  - Fee status: Pending → Running → Complete
  - Students pay via bKash, Nagad, Rocket, or Cash
  - Payment approval workflow

## 🛠️ Tech Stack

### Backend
- **Framework**: Django 5.2.7 + Django REST Framework 3.15.2
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: PostgreSQL (production) / SQLite (development)
- **File Handling**: Pillow for image processing
- **CORS**: django-cors-headers
- **Static Files**: WhiteNoise

### Frontend (To Be Implemented)
- **Framework**: React
- **Styling**: TailwindCSS
- **State Management**: React Context/Redux
- **HTTP Client**: Axios
- **Routing**: React Router

## 📁 Project Structure

```
school-sms/
├── backend/
│   ├── config/              # Project settings
│   ├── users/               # User authentication & profiles
│   ├── classes/             # Class management
│   ├── notices/             # Notice board
│   ├── results/             # Results management
│   ├── materials/           # Class materials
│   ├── fees/                # Fee & payment management
│   ├── media/               # Uploaded files
│   ├── staticfiles/         # Static files
│   ├── manage.py
│   └── requirements.txt
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Python 3.11+
- pip
- PostgreSQL (for production)
- Node.js & npm (for frontend)

### Backend Setup

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Create virtual environment** (optional but recommended)
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Update the values:
   ```env
   SECRET_KEY=your-secret-key
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   
   # For PostgreSQL in production
   # DATABASE_URL=postgresql://user:password@host:5432/dbname
   
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   
   # Email settings for password reset
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   ```

5. **Run migrations** (already done if you followed along)
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create superuser (Admin)**
   ```bash
   python manage.py createsuperuser
   ```
   Follow prompts to set:
   - Email
   - Username
   - Password
   - Role: `admin`
   - Status: `approved`

7. **Run development server**
   ```bash
   python manage.py runserver
   ```
   Backend will be available at `http://localhost:8000`

8. **Access Django Admin**
   ```
   http://localhost:8000/admin
   ```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login/` - Login (get JWT tokens)
- `POST /api/auth/refresh/` - Refresh access token

### Users
- `POST /api/users/register/teacher/` - Teacher registration
- `POST /api/users/register/student/` - Student registration
- `GET /api/users/profile/` - Get current user profile
- `PUT /api/users/profile/` - Update profile
- `GET /api/users/teachers/` - List teachers
- `GET /api/users/teachers/pending/` - List pending teachers (admin)
- `POST /api/users/teachers/{id}/approve/` - Approve teacher (admin)
- `POST /api/users/teachers/{id}/reject/` - Reject teacher (admin)
- `POST /api/users/teachers/{id}/assign_classes/` - Assign classes (admin)
- `GET /api/users/students/` - List students
- `GET /api/users/students/pending/` - List pending students (admin)
- `POST /api/users/students/{id}/approve/` - Approve student (admin)
- `POST /api/users/students/{id}/change_class/` - Change student class (admin)

### Classes
- `GET /api/classes/` - List all classes (public)
- `POST /api/classes/` - Create class (admin)
- `GET /api/classes/{id}/` - Get class details
- `PUT /api/classes/{id}/` - Update class (admin)
- `DELETE /api/classes/{id}/` - Delete class (admin)

### Notices
- `GET /api/notices/` - List active notices (public)
- `POST /api/notices/` - Create notice (admin)
- `GET /api/notices/{id}/` - Get notice details
- `PUT /api/notices/{id}/` - Update notice (admin)
- `DELETE /api/notices/{id}/` - Delete notice (admin)

### Results
- `GET /api/results/` - List active results (public)
- `POST /api/results/` - Create result (admin)
- `GET /api/results/{id}/` - Get result details
- `PUT /api/results/{id}/` - Update result (admin)
- `DELETE /api/results/{id}/` - Delete result (admin)

### Class Materials
- `GET /api/materials/` - List materials (filtered by role)
- `POST /api/materials/` - Upload material (teacher)
- `GET /api/materials/{id}/` - Get material details
- `PUT /api/materials/{id}/` - Update material (teacher/admin)
- `DELETE /api/materials/{id}/` - Delete material (teacher/admin)

### Fees & Payments
- `GET /api/fees/` - List fees
- `POST /api/fees/` - Create fee (admin)
- `GET /api/fees/{id}/students/` - Get students payment status (admin)
- `GET /api/fees/my_fees/` - Get student's fees with payment status
- `GET /api/payments/` - List payments
- `POST /api/payments/` - Submit payment (student)
- `GET /api/payments/pending/` - List pending payments (admin)
- `POST /api/payments/{id}/approve/` - Approve payment (admin)
- `POST /api/payments/{id}/reject/` - Reject payment (admin)

## 🗃️ Database Models

### User
- Email, username, password (hashed)
- Role: admin/teacher/student
- Status: pending/approved/rejected
- Phone, image

### Teacher
- User (OneToOne)
- NID (National ID)
- Assigned classes (ManyToMany)

### Student
- User (OneToOne)
- Student class (ForeignKey)

### Class
- Name, section
- Unique together constraint

### Notice
- Title, description, file (optional)
- Created date, is_active

### Result
- Title, file (required)
- Published date, is_active

### ClassMaterial
- Title, description
- Link (external) or file upload
- Teacher, class, uploaded date

### Fee
- Title, class, amount, month
- Status: pending/running/complete

### Payment
- Student, fee
- Method: bkash/nagad/rocket/cash
- Number, transaction ID (for digital payments)
- Status: pending/approved/rejected
- Payment date, approved date, notes

## 🔐 Authentication Flow

1. **Registration**:
   - Teacher/Student registers via API
   - Status set to "pending"
   - Admin reviews and approves/rejects

2. **Login**:
   - POST credentials to `/api/auth/login/`
   - Receive access & refresh tokens
   - Store tokens securely (localStorage/cookie)

3. **API Requests**:
   - Include header: `Authorization: Bearer <access_token>`
   - Refresh token when expired

## 🌐 Deployment

### Backend (Render)

1. **Prepare for production**:
   - Set `DEBUG=False` in .env
   - Configure `ALLOWED_HOSTS`
   - Set up PostgreSQL database
   - Configure `DATABASE_URL`

2. **Create `render.yaml`** or use Render dashboard:
   ```yaml
   services:
     - type: web
       name: school-sms-backend
       env: python
       buildCommand: pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
       startCommand: gunicorn config.wsgi:application
   ```

3. **Environment Variables** on Render:
   - SECRET_KEY
   - DATABASE_URL
   - ALLOWED_HOSTS
   - Email settings

### Frontend (Hostinger)

1. **Build React app**:
   ```bash
   npm run build
   ```

2. **Upload build folder** to Hostinger via:
   - FTP
   - File Manager
   - Git deployment

3. **Configure API base URL** in frontend to point to Render backend

## 📝 Development Workflow

### Adding New Features

1. **Create/Update Models** in respective app's `models.py`
2. **Run Migrations**: `python manage.py makemigrations && python manage.py migrate`
3. **Create Serializers** in `serializers.py`
4. **Create Views** in `views.py`
5. **Add URLs** in `urls.py`
6. **Test API** using Postman/Thunder Client
7. **Update Frontend** to consume new endpoints

### Testing

```bash
# Run Django tests
python manage.py test

# Check for issues
python manage.py check
```

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**:
   - Ensure all dependencies are installed
   - Check Python version compatibility

2. **Database Errors**:
   - Verify DATABASE_URL is correct
   - Ensure PostgreSQL is running
   - Run migrations

3. **CORS Errors**:
   - Check CORS_ALLOWED_ORIGINS includes frontend URL
   - Verify django-cors-headers is installed

4. **Authentication Errors**:
   - Check JWT token is included in headers
   - Verify token hasn't expired
   - Use refresh token endpoint

## 📚 Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [JWT Authentication](https://django-rest-framework-simplejwt.readthedocs.io/)
- [React Documentation](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational purposes.

## 👨‍💻 Development Status

- ✅ Backend API (Complete)
- ⏳ Frontend (To Be Implemented)
- ⏳ Payment Gateway Integration (Future)
- ⏳ SMS/Email Notifications (Future)

---

**Built with ❤️ for modern school management**
