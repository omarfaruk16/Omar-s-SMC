import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI, subjectAPI, examAPI } from '../../services/api'; 
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';

const StudentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [classSubjects, setClassSubjects] = useState([]);
    const [recentExams, setRecentExams] = useState([]);

    const fetchStudentDetails = useCallback(async () => {
        try {
            setLoading(true);
            const response = await studentAPI.getById(id);
            setStudent(response.data);
            
            const studentData = response.data;
            const classId = studentData.student_class_detail?.id || studentData.student_class;
            
            if (classId) {
                try {
                    const [subjectsRes, examsRes] = await Promise.all([
                        subjectAPI.getAll(),
                        examAPI.getAll(),
                    ]);
                    
                    const subjects = (subjectsRes.data || []).filter(subject =>
                        Number(subject.class_assigned) === Number(classId)
                    );
                    
                    const exams = (examsRes.data || [])
                        .filter((exam) => Number(exam.class_assigned) === Number(classId))
                        .sort((a, b) => {
                            const ad = a.date ? new Date(a.date) : new Date(a.created_at || 0);
                            const bd = b.date ? new Date(b.date) : new Date(b.created_at || 0);
                            return bd - ad;
                        })
                        .slice(0, 5);
                        
                    setClassSubjects(subjects);
                    setRecentExams(exams);
                } catch (err) {
                    console.error('Failed to load related class data:', err);
                }
            }
        } catch (error) {
            console.error('Error fetching student details:', error);
            toast.error('Failed to fetch student details');
            navigate('/admin/students');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, toast]);

    useEffect(() => {
        fetchStudentDetails();
    }, [fetchStudentDetails]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!student) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <button 
                    onClick={() => navigate('/admin/students')} 
                    className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Students
                </button>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="border-4 border-white rounded-full">
                                    <Avatar
                                        image={student.user?.image}
                                        name={`${student.user?.first_name || ''} ${student.user?.last_name || ''}`}
                                        size="2xl"
                                    />
                                </div>
                                <div className="text-white">
                                    <h2 className="text-2xl font-bold">
                                        {student.user?.first_name} {student.user?.last_name}
                                    </h2>
                                    <p className="opacity-90">Roll: {student.roll_number} | Class: {student.student_class_detail?.name}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                student.user?.status === 'approved' ? 'bg-green-100 text-green-800' :
                                student.user?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {student.user?.status?.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Personal Info */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Personal Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm text-gray-500 block">Full Name</span>
                                        <span className="font-medium">{student.user?.first_name} {student.user?.last_name}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block">Email</span>
                                        <span className="font-medium">{student.user?.email}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-500 block">Phone</span>
                                            <span className="font-medium">{student.user?.phone_number || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500 block">Session</span>
                                            <span className="font-medium">{student.student_class_detail?.session || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-500 block">Date of Birth</span>
                                            <span className="font-medium">{student.date_of_birth || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500 block">Gender</span>
                                            <span className="font-medium">{student.gender || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-500 block">Religion</span>
                                            <span className="font-medium">{student.religion || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500 block">Blood Group</span>
                                            <span className="font-medium">{student.blood_group || 'N/A'}</span>
                                        </div>
                                    </div>
                                     <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-500 block">Birth Reg. No.</span>
                                            <span className="font-medium">{student.birth_registration_number || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500 block">Nationality</span>
                                            <span className="font-medium">{student.nationality || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address Info */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Address Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm text-gray-500 block">Current Address</span>
                                        <span className="font-medium">{student.address || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block">Permanent Address</span>
                                        <span className="font-medium">{student.permanent_address || 'N/A'}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-500 block">District</span>
                                            <span className="font-medium">{student.district || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500 block">Post Code</span>
                                            <span className="font-medium">{student.post_code || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500 block">Upazilla/Thana</span>
                                            <span className="font-medium">{student.upazilla_thana || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Family Info */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Family Information</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-500 block">Father's Name</span>
                                            <span className="font-medium">{student.fathers_name || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500 block">Father's Occupation</span>
                                            <span className="font-medium">{student.fathers_occupation || 'N/A'}</span>
                                        </div>
                                         <div>
                                            <span className="text-sm text-gray-500 block">Father's NID</span>
                                            <span className="font-medium">{student.fathers_nid || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="border-t pt-2 grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-500 block">Mother's Name</span>
                                            <span className="font-medium">{student.mothers_name || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500 block">Mother's Occupation</span>
                                            <span className="font-medium">{student.mothers_occupation || 'N/A'}</span>
                                        </div>
                                         <div>
                                            <span className="text-sm text-gray-500 block">Mother's NID</span>
                                            <span className="font-medium">{student.mothers_nid || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="border-t pt-2 grid grid-cols-2 gap-4">
                                         <div>
                                            <span className="text-sm text-gray-500 block">Guardian Name</span>
                                            <span className="font-medium">{student.guardian_name || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500 block">Guardian Phone</span>
                                            <span className="font-medium">{student.guardian_phone || 'N/A'}</span>
                                        </div>
                                         <div>
                                            <span className="text-sm text-gray-500 block">Guardian Income</span>
                                            <span className="font-medium">{student.guardian_monthly_income ? `${student.guardian_monthly_income} BDT` : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                             {/* Academic History (SSC) */}
                             <div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Academic History (SSC)</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-500 block">SSC Board</span>
                                            <span className="font-medium">{student.ssc_board || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500 block">SSC Group</span>
                                            <span className="font-medium">{student.ssc_group || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-500 block">SSC Roll No</span>
                                            <span className="font-medium">{student.ssc_roll_number || 'N/A'}</span>
                                        </div>
                                         <div>
                                            <span className="text-sm text-gray-500 block">SSC Registration No</span>
                                            <span className="font-medium">{student.ssc_registration_no || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-500 block">Passing Year</span>
                                            <span className="font-medium">{student.ssc_year_of_passing || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500 block">SSC GPA</span>
                                            <span className="font-medium">{student.ssc_gpa || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Current Academic Info */}
                            <div className="md:col-span-2">
                                <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Current Academic Status</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Class Subjects</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {classSubjects.length > 0 ? (
                                                classSubjects.map(subject => (
                                                    <span key={subject.id} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                                        {subject.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-500">No subjects found</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Exams</h4>
                                        <div className="space-y-2">
                                            {recentExams.length > 0 ? (
                                                recentExams.map(exam => (
                                                    <div key={exam.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                                        <span className="font-medium">{exam.name}</span>
                                                        <span className="text-gray-500">{new Date(exam.date).toLocaleDateString()}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-500">No recent exams found</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDetails;
