import pytest
from rest_framework.test import APIClient

client = APIClient()

def test_pytest_working():
    assert True == True
