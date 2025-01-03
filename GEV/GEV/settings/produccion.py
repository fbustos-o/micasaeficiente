from .base import *
# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'MCE',
        'USER': 'postgres',
        'PASSWORD': '',
        'HOST': '127.0.0.1',
        'DATABASE_PORT': '5432',
    }
}
#STATIC_URL = 'funcion_u/static/'
