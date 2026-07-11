from functools import wraps
from django.http import HttpResponse

def superuser_silent_action(view_method):
    @wraps(view_method)
    def wrapper(self, request, *args, **kwargs):
        if request.user.is_authenticated and request.user.is_superuser:
            return view_method(self, request, *args, **kwargs)

        return HttpResponse(status=204)

    return wrapper
#from django.utils.decorators import method_decorator

#@method_decorator(superuser_silent_action, name="dispatch")