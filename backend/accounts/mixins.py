from rest_framework import serializers
from django.db import models
from django.contrib.sites.shortcuts import get_current_site
from django.conf import settings

from .utils import encrypt_url



class ImageSerializerMixin(serializers.ModelSerializer):
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        
        image_fields = [
            field.name for field in instance._meta.get_fields()
            if isinstance(field, models.ImageField)
        ]
        
        for field_name in image_fields:
            image_field = getattr(instance, field_name)
            if image_field and hasattr(image_field, 'url'):
                try:
                    if request and not getattr(settings, 'DEFAULT_FILE_STORAGE', '').startswith('storages'):
                        absolute_url = request.build_absolute_uri(image_field.url)
                    else:
                        absolute_url = image_field.url
                        if absolute_url.startswith('/'):
                            absolute_url = f"{settings.SITE_URL}{absolute_url}"

                    # 🔐 ENCRYPT URL HERE (ONLY CHANGE)
                    representation[field_name] = encrypt_url(absolute_url)

                except Exception as e:
                    representation[field_name] = image_field.url
                    if settings.DEBUG:
                        print(f"Warning: Could not generate URL for {field_name}: {e}")
        
        return representation