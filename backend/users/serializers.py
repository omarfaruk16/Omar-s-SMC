from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Teacher, Student

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
    
    class Meta:
        model = Teacher
        fields = ['email', 'password', 'first_name', 'last_name', 'phone', 'nid', 'image']
    
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
        
        # Create teacher profile
        teacher = Teacher.objects.create(user=user, **validated_data)
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
        fields = ['email', 'password', 'first_name', 'last_name', 'phone', 'student_class', 'image']
    
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
    
    class Meta:
        model = Teacher
        fields = ['id', 'user', 'nid', 'assigned_classes']
    
    def get_assigned_classes(self, obj):
        from classes.serializers import ClassSerializer
        return ClassSerializer(obj.assigned_classes.all(), many=True).data


class PublicTeacherSerializer(serializers.ModelSerializer):
    """Public-safe teacher info for listing approved teachers"""
    full_name = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    assigned_classes = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = ['id', 'full_name', 'image', 'assigned_classes']

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

class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student model"""
    user = UserSerializer(read_only=True)
    student_class_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'user', 'student_class', 'student_class_detail',
            'date_of_birth', 'address', 'guardian_name', 'guardian_phone'
        ]
    
    def get_student_class_detail(self, obj):
        if obj.student_class:
            from classes.serializers import ClassSerializer
            return ClassSerializer(obj.student_class).data
        return None
