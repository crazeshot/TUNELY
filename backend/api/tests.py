from django.urls import reverse

from rest_framework.test import APITestCase


class HealthCheckTests(APITestCase):
	def test_health_check_returns_ok(self):
		response = self.client.get(reverse('health-check'))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['status'], 'ok')

	def test_root_returns_api_info(self):
		response = self.client.get('/')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['status'], 'running')
