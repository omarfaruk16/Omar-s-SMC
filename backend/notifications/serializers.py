from rest_framework import serializers


class PushSubscriptionSerializer(serializers.Serializer):
    endpoint = serializers.URLField()
    keys = serializers.DictField(child=serializers.CharField(), required=False)
    p256dh = serializers.CharField(required=False, allow_blank=False)
    auth = serializers.CharField(required=False, allow_blank=False)
    user_agent = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        keys = attrs.get('keys') or {}
        p256dh = attrs.get('p256dh') or keys.get('p256dh')
        auth = attrs.get('auth') or keys.get('auth')
        if not p256dh or not auth:
            raise serializers.ValidationError('Subscription keys are required.')
        attrs['p256dh'] = p256dh
        attrs['auth'] = auth
        return attrs


class PushUnregisterSerializer(serializers.Serializer):
    endpoint = serializers.URLField(required=True)
