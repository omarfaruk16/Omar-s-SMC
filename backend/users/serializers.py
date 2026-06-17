from rest_framework import serializers
from django.db import IntegrityError, transaction
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Teacher, Student
from classes.models import Class
from academics.models import Subject, TeacherSubjectAssignment

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 
              'role', 'status', 'is_active', 'image', 'password', 'date_joined']
        read_only_fields = ['id', 'date_joined']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            request = self.context.get('request')
            url = instance.image.url
            data['image'] = request.build_absolute_uri(url) if request is not None else url
        return data
    
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
    """Serializer for Teacher registration with multiple class-subject assignments"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField(required=False)
    phone_number = serializers.CharField(required=False)
    nid = serializers.CharField()
    image = serializers.ImageField(required=False)
    teacher_id = serializers.CharField(required=False, allow_blank=True)
    designation = serializers.CharField()
    # Support old single class/subject fields for backwards compatibility
    class_id = serializers.PrimaryKeyRelatedField(
        source='preferred_class',
        queryset=Class.objects.all(),
        required=False,
        allow_null=True
    )
    subject_id = serializers.PrimaryKeyRelatedField(
        source='preferred_subject',
        queryset=Subject.objects.all(),
        required=False,
        allow_null=True
    )
    # New field for multiple assignments
    # Accept JSON list of dicts or JSON string from multipart form-data
    class_subject_assignments = serializers.ListField(
        child=serializers.JSONField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Teacher
        fields = [
            'email', 'password', 'first_name', 'last_name', 'phone', 'phone_number', 'nid',
            'teacher_id', 'designation', 'class_id', 'subject_id',
            'class_subject_assignments', 'image'
        ]

    def to_internal_value(self, data):
        """Handle JSON strings in FormData submissions"""
        import json
        data = data.copy() if hasattr(data, 'copy') else data
        
        # Parse class_subject_assignments if it's a JSON string (from FormData)
        if 'class_subject_assignments' in data:
            assignments = data['class_subject_assignments']
            if isinstance(assignments, str):
                try:
                    data['class_subject_assignments'] = json.loads(assignments)
                except (json.JSONDecodeError, ValueError):
                    pass
        
        return super().to_internal_value(data)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return email

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_teacher_id(self, value):
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            return None
        exists = Teacher.objects.filter(teacher_id__iexact=normalized).exists()
        if exists:
            raise serializers.ValidationError('A teacher with this ID already exists.')
        return normalized.upper()

    def validate(self, attrs):
        import json
        assignments = attrs.get('class_subject_assignments', [])

        def _parse_assignments(value):
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, ValueError):
                    return value
            if isinstance(value, list) and len(value) == 1 and isinstance(value[0], str):
                try:
                    return json.loads(value[0])
                except (json.JSONDecodeError, ValueError):
                    return value
            # Flatten if nested list with single list item
            if isinstance(value, list) and len(value) == 1 and isinstance(value[0], list):
                return value[0]
            return value

        def _extract_ids(item):
            if isinstance(item, str):
                try:
                    item = json.loads(item)
                except (json.JSONDecodeError, ValueError):
                    return None, None, item
            if isinstance(item, (list, tuple)):
                try:
                    item = dict(item)
                except Exception:
                    return None, None, item
            if not isinstance(item, dict):
                return None, None, item

            class_id = item.get('class_id')
            subject_id = item.get('subject_id')

            if class_id is None:
                class_id = item.get('classId') or item.get('class')
                if isinstance(class_id, dict):
                    class_id = class_id.get('id')
            if subject_id is None:
                subject_id = item.get('subjectId') or item.get('subject')
                if isinstance(subject_id, dict):
                    subject_id = subject_id.get('id')

            if isinstance(class_id, str) and class_id.isdigit():
                class_id = int(class_id)
            if isinstance(subject_id, str) and subject_id.isdigit():
                subject_id = int(subject_id)

            item['class_id'] = class_id
            item['subject_id'] = subject_id
            return class_id, subject_id, item

        # Normalize assignments when multipart sends JSON as a single string
        assignments = _parse_assignments(assignments)

        # If parsing failed, attempt to parse from initial_data
        if (not assignments) and hasattr(self, 'initial_data') and 'class_subject_assignments' in self.initial_data:
            assignments = _parse_assignments(self.initial_data.get('class_subject_assignments'))

        attrs['class_subject_assignments'] = assignments
        preferred_class = attrs.get('preferred_class')
        preferred_subject = attrs.get('preferred_subject')

        # If multiple assignments are provided, validate them
        if assignments:
            if not isinstance(assignments, list) or len(assignments) == 0:
                raise serializers.ValidationError({
                    'class_subject_assignments': 'Please provide at least one class-subject combination.'
                })
            
            for idx, assignment in enumerate(assignments):
                class_id, subject_id, normalized = _extract_ids(assignment)
                assignments[idx] = normalized
                if not isinstance(normalized, dict):
                    raise serializers.ValidationError({
                        'class_subject_assignments': 'Each assignment must be an object with class_id and subject_id.'
                    })
                
                # Fix: Check for None explicitly instead of falsy check (0 is valid)
                if class_id is None or subject_id is None:
                    raise serializers.ValidationError({
                        'class_subject_assignments': f'Assignment {idx + 1}: Both class_id and subject_id are required. Got class_id={class_id}, subject_id={subject_id}'
                    })
                
                try:
                    cls = Class.objects.get(id=class_id)
                except Class.DoesNotExist:
                    raise serializers.ValidationError({
                        'class_subject_assignments': f'Assignment {idx + 1}: Invalid class ID.'
                    })
                
                try:
                    subject = Subject.objects.get(id=subject_id)
                except Subject.DoesNotExist:
                    raise serializers.ValidationError({
                        'class_subject_assignments': f'Assignment {idx + 1}: Invalid subject ID.'
                    })
                
                if subject.class_assigned_id != cls.id:
                    raise serializers.ValidationError({
                        'class_subject_assignments': f'Assignment {idx + 1}: Subject "{subject.name}" is not offered in class "{cls.name}".'
                    })
        else:
            # Fallback to single class/subject validation if assignments not provided
            if not preferred_class:
                raise serializers.ValidationError({'class_id': 'Class selection is required.'})
            if not preferred_subject:
                raise serializers.ValidationError({'subject_id': 'Subject selection is required.'})

            if preferred_subject.class_assigned_id != preferred_class.id:
                raise serializers.ValidationError({
                    'subject_id': 'Selected subject is not offered in the chosen class.'
                })

        return attrs
    
    def create(self, validated_data):
        try:
            with transaction.atomic():
                # Extract user fields
                email = validated_data.pop('email')
                phone = validated_data.pop('phone', None) or validated_data.pop('phone_number', '')
                user_data = {
                    'email': email,
                    'username': email.split('@')[0],
                    'first_name': validated_data.pop('first_name'),
                    'last_name': validated_data.pop('last_name'),
                    'phone': phone,
                    'role': 'teacher',
                    'status': 'pending'
                }
                
                if 'image' in validated_data:
                    user_data['image'] = validated_data.pop('image')
                
                password = validated_data.pop('password')
                assignments = validated_data.pop('class_subject_assignments', [])
                
                # Create user
                user = User(**user_data)
                user.set_password(password)
                user.save()

                raw_teacher_id = validated_data.pop('teacher_id', '')
                teacher_id = raw_teacher_id.strip().upper() if raw_teacher_id else None
                
                # Create teacher profile
                designation = validated_data.get('designation')
                if designation is not None:
                    validated_data['designation'] = designation.strip()

                teacher = Teacher.objects.create(
                    user=user,
                    teacher_id=teacher_id,
                    **validated_data
                )

                # Create subject assignments if provided
                if assignments:
                    class_ids = set()
                    for assignment in assignments:
                        TeacherSubjectAssignment.objects.create(
                            teacher=teacher,
                            class_assigned_id=assignment['class_id'],
                            subject_id=assignment['subject_id']
                        )
                        class_ids.add(assignment['class_id'])
                    if class_ids:
                        teacher.assigned_classes.set(Class.objects.filter(id__in=class_ids))
                elif teacher.preferred_class and teacher.preferred_subject:
                    # Create default assignment from preferred class/subject
                    TeacherSubjectAssignment.objects.create(
                        teacher=teacher,
                        class_assigned=teacher.preferred_class,
                        subject=teacher.preferred_subject
                    )
                    teacher.assigned_classes.set([teacher.preferred_class])

                return teacher
        except IntegrityError:
            raise serializers.ValidationError('Unable to create teacher. Please ensure email, NID, and teacher ID are unique.')
        except Exception as exc:
            raise serializers.ValidationError(f'Unable to create teacher: {str(exc)}')


class StudentRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for Student registration"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone_number = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)
    image = serializers.ImageField(required=False)
    registration = serializers.CharField(required=False, allow_blank=True)
    session = serializers.CharField(required=False, allow_blank=True)
    
    # Personal Information
    bangla_name = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False)
    birth_registration_number = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.ChoiceField(choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], required=False)
    religion = serializers.CharField(required=False, allow_blank=True)
    blood_group = serializers.CharField(required=False, allow_blank=True)
    nationality = serializers.CharField(required=False, default='Bangladeshi')
    
    # Address Information
    address = serializers.CharField(required=False, allow_blank=True)
    village = serializers.CharField(required=False, allow_blank=True)
    post_office = serializers.CharField(required=False, allow_blank=True)
    permanent_address = serializers.CharField(required=False, allow_blank=True)
    post_code = serializers.CharField(required=False, allow_blank=True)
    upazilla_thana = serializers.CharField(required=False, allow_blank=True)
    district = serializers.CharField(required=False, allow_blank=True)
    
    # Family Information
    fathers_name = serializers.CharField(required=False, allow_blank=True)
    fathers_nid = serializers.CharField(required=False, allow_blank=True)
    fathers_occupation = serializers.CharField(required=False, allow_blank=True)
    mothers_name = serializers.CharField(required=False, allow_blank=True)
    mothers_nid = serializers.CharField(required=False, allow_blank=True)
    mothers_occupation = serializers.CharField(required=False, allow_blank=True)
    guardian_name = serializers.CharField(required=False, allow_blank=True)
    guardian_phone = serializers.CharField(required=False, allow_blank=True)
    guardian_monthly_income = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    
    # Academic History
    ssc_board = serializers.CharField(required=False, allow_blank=True)
    ssc_registration_no = serializers.CharField(required=False, allow_blank=True)
    ssc_group = serializers.CharField(required=False, allow_blank=True)
    ssc_roll_number = serializers.CharField(required=False, allow_blank=True)
    ssc_year_of_passing = serializers.IntegerField(required=False, allow_null=True)
    ssc_gpa = serializers.DecimalField(max_digits=4, decimal_places=2, required=False, allow_null=True)
    
    # Subject Selections
    first_subject_id = serializers.PrimaryKeyRelatedField(source='first_subject', queryset=Subject.objects.all(), required=False, allow_null=True)
    second_subject_id = serializers.PrimaryKeyRelatedField(source='second_subject', queryset=Subject.objects.all(), required=False, allow_null=True)
    third_subject_id = serializers.PrimaryKeyRelatedField(source='third_subject', queryset=Subject.objects.all(), required=False, allow_null=True)
    fourth_subject_id = serializers.PrimaryKeyRelatedField(source='fourth_subject', queryset=Subject.objects.all(), required=False, allow_null=True)
    
    student_class = serializers.PrimaryKeyRelatedField(required=False, allow_null=True, queryset=get_user_model().objects.none())
    
    class Meta:
        model = Student
        fields = [
            'email', 'password', 'first_name', 'last_name', 'phone', 'phone_number', 'image',
            'registration', 'session',
            'bangla_name', 'date_of_birth', 'birth_registration_number', 'gender', 'religion', 'blood_group', 'nationality',
            'address', 'village', 'post_office', 'permanent_address', 'post_code', 'upazilla_thana', 'district',
            'fathers_name', 'fathers_nid', 'fathers_occupation',
            'mothers_name', 'mothers_nid', 'mothers_occupation',
            'guardian_name', 'guardian_phone', 'guardian_monthly_income',
            'ssc_board', 'ssc_registration_no', 'ssc_group', 'ssc_roll_number', 'ssc_year_of_passing', 'ssc_gpa',
            'first_subject_id', 'second_subject_id', 'third_subject_id', 'fourth_subject_id',
            'student_class',
        ]

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return email

    def validate_password(self, value):
        validate_password(value)
        return value

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from classes.models import Class
        self.fields['student_class'].queryset = Class.objects.all()

    def to_internal_value(self, data):
        data = data.copy()
        if isinstance(data.get('gender'), str):
            data['gender'] = data['gender'].strip().lower()
        for field in ['ssc_year_of_passing', 'ssc_gpa', 'guardian_monthly_income', 'ssc_year_of_passing']:
            if data.get(field) == '':
                data[field] = None
        if data.get('date_of_birth') == '':
            data['date_of_birth'] = None
        return super().to_internal_value(data)
    
    def create(self, validated_data):
        try:
            with transaction.atomic():
                # Extract user fields
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
                
                # Prepare student data - ensure all fields are properly mapped
                student_data = {}
                
                # Map all valid Student model fields from validated_data
                student_fields = [
                    'student_class', 'roll_number', 'registration', 'session', 'bangla_name',
                    'date_of_birth', 'birth_registration_number', 'gender', 'religion',
                    'blood_group', 'nationality', 'address', 'permanent_address', 'village',
                    'post_office', 'post_code', 'upazilla_thana', 'district',
                    'fathers_name', 'fathers_nid', 'fathers_occupation',
                    'mothers_name', 'mothers_nid', 'mothers_occupation',
                    'guardian_name', 'guardian_phone', 'guardian_monthly_income',
                    'ssc_board', 'ssc_registration_no', 'ssc_group', 'ssc_roll_number',
                    'ssc_year_of_passing', 'ssc_gpa',
                    'first_subject', 'second_subject', 'third_subject', 'fourth_subject'
                ]
                
                for field in student_fields:
                    if field in validated_data:
                        student_data[field] = validated_data[field]
                
                # Create student profile
                student = Student.objects.create(user=user, **student_data)
                return student
        except IntegrityError as e:
            raise serializers.ValidationError(f'Unable to create student. Please ensure email is unique and data is valid. Error: {str(e)}')
        except Exception as e:
            raise serializers.ValidationError(f'Unable to create student: {str(e)}')


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
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    assigned_classes = serializers.SerializerMethodField()
    preferred_subject = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = ['id', 'full_name', 'email', 'phone', 'image', 'designation', 'preferred_subject', 'assigned_classes']

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_email(self, obj):
        return obj.user.email or None

    def get_phone(self, obj):
        return obj.user.phone or None

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
    first_subject_detail = serializers.SerializerMethodField()
    second_subject_detail = serializers.SerializerMethodField()
    third_subject_detail = serializers.SerializerMethodField()
    fourth_subject_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'user', 'student_class', 'student_class_detail',
            'roll_number', 'registration', 'session',
            'bangla_name', 'date_of_birth', 'birth_registration_number',
            'gender', 'religion', 'blood_group', 'nationality',
            'address', 'village', 'post_office', 'permanent_address', 'post_code', 'upazilla_thana', 'district',
            'fathers_name', 'fathers_nid', 'fathers_occupation',
            'mothers_name', 'mothers_nid', 'mothers_occupation',
            'guardian_name', 'guardian_phone', 'guardian_monthly_income',
            'ssc_board', 'ssc_registration_no', 'ssc_group', 'ssc_roll_number',
            'ssc_year_of_passing', 'ssc_gpa',
            'first_subject', 'second_subject', 'third_subject', 'fourth_subject',
            'first_subject_detail', 'second_subject_detail', 'third_subject_detail', 'fourth_subject_detail'
        ]

    def to_internal_value(self, data):
        data = data.copy()
        for field in ['ssc_year_of_passing', 'ssc_gpa', 'guardian_monthly_income', 'ssc_year_of_passing']:
            if data.get(field) == '':
                data[field] = None
        if data.get('date_of_birth') == '':
            data['date_of_birth'] = None
        return super().to_internal_value(data)
    
    def get_student_class_detail(self, obj):
        if obj.student_class:
            from classes.serializers import ClassSerializer
            return ClassSerializer(obj.student_class).data
        return None

    def _subject_detail(self, subject):
        if not subject:
            return None
        return {
            'id': subject.id,
            'name': subject.name,
            'code': subject.code,
        }

    def get_first_subject_detail(self, obj):
        return self._subject_detail(obj.first_subject)

    def get_second_subject_detail(self, obj):
        return self._subject_detail(obj.second_subject)

    def get_third_subject_detail(self, obj):
        return self._subject_detail(obj.third_subject)

    def get_fourth_subject_detail(self, obj):
        return self._subject_detail(obj.fourth_subject)


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for profile read/update with role-specific fields."""

    # Student fields
    student_class = serializers.PrimaryKeyRelatedField(read_only=True, source='student_profile.student_class')
    student_class_detail = serializers.SerializerMethodField()
    roll_number = serializers.SerializerMethodField()
    registration = serializers.CharField(read_only=True, source='student_profile.registration')
    session = serializers.CharField(read_only=True, source='student_profile.session')
    
    bangla_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, source='student_profile.bangla_name')
    date_of_birth = serializers.DateField(required=False, allow_null=True, source='student_profile.date_of_birth')
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True, source='student_profile.address')
    village = serializers.CharField(required=False, allow_blank=True, allow_null=True, source='student_profile.village')
    post_office = serializers.CharField(required=False, allow_blank=True, allow_null=True, source='student_profile.post_office')
    guardian_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, source='student_profile.guardian_name')
    guardian_phone = serializers.CharField(required=False, allow_blank=True, allow_null=True, source='student_profile.guardian_phone')
    guardian_monthly_income = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True, source='student_profile.guardian_monthly_income')
    fathers_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, source='student_profile.fathers_name')
    fathers_nid = serializers.CharField(required=False, allow_blank=True, allow_null=True, source='student_profile.fathers_nid')
    fathers_occupation = serializers.CharField(required=False, allow_blank=True, allow_null=True, source='student_profile.fathers_occupation')
    mothers_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, source='student_profile.mothers_name')
    mothers_nid = serializers.CharField(required=False, allow_blank=True, allow_null=True, source='student_profile.mothers_nid')
    mothers_occupation = serializers.CharField(required=False, allow_blank=True, allow_null=True, source='student_profile.mothers_occupation')

    # Teacher fields
    nid = serializers.CharField(required=False, allow_blank=True, allow_null=True, source='teacher_profile.nid')
    designation = serializers.CharField(required=False, allow_blank=True, allow_null=True, source='teacher_profile.designation')
    teacher_id = serializers.CharField(read_only=True, source='teacher_profile.teacher_id')

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
            'registration',
            'session',
            'bangla_name',
            'date_of_birth',
            'address',
            'village',
            'post_office',
            'guardian_name',
            'guardian_phone',
            'guardian_monthly_income',
            'fathers_name',
            'fathers_nid',
            'fathers_occupation',
            'mothers_name',
            'mothers_nid',
            'mothers_occupation',
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
            'roll_number',
            'registration',
            'session',
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
        student_data = validated_data.pop('student_profile', {})
        teacher_data = validated_data.pop('teacher_profile', {})
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update role-specific profile fields
        if instance.role == 'student' and hasattr(instance, 'student_profile'):
            student_profile = instance.student_profile
            for attr, value in student_data.items():
                setattr(student_profile, attr, value)
            student_profile.save()

        if instance.role == 'teacher' and hasattr(instance, 'teacher_profile'):
            teacher_profile = instance.teacher_profile
            for attr, value in teacher_data.items():
                setattr(teacher_profile, attr, value)
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
