from django.test import TestCase


class FraisAcademiqueConfigTest(TestCase):
    def test_app_loaded(self):
        from django.apps import apps
        self.assertTrue(apps.is_installed('apps.frais_academique'))
