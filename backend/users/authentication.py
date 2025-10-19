from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that includes user status"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add custom claims
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'status': self.user.status,  # Include status: pending/approved/rejected
            'phone': self.user.phone,
            'image': self.user.image.url if self.user.image else None,
        }
        
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view that allows login for all users regardless of status"""
    serializer_class = CustomTokenObtainPairSerializer
