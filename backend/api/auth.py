from functools import wraps
from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated

def requires_auth(f):
    """
    Decorador simplificado para autenticación
    """
    @wraps(f)
    def decorated_function(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        return f(request, *args, **kwargs)
    return decorated_function

def requires_roles(roles):
    """
    Decorador para verificar roles de usuario
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Authentication required'}, status=401)
            if request.user.role not in roles:
                return JsonResponse({'error': 'Insufficient permissions'}, status=403)
            return f(request, *args, **kwargs)
        return decorated_function
    return decorator