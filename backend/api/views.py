from django.http import HttpResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
	return Response(
		{
			'service': 'Tunely backend API',
			'status': 'running',
			'health': '/api/health/',
		}
	)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
	return Response(
		{
			'status': 'ok',
			'timestamp': timezone.now().isoformat(),
		}
	)


def favicon(request):
	return HttpResponse(status=204)
