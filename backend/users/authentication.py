from rest_framework.exceptions import AuthenticationFailed
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that includes user status"""

    def validate(self, attrs):
        data = super().validate(attrs)

        # Enforce the approval workflow: only approved accounts may obtain tokens.
        if self.user.status == 'pending':
            raise AuthenticationFailed('Your account is pending admin approval.', code='account_pending')
        if self.user.status == 'rejected':
            raise AuthenticationFailed('Your account registration was rejected.', code='account_rejected')

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
    """Token view that blocks pending/rejected accounts and throttles brute force."""
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'
