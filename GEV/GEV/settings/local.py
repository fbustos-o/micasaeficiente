from .base import *
# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['micasaeficiente.exploradorenergia.cl']
'''
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'termico',  #nombre base de datos general para calculadora de demanda térmica.
        'USER': 'postgres',
        'PASSWORD': 'FB.Energia2022',
        'HOST': '127.0.0.1',
        'DATABASE_PORT': '5432',
    }
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'OPTIONS' : {
            'options': '-c search_path=mi_casa_eficiente,public'
        },
        'NAME': 'minenergia',
        'USER': 'pascual.vergara',
        'PASSWORD': 'PVM13postgres',
        'HOST': 'ernc.dgf.uchile.cl',
        'PORT': '8085',
    }
}
'''
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'GEV',
        'USER': 'postgres',
        'PASSWORD': 'FB.Energia2024',
        'HOST': '127.0.0.1',
        'DATABASE_PORT': '5432',
    }
}

#STATIC_URL = 'funcion_u/static/'
