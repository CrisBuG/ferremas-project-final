from rest_framework import serializers
from .models import Promotion, Coupon, PromotionUsage

class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = '__all__'

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = '__all__'

class PromotionUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionUsage
        fields = '__all__'