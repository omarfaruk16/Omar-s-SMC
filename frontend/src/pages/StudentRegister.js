import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { classAPI, subjectAPI } from '../services/api';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const StudentRegister = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    bangla_name: '',
    registration: '',
    date_of_birth: '',
    birth_registration_number: '',
    gender: '',
    religion: '',
    blood_group: '',
    nationality: 'Bangladeshi',
    address: '',
    permanent_address: '',
    village: '',
    post_office: '',
    post_code: '',
    upazilla_thana: '',
    district: '',
    fathers_name: '',
    fathers_nid: '',
    fathers_occupation: '',
    mothers_name: '',
    mothers_nid: '',
    mothers_occupation: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_monthly_income: '',
    ssc_board: '',
    ssc_registration_no: '',
    ssc_group: '',
    ssc_roll_number: '',
    ssc_year_of_passing: '',
    ssc_gpa: '',
    session: '',
    student_class: '',
  });
  
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [admissionFormInfo, setAdmissionFormInfo] = useState(null);
  const [downloadOpened, setDownloadOpened] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const { registerStudent, isAdmin } = useAuth();
  const navigate = useNavigate();

  const extractErrorMessage = (payload) => {
    if (!payload) return 'Registration failed. Please try again.';
    if (typeof payload === 'string') return payload;
    if (Array.isArray(payload) && payload.length > 0) {
      return extractErrorMessage(payload[0]);
    }
    if (payload.detail) return extractErrorMessage(payload.detail);
    for (const key of Object.keys(payload)) {
      const value = payload[key];
      if (!value) continue;
      if (typeof value === 'string') return value;
      if (Array.isArray(value) && value.length > 0) {
        const nested = extractErrorMessage(value[0]);
        if (nested) return nested;
      }
      if (typeof value === 'object') {
        const nested = extractErrorMessage(value);
        if (nested) return nested;
      }
    }
    return 'Registration failed. Please try again.';
  };

  const showError = (message) => {
    setError(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showError('Image size must be less than 5MB');
        return;
      }
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchOptions = async () => {
      try {
        setOptionsLoading(true);
        const [classesResponse, subjectsResponse] = await Promise.all([
          classAPI.getAll(),
          subjectAPI.getAll(),
        ]);

        if (!isMounted) return;

        setClasses(classesResponse.data || []);
        setSubjects(subjectsResponse.data || []);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load classes/subjects', err);
      } finally {
        if (isMounted) {
          setOptionsLoading(false);
        }
      }
    };

    fetchOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle session auto-fill based on class
  useEffect(() => {
    if (formData.student_class && classes.length > 0) {
        const selectedClass = classes.find(c => c.id === Number(formData.student_class));
        if (selectedClass && selectedClass.session) {
            setFormData(prev => ({
                ...prev,
                session: selectedClass.session
            }));
        }
    }
  }, [formData.student_class, classes]);

  useEffect(() => {
    if (success && admissionFormInfo?.download_url && !downloadOpened) {
      window.open(admissionFormInfo.download_url, '_blank', 'noopener');
      setDownloadOpened(true);
    }
  }, [success, admissionFormInfo, downloadOpened]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.password2) {
      showError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      showError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Build payload
    const payload = {
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone_number: formData.phone_number,
    };

    // Add optional fields only if they have values
    const optionalFields = [
      'bangla_name', 'registration', 'date_of_birth', 'birth_registration_number', 'gender', 'religion', 'blood_group', 'nationality',
      'address', 'permanent_address', 'village', 'post_office', 'post_code', 'upazilla_thana', 'district',
      'fathers_name', 'fathers_nid', 'fathers_occupation',
      'mothers_name', 'mothers_nid', 'mothers_occupation',
      'guardian_name', 'guardian_phone', 'guardian_monthly_income',
      'ssc_board', 'ssc_registration_no', 'ssc_group', 'ssc_roll_number', 'ssc_year_of_passing', 'ssc_gpa',
      'student_class', 'session'
    ];

    optionalFields.forEach(field => {
      if (formData[field]) {
        payload[field] = formData[field];
      }
    });

    try {
      if (isAdmin) {
        payload.auto_approve = true;
      }
      
      // Handle profile image - create FormData if image is provided
      let finalPayload = payload;
      if (profileImage) {
        const formDataWithImage = new FormData();
        Object.keys(payload).forEach(key => {
          formDataWithImage.append(key, payload[key]);
        });
        formDataWithImage.append('image', profileImage);
        finalPayload = formDataWithImage;
      }
      
      const result = await registerStudent(finalPayload);
      if (!result.success) {
        showError(extractErrorMessage(result.error));
        return;
      }
      setAdmissionFormInfo(result.data?.admission_form || null);
      setSuccess(true);
    } catch (err) {
      showError(
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-4">
            {isAdmin
              ? 'Student account created and approved. You can return to the admin list.'
              : 'Your account has been created and is pending admin approval. Please download and review your admission form below.'}
          </p>
          {admissionFormInfo?.template?.name && (
            <p className="text-sm text-blue-600 font-semibold mb-3">
              Template: {admissionFormInfo.template.name}
            </p>
          )}
          {admissionFormInfo?.download_url ? (
            <a
              href={admissionFormInfo.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2 mb-4 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition"
            >
              Download My Admission Form
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v16h16M8 12l4 4 4-4M12 16V4"
                />
              </svg>
            </a>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              Admission form is being prepared. Please check back later in your email or contact the administration.
            </p>
          )}
          {admissionFormInfo?.template?.blank_form_url && (
            <a
              href={admissionFormInfo.template.blank_form_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:text-blue-700 mb-4"
            >
              Download a blank admission form
            </a>
          )}
          <button
            onClick={() => navigate(isAdmin ? '/admin/users?tab=students' : '/login')}
            className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            {isAdmin ? 'Back to Students' : 'Go to Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">SMS</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Student Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* SECTION 1: Basic Account Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Account Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="student@example.com"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1234567890"
                />
              </div>

              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture (Optional)
                </label>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum file size: 5MB</p>

                {/* Image preview */}
                {profileImagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <img
                      src={profileImagePreview}
                      alt="Profile preview"
                      className="w-32 h-32 object-cover rounded-full border-2 border-gray-300"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: Personal Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date of Birth */}
                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Birth Registration Number */}
                <div>
                  <label htmlFor="birth_registration_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Registration Number
                  </label>
                  <input
                    id="birth_registration_number"
                    name="birth_registration_number"
                    type="text"
                    value={formData.birth_registration_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Birth certificate number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bangla Name */}
                <div>
                  <label htmlFor="bangla_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name in Bangla
                  </label>
                  <input
                    id="bangla_name"
                    name="bangla_name"
                    type="text"
                    value={formData.bangla_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="বাংলায় নাম"
                  />
                </div>

                {/* Registration */}
                <div>
                  <label htmlFor="registration" className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number
                  </label>
                  <input
                    id="registration"
                    name="registration"
                    type="text"
                    value={formData.registration}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="College registration number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Religion */}
                <div>
                  <label htmlFor="religion" className="block text-sm font-medium text-gray-700 mb-1">
                    Religion
                  </label>
                  <select
                    id="religion"
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Religion</option>
                    <option value="Islam">Islam</option>
                    <option value="Hinduism">Hinduism</option>
                    <option value="Buddhism">Buddhism</option>
                    <option value="Christianity">Christianity</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Blood Group */}
                <div>
                  <label htmlFor="blood_group" className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Group
                  </label>
                  <select
                    id="blood_group"
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                {/* Nationality */}
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
                    Nationality
                  </label>
                  <input
                    id="nationality"
                    name="nationality"
                    type="text"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Bangladeshi"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Address Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Address Information</h3>

              {/* Current Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your current full address"
                />
              </div>

              {/* Permanent Address */}
              <div>
                <label htmlFor="permanent_address" className="block text-sm font-medium text-gray-700 mb-1">
                  Permanent Address
                </label>
                <textarea
                  id="permanent_address"
                  name="permanent_address"
                  rows="3"
                  value={formData.permanent_address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your permanent address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Village */}
                <div>
                  <label htmlFor="village" className="block text-sm font-medium text-gray-700 mb-1">
                    Village
                  </label>
                  <input
                    id="village"
                    name="village"
                    type="text"
                    value={formData.village}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Village name"
                  />
                </div>

                {/* Post Office */}
                <div>
                  <label htmlFor="post_office" className="block text-sm font-medium text-gray-700 mb-1">
                    Post Office
                  </label>
                  <input
                    id="post_office"
                    name="post_office"
                    type="text"
                    value={formData.post_office}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Post office name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Post Code */}
                <div>
                  <label htmlFor="post_code" className="block text-sm font-medium text-gray-700 mb-1">
                    Post Code
                  </label>
                  <input
                    id="post_code"
                    name="post_code"
                    type="text"
                    value={formData.post_code}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Post code"
                  />
                </div>

                {/* Upazilla/Thana */}
                <div>
                  <label htmlFor="upazilla_thana" className="block text-sm font-medium text-gray-700 mb-1">
                    Upazilla/Thana
                  </label>
                  <input
                    id="upazilla_thana"
                    name="upazilla_thana"
                    type="text"
                    value={formData.upazilla_thana}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Upazilla/Thana"
                  />
                </div>
              </div>

              {/* District */}
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                  District
                </label>
                <input
                  id="district"
                  name="district"
                  type="text"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="District"
                />
              </div>
            </div>

            {/* SECTION 4: Family Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Family Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Father's Name */}
                <div>
                  <label htmlFor="fathers_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Father's Name
                  </label>
                  <input
                    id="fathers_name"
                    name="fathers_name"
                    type="text"
                    value={formData.fathers_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Father's full name"
                  />
                </div>

                {/* Father's NID */}
                <div>
                  <label htmlFor="fathers_nid" className="block text-sm font-medium text-gray-700 mb-1">
                    Father's NID
                  </label>
                  <input
                    id="fathers_nid"
                    name="fathers_nid"
                    type="text"
                    value={formData.fathers_nid}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="National ID number"
                  />
                </div>
              </div>

              {/* Father's Occupation */}
              <div>
                <label htmlFor="fathers_occupation" className="block text-sm font-medium text-gray-700 mb-1">
                  Father's Occupation
                </label>
                <input
                  id="fathers_occupation"
                  name="fathers_occupation"
                  type="text"
                  value={formData.fathers_occupation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Father's occupation"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mother's Name */}
                <div>
                  <label htmlFor="mothers_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Mother's Name
                  </label>
                  <input
                    id="mothers_name"
                    name="mothers_name"
                    type="text"
                    value={formData.mothers_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mother's full name"
                  />
                </div>

                {/* Mother's NID */}
                <div>
                  <label htmlFor="mothers_nid" className="block text-sm font-medium text-gray-700 mb-1">
                    Mother's NID
                  </label>
                  <input
                    id="mothers_nid"
                    name="mothers_nid"
                    type="text"
                    value={formData.mothers_nid}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="National ID number"
                  />
                </div>
              </div>

              {/* Mother's Occupation */}
              <div>
                <label htmlFor="mothers_occupation" className="block text-sm font-medium text-gray-700 mb-1">
                  Mother's Occupation
                </label>
                <input
                  id="mothers_occupation"
                  name="mothers_occupation"
                  type="text"
                  value={formData.mothers_occupation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mother's occupation"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Guardian Name */}
                <div>
                  <label htmlFor="guardian_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Guardian Name
                  </label>
                  <input
                    id="guardian_name"
                    name="guardian_name"
                    type="text"
                    value={formData.guardian_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Guardian's name (if applicable)"
                  />
                </div>

                {/* Guardian Phone */}
                <div>
                  <label htmlFor="guardian_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Guardian Phone
                  </label>
                  <input
                    id="guardian_phone"
                    name="guardian_phone"
                    type="tel"
                    value={formData.guardian_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              {/* Guardian Monthly Income */}
              <div>
                <label htmlFor="guardian_monthly_income" className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Monthly Income
                </label>
                <input
                  id="guardian_monthly_income"
                  name="guardian_monthly_income"
                  type="number"
                  value={formData.guardian_monthly_income}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Monthly income in BDT"
                />
              </div>
            </div>

            {/* SECTION 5: Academic History (SSC) */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Academic History (SSC)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SSC Board */}
                <div>
                  <label htmlFor="ssc_board" className="block text-sm font-medium text-gray-700 mb-1">
                    SSC Board
                  </label>
                  <input
                    id="ssc_board"
                    name="ssc_board"
                    type="text"
                    value={formData.ssc_board}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Dhaka Board"
                  />
                </div>

                {/* SSC Registration No */}
                <div>
                  <label htmlFor="ssc_registration_no" className="block text-sm font-medium text-gray-700 mb-1">
                    SSC Registration No
                  </label>
                  <input
                    id="ssc_registration_no"
                    name="ssc_registration_no"
                    type="text"
                    value={formData.ssc_registration_no}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Registration number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SSC Group */}
                <div>
                  <label htmlFor="ssc_group" className="block text-sm font-medium text-gray-700 mb-1">
                    SSC Group
                  </label>
                  <select
                    id="ssc_group"
                    name="ssc_group"
                    value={formData.ssc_group}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Group</option>
                    <option value="Science">Science</option>
                    <option value="Humanities">Humanities</option>
                    <option value="Business Studies">Business Studies</option>
                  </select>
                </div>

                {/* SSC Roll Number */}
                <div>
                  <label htmlFor="ssc_roll_number" className="block text-sm font-medium text-gray-700 mb-1">
                    SSC Roll Number
                  </label>
                  <input
                    id="ssc_roll_number"
                    name="ssc_roll_number"
                    type="text"
                    value={formData.ssc_roll_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Roll number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SSC Year of Passing */}
                <div>
                  <label htmlFor="ssc_year_of_passing" className="block text-sm font-medium text-gray-700 mb-1">
                    SSC Year of Passing
                  </label>
                  <input
                    id="ssc_year_of_passing"
                    name="ssc_year_of_passing"
                    type="number"
                    value={formData.ssc_year_of_passing}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 2023"
                  />
                </div>

                {/* SSC GPA */}
                <div>
                  <label htmlFor="ssc_gpa" className="block text-sm font-medium text-gray-700 mb-1">
                    SSC GPA
                  </label>
                  <input
                    id="ssc_gpa"
                    name="ssc_gpa"
                    type="number"
                    step="0.01"
                    value={formData.ssc_gpa}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 4.50"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 6: Class & Subject Selection */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Class & Session Selection</h3>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Class Selection */}
                  <div>
                    <label htmlFor="student_class" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Class
                    </label>
                    <select
                      id="student_class"
                      name="student_class"
                      value={formData.student_class}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select your class --</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.section ? `${cls.name} - ${cls.section}` : cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Session */}
                  <div>
                    <label htmlFor="session" className="block text-sm font-medium text-gray-700 mb-1">
                      Session <span className="text-xs text-gray-500">(auto-filled from class, editable)</span>
                    </label>
                    <input
                      id="session"
                      name="session"
                      type="text"
                      value={formData.session}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 2023-2024"
                    />
                  </div>
              </div>
            </div>

            {/* SECTION 7: Account Security */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Account Security</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password2"
                      name="password2"
                      type={showPassword2 ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password2}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword2(!showPassword2)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword2 ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-yellow-800">
                  Your registration will be reviewed by an administrator. You will receive notification once your account is approved.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                'Register as Student'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;
