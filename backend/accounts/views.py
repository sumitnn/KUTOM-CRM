from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer

@api_view(['POST'])
def create_user(request):
    """
    Create a new user.
    """
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'status': 'success',
            'message': 'User created successfully',
            'data': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response({
        'status': 'error',
        'message': 'User creation failed',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def edit_user(request, user_id):
    """
    Edit an existing user.
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = UserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'status': 'success',
            'message': 'User updated successfully',
            'data': UserSerializer(user).data
        }, status=status.HTTP_200_OK)
    return Response({
        'status': 'error',
        'message': 'User update failed',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_user(request, user_id):
    """
    Delete an existing user.
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    user.delete()
    return Response({
        'status': 'success',
        'message': 'User deleted successfully'
    }, status=status.HTTP_200_OK)