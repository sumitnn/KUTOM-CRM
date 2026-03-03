from rest_framework import serializers
from django.db import models
from django.contrib.sites.shortcuts import get_current_site
from django.conf import settings

from .utils import encrypt_url



class ImageSerializerMixin(serializers.ModelSerializer):
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')

        file_fields = [
            field.name for field in instance._meta.get_fields()
            if isinstance(field, (models.ImageField, models.FileField))  # ✅ UPDATED
        ]

        for field_name in file_fields:
            file_field = getattr(instance, field_name)

            if file_field and hasattr(file_field, 'url'):
                try:
                    if request and not getattr(settings, 'DEFAULT_FILE_STORAGE', '').startswith('storages'):
                        absolute_url = request.build_absolute_uri(file_field.url)
                    else:
                        absolute_url = file_field.url
                        if absolute_url.startswith('/'):
                            absolute_url = f"{settings.SITE_URL}{absolute_url}"

                    # 🔐 ENCRYPT URL
                    representation[field_name] = encrypt_url(absolute_url)

                except Exception as e:
                    representation[field_name] = file_field.url
                    if settings.DEBUG:
                        print(f"Warning: Could not generate URL for {field_name}: {e}")

        return representation