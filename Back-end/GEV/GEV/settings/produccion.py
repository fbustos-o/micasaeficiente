import os
from dotenv import load_dotenv
from .base import *

# Carga las variables de entorno del archivo .env
# Busca el .env en el directorio actual o en directorios padres.
# Para mayor control, puedes especificar la ruta: load_dotenv(find_dotenv())
# o load_dotenv(os.path.join(BASE_DIR, '.env')) si BASE_DIR está definido en base.py
# y apunta a la raíz del proyecto.
load_dotenv()
 
# SECURITY WARNING: don't run with debug turned on in production!
# Es buena práctica obtener DEBUG también de una variable de entorno
# DEBUG = os.getenv('DEBUG', 'True') == 'True'
DEBUG = True

ALLOWED_HOSTS = []

DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.postgresql_psycopg2'),
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', '127.0.0.1'),
        'PORT': os.getenv('DB_PORT', '5432'), # Corregido DATABASE_PORT a PORT
    }
}
