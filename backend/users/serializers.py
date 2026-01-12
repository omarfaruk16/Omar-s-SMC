from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Teacher, Student
from classes.models import Class
from academics.models import Subject

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 
                  'role', 'status', 'image', 'password', 'date_joined']
        read_only_fields = ['id', 'date_joined']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class TeacherRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for Teacher registration"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField()
    nid = serializers.CharField()
    image = serializers.ImageField(required=False)
    teacher_id = serializers.CharField()
    designation = serializers.CharField()
    class_id = serializers.PrimaryKeyRelatedField(
        source='preferred_class',
        queryset=Class.objects.all(),
        write_only=True
    )
    subject_id = serializers.PrimaryKeyRelatedField(
        source='preferred_subject',
        queryset=Subject.objects.all(),
        write_only=True
    )
    
    class Meta:
        model = Teacher
        fields = [
            'email', 'password', 'first_name', 'last_name', 'phone', 'nid',
            'teacher_id', 'designation', 'class_id', 'subject_id', 'image'
        ]

    def validate_teacher_id(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError('Teacher ID is required.')
        exists = Teacher.objects.filter(teacher_id__iexact=normalized).exists()
        if exists:
            raise serializers.ValidationError('A teacher with this ID already exists.')
        return normalized.upper()

    def validate(self, attrs):
        preferred_class = attrs.get('preferred_class')
        preferred_subject = attrs.get('preferred_subject')

        if not preferred_class:
            raise serializers.ValidationError({'class_id': 'Class selection is required.'})
        if not preferred_subject:
            raise serializers.ValidationError({'subject_id': 'Subject selection is required.'})

        if not preferred_subject.classes.filter(id=preferred_class.id).exists():
            raise serializers.ValidationError({
                'subject_id': 'Selected subject is not offered in the chosen class.'
            })

        return attrs
    
    def create(self, validated_data):
        # Extract user fields
        email = validated_data.pop('email')
        user_data = {
            'email': email,
            'username': email.split('@')[0],
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'phone': validated_data.pop('phone'),
            'role': 'teacher',
            'status': 'pending'
        }
        
        if 'image' in validated_data:
            user_data['image'] = validated_data.pop('image')
        
        password = validated_data.pop('password')
        
        # Create user
        user = User(**user_data)
        user.set_password(password)
        user.save()

        teacher_id = validated_data.pop('teacher_id').strip().upper()
        
        # Create teacher profile
        designation = validated_data.get('designation')
        if designation is not None:
            validated_data['designation'] = designation.strip()

        teacher = Teacher.objects.create(
            user=user,
            teacher_id=teacher_id,
            **validated_data
        )
        return teacher


class StudentRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for Student registration"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    # Accept phone field under 'phone' or 'phone_number'
    phone_number = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)
    student_class = serializers.PrimaryKeyRelatedField(required=False, allow_null=True, queryset=get_user_model().objects.none())
    date_of_birth = serializers.DateField(required=False)
    address = serializers.CharField(required=False, allow_blank=True)
    guardian_name = serializers.CharField(required=False, allow_blank=True)
    guardian_phone = serializers.CharField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False)
    
    class Meta:
        model = Student
        fields = [
            'email',
            'password',
            'first_name',
            'last_name',
            'phone',
            'phone_number',
            'student_class',
            'date_of_birth',
            'address',
            'guardian_name',
            'guardian_phone',
            'image',
        ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from classes.models import Class
        self.fields['student_class'].queryset = Class.objects.all()
    
    def create(self, validated_data):
        # Extract user fields
        # Map phone_number to phone if present
        phone = validated_data.pop('phone', None) or validated_data.pop('phone_number', '')
        email = validated_data.pop('email')

        user_data = {
            'email': email,
            'username': email.split('@')[0],
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'phone': phone,
            'role': 'student',
            'status': 'pending'
        }
        
        if 'image' in validated_data:
            user_data['image'] = validated_data.pop('image')
        
        password = validated_data.pop('password')
        
        # Create user
        user = User(**user_data)
        user.set_password(password)
        user.save()
        
        # Create student profile with optional fields
        student = Student.objects.create(user=user, **validated_data)
        return student


class TeacherSerializer(serializers.ModelSerializer):
    """Serializer for Teacher model"""
    user = UserSerializer(read_only=True)
    assigned_classes = serializers.SerializerMethodField()
    preferred_class_detail = serializers.SerializerMethodField()
    preferred_subject_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Teacher
        fields = [
            'id',
            'user',
            'nid',
            'teacher_id',
            'designation',
            'preferred_class',
            'preferred_subject',
            'preferred_class_detail',
            'preferred_subject_detail',
            'assigned_classes'
        ]
        read_only_fields = [
            'preferred_class_detail',
            'preferred_subject_detail',
            'assigned_classes'
        ]
    
    def get_assigned_classes(self, obj):
        from classes.serializers import ClassSerializer
        return ClassSerializer(obj.assigned_classes.all(), many=True).data

    def get_preferred_class_detail(self, obj):
        if obj.preferred_class:
            from classes.serializers import ClassSerializer
            return ClassSerializer(obj.preferred_class).data
        return None

    def get_preferred_subject_detail(self, obj):
        if obj.preferred_subject:
            return {
                'id': obj.preferred_subject.id,
                'name': obj.preferred_subject.name,
                'code': obj.preferred_subject.code,
            }
        return None


class PublicTeacherSerializer(serializers.ModelSerializer):
    """Public-safe teacher info for listing approved teachers"""
    full_name = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    assigned_classes = serializers.SerializerMethodField()
    preferred_subject = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = ['id', 'full_name', 'image', 'designation', 'preferred_subject', 'assigned_classes']

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_image(self, obj):
        if obj.user.image:
            request = self.context.get('request')
            url = obj.user.image.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_assigned_classes(self, obj):
        return [
            {
                'id': c.id,
                'name': c.name,
                'section': c.section,
            }
            for c in obj.assigned_classes.all()
        ]

    def get_preferred_subject(self, obj):
        if obj.preferred_subject:
            return {
                'id': obj.preferred_subject.id,
                'name': obj.preferred_subject.name,
                'code': obj.preferred_subject.code,
            }
        return None

class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student model"""
    user = UserSerializer(read_only=True)
    student_class_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'user', 'student_class', 'student_class_detail',
            'roll_number', 'date_of_birth', 'address', 'guardian_name', 'guardian_phone'
        ]
    
    def get_student_class_detail(self, obj):
        if obj.student_class:
            from classes.serializers import ClassSerializer
            return ClassSerializer(obj.student_class).data
        return None


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for profile read/update with role-specific fields."""

    # Student fields
    student_class = serializers.PrimaryKeyRelatedField(read_only=True)
    student_class_detail = serializers.SerializerMethodField()
    roll_number = serializers.SerializerMethodField()
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    guardian_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    guardian_phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    # Teacher fields
    nid = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    designation = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    teacher_id = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'phone',
            'role',
            'status',
            'image',
            'date_joined',
            'student_class',
            'student_class_detail',
            'roll_number',
            'date_of_birth',
            'address',
            'guardian_name',
            'guardian_phone',
            'nid',
            'designation',
            'teacher_id',
        ]
        read_only_fields = [
            'id',
            'role',
            'status',
            'date_joined',
            'student_class',
            'student_class_detail',
            'teacher_id',
        ]

    def get_student_class_detail(self, obj):
        if hasattr(obj, 'student_profile') and obj.student_profile.student_class:
            from classes.serializers import ClassSerializer
            return ClassSerializer(obj.student_profile.student_class).data
        return None

    def get_roll_number(self, obj):
        if hasattr(obj, 'student_profile'):
            return obj.student_profile.roll_number
        return None

    def update(self, instance, validated_data):
        student_fields = {
            'date_of_birth',
            'address',
            'guardian_name',
            'guardian_phone',
        }
        teacher_fields = {
            'nid',
            'designation',
        }

        # Update user fields
        for attr in ['email', 'first_name', 'last_name', 'phone', 'image']:
            if attr in validated_data:
                setattr(instance, attr, validated_data.get(attr))
        instance.save()

        # Update role-specific profile fields
        if instance.role == 'student' and hasattr(instance, 'student_profile'):
            student_profile = instance.student_profile
            for field in student_fields:
                if field in validated_data:
                    setattr(student_profile, field, validated_data.get(field))
            student_profile.save()

        if instance.role == 'teacher' and hasattr(instance, 'teacher_profile'):
            teacher_profile = instance.teacher_profile
            for field in teacher_fields:
                if field in validated_data:
                    setattr(teacher_profile, field, validated_data.get(field))
            teacher_profile.save()

        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        validate_password(attrs['new_password'], self.context.get('user'))
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    reset_token = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        validate_password(attrs['new_password'], self.context.get('user'))
        return attrs
