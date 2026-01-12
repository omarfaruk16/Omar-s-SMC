from django.conf import settings
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PushSubscription
from .serializers import PushSubscriptionSerializer, PushUnregisterSerializer


class PushConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'teacher':
            return Response({'error': 'Teacher access required'}, status=status.HTTP_403_FORBIDDEN)
        if not settings.WEBPUSH_PUBLIC_KEY:
            return Response({'error': 'Web push is not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'publicKey': settings.WEBPUSH_PUBLIC_KEY})


class PushSubscriptionViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request):
        if request.user.role != 'teacher':
            return Response({'error': 'Teacher access required'}, status=status.HTTP_403_FORBIDDEN)

        serializer = PushSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            teacher = request.user.teacher_profile
        except Exception:
            return Response({'error': 'Teacher profile not found'}, status=status.HTTP_404_NOT_FOUND)

        subscription, _ = PushSubscription.objects.update_or_create(
            endpoint=data['endpoint'],
            defaults={
                'teacher': teacher,
                'p256dh': data['p256dh'],
                'auth': data['auth'],
                'user_agent': data.get('user_agent', ''),
                'is_active': True,
                'last_seen': timezone.now(),
            },
        )

        return Response({'id': subscription.id, 'status': 'registered'})

    @action(detail=False, methods=['post'])
    def unregister(self, request):
        if request.user.role != 'teacher':
            return Response({'error': 'Teacher access required'}, status=status.HTTP_403_FORBIDDEN)

        serializer = PushUnregisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        endpoint = serializer.validated_data['endpoint']

        try:
            teacher = request.user.teacher_profile
        except Exception:
            return Response({'error': 'Teacher profile not found'}, status=status.HTTP_404_NOT_FOUND)

        subscription = PushSubscription.objects.filter(endpoint=endpoint, teacher=teacher).first()
        if subscription:
            subscription.is_active = False
            subscription.save(update_fields=['is_active', 'updated_at'])

        return Response({'status': 'unregistered'})
