
import os

content = r'''import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI, classAPI } from '../../services/api'; 
import { useToast } from '../../context/ToastContext';

const StudentEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    
    // Form state initialized with all potential fields
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        roll_number: '',
        student_class: '',
        session: '',
        registration_id: '',
        gender: '',
        date_of_birth: '',
        religion: '',
        blood_group: '',
        nationality: 'Bangladeshi',
        address: '',
        permanent_address: '',
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
        ssc_gpa: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [studentRes, classesRes] = await Promise.all([
                    studentAPI.getById(id),
                    classAPI.getAll()
                ]);

                setClasses(classesRes.data || []);
                
                const student = studentRes.data;
                const user = student.user || {};

                // Map API data to form state
                setFormData({
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    roll_number: student.roll_number || '',
                    student_class: student.student_class?.id || student.student_class || '',
                    session: student.session || '',
                    registration_id: student.registration_id || '',
                    gender: student.gender || '',
                    date_of_birth: student.date_of_birth || '',
                    religion: student.religion || '',
                    blood_group: student.blood_group || '',
                    nationality: student.nationality || 'Bangladeshi',
                    address: student.address || '',
                    permanent_address: student.permanent_address || '',
                    post_code: student.post_code || '',
                    upazilla_thana: student.upazilla_thana || '',
                    district: student.district || '',
                    fathers_name: student.fathers_name || '',
                    fathers_nid: student.fathers_nid || '',
                    fathers_occupation: student.fathers_occupation || '',
                    mothers_name: student.mothers_name || '',
                    mothers_nid: student.mothers_nid || '',
                    mothers_occupation: student.mothers_occupation || '',
                    guardian_name: student.guardian_name || '',
                    guardian_phone: student.guardian_phone || '',
                    guardian_monthly_income: student.guardian_monthly_income || '',
                    ssc_board: student.ssc_board || '',
                    ssc_registration_no: student.ssc_registration_no || '',
                    ssc_group: student.ssc_group || '',
                    ssc_roll_number: student.ssc_roll_number || '',
                    ssc_year_of_passing: student.ssc_year_of_passing || '',
                    ssc_gpa: student.ssc_gpa || ''
                });

            } catch (error) {
                console.error('Error fetching student data:', error);
                toast.error('Failed to load student data');
                navigate('/admin/users?tab=students');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id, navigate, toast]);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await studentAPI.update(id, formData);
            toast.success('Student updated successfully');
            navigate('/admin/users?tab=students');
        } catch (error) {
            console.error('Error updating student:', error);
            toast.error('Failed to update student');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
                        <h1 className="text-2xl font-bold">Edit Student</h1>
                        <button 
                            onClick={() => navigate('/admin/users?tab=students')}
                            className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded text-sm transition"
                        >
                            Back to List
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Basic Info */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                    <input 
                                        type="text" name="first_name" value={formData.first_name} onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                    <input 
                                        type="text" name="last_name" value={formData.last_name} onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input 
                                        type="email" name="email" value={formData.email} onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                    <input 
                                        type="text" name="phone" value={formData.phone} onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Academic Info */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Academic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                                    <select 
                                        name="student_class" value={formData.student_class} onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" required
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} {c.section ? ` - ${c.section}` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                                    <input 
                                        type="text" name="roll_number" value={formData.roll_number} onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Session (Read Only)</label>
                                    <input 
                                        type="text" name="session" value={formData.session} readOnly
                                        className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration ID</label>
                                    <input 
                                        type="text" name="registration_id" value={formData.registration_id} onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                         {/* Personal Info */}
                         <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Personal Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <input 
                                        type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required>
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                                    <input type="text" name="religion" value={formData.religion} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                                    <input type="text" name="blood_group" value={formData.blood_group} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>
                         </div>
                         
                         {/* Address Info */}
                         <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Address</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Address</label>
                                    <textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
                                    <textarea name="permanent_address" value={formData.permanent_address} onChange={handleChange} rows="2" className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input type="text" name="district" placeholder="District" value={formData.district} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                    <input type="text" name="upazilla_thana" placeholder="Upazilla/Thana" value={formData.upazilla_thana} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                    <input type="text" name="post_code" placeholder="Post Code" value={formData.post_code} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>
                         </div>

                         {/* Family Info */}
                         <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Family Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                                    <input type="text" name="fathers_name" value={formData.fathers_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Father's NID</label>
                                    <input type="text" name="fathers_nid" value={formData.fathers_nid} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                                    <input type="text" name="mothers_name" value={formData.mothers_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mother's NID</label>
                                    <input type="text" name="mothers_nid" value={formData.mothers_nid} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                                    <input type="text" name="guardian_name" value={formData.guardian_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label>
                                    <input type="text" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (BDT)</label>
                                    <input type="number" name="guardian_monthly_income" value={formData.guardian_monthly_income} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g 10000" />
                                </div>
                            </div>
                         </div>
                         
                         {/* SSC Info */}
                         <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">SSC/Equivalent Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
                                    <input type="text" name="ssc_board" value={formData.ssc_board} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                                    <input type="text" name="ssc_group" value={formData.ssc_group} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration No</label>
                                    <input type="text" name="ssc_registration_no" value={formData.ssc_registration_no} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll No</label>
                                    <input type="text" name="ssc_roll_number" value={formData.ssc_roll_number} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year of Passing</label>
                                    <input type="number" name="ssc_year_of_passing" value={formData.ssc_year_of_passing} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                                    <input type="number" step="0.01" name="ssc_gpa" value={formData.ssc_gpa} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>
                         </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button 
                                type="button" 
                                onClick={() => navigate('/admin/users?tab=students')}
                                className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StudentEdit;
'''

with open('/home/fahimaloy/Projects/omar/frontend/src/pages/admin/StudentEdit.js', 'w') as f:
    f.write(content)
