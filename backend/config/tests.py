from django.test import Client, TestCase, override_settings


@override_settings(ROOT_URLCONF="config.test_urls")
class ApiErrorHandlersTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.client.raise_request_exception = False

    def test_api_404_returns_json(self):
        response = self.client.get("/api/does-not-exist/")

        self.assertEqual(response.status_code, 404)
        self.assertTrue(response.headers.get("Content-Type", "").startswith("application/json"))
        self.assertEqual(response.json().get("detail"), "Endpoint not found.")

    def test_api_500_returns_json(self):
        response = self.client.get("/api/test-error/")

        self.assertEqual(response.status_code, 500)
        self.assertTrue(response.headers.get("Content-Type", "").startswith("application/json"))
        self.assertIn("detail", response.json())
