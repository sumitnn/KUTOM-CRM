from rest_framework import serializers
from django.db import models
from django.contrib.sites.shortcuts import get_current_site
from django.conf import settings

# class ImageSerializerMixin(serializers.ModelSerializer):
#     def to_representation(self, instance):
#         representation = super().to_representation(instance)
#         request = self.context.get('request')
#         image_fields = [field.name for field in instance._meta.get_fields() if isinstance(field, models.ImageField)]
#         for field_name in image_fields:
#             value = getattr(instance, field_name)
#             if value:
#                 representation[field_name] = request.build_absolute_uri(value.url)
#         return representation
class ImageSerializerMixin(serializers.ModelSerializer):
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        
        # Get all image fields from the model
        image_fields = [
            field.name for field in instance._meta.get_fields() 
            if isinstance(field, models.ImageField)
        ]
        
        for field_name in image_fields:
            image_field = getattr(instance, field_name)
            if image_field and hasattr(image_field, 'url'):
                try:
                    # In development, use request.build_absolute_uri if available
                    if request and not getattr(settings, 'DEFAULT_FILE_STORAGE', '').startswith('storages'):
                        # For local development with local media files
                        representation[field_name] = request.build_absolute_uri(image_field.url)
                    else:
                        # For production with S3 or when request is not available
                        representation[field_name] = image_field.url
                        
                        # If the URL doesn't have a protocol, prepend SITE_URL
                        if representation[field_name].startswith('/'):
                            representation[field_name] = f"{settings.SITE_URL}{representation[field_name]}"
                            
                except Exception as e:
                    # Fallback to just the URL
                    representation[field_name] = image_field.url
                    if settings.DEBUG:
                        print(f"Warning: Could not generate absolute URL for {field_name}: {e}")
        
        return representation