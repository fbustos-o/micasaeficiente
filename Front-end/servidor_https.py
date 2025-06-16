import http.server
import ssl
import os

# --- Configuración ---
DIRECCION_SERVIDOR = "127.0.0.1"  # Escucha en todas las interfaces disponibles
PUERTO_SERVIDOR = 4443        # Puerto para HTTPS (puedes cambiarlo si lo deseas)
DIRECTORIO_A_SERVIR = "web-front" # Nombre de la carpeta que contiene tu proyecto
ARCHIVO_CERTIFICADO = "cert.pem" # Nombre de tu archivo de certificado
ARCHIVO_CLAVE = "key.pem"       # Nombre de tu archivo de clave privada
# --- Fin de la Configuración ---

# Asegúrate de que los archivos de certificado y clave existen
if not os.path.exists(ARCHIVO_CERTIFICADO) or not os.path.exists(ARCHIVO_CLAVE):
    print(f"Error: No se encontraron los archivos de certificado ('{ARCHIVO_CERTIFICADO}') y/o clave ('{ARCHIVO_CLAVE}').")
    print("Asegúrate de haber generado estos archivos y que están en la ubicación correcta.")
    exit()

# Cambia al directorio que quieres servir
# Esto es importante para que SimpleHTTPRequestHandler sirva los archivos desde la ubicación correcta.
try:
    os.chdir(DIRECTORIO_A_SERVIR)
except FileNotFoundError:
    print(f"Error: El directorio '{DIRECTORIO_A_SERVIR}' no fue encontrado.")
    print("Asegúrate de que el script está en el directorio padre de 'web-front' o ajusta la ruta.")
    exit()

# Crea el manejador de solicitudes HTTP
# SimpleHTTPRequestHandler servirá archivos desde el directorio actual de trabajo
manejador_http = http.server.SimpleHTTPRequestHandler

# Configura el contexto SSL
contexto_ssl = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
contexto_ssl.load_cert_chain(certfile=os.path.join("..", ARCHIVO_CERTIFICADO), # Ajusta la ruta si moviste el script dentro de web-front
                             keyfile=os.path.join("..", ARCHIVO_CLAVE))     # Ajusta la ruta si moviste el script dentro de web-front

# Crea y envuelve el servidor HTTP con el contexto SSL
with http.server.HTTPServer((DIRECCION_SERVIDOR, PUERTO_SERVIDOR), manejador_http) as servidor_http:
    servidor_http.socket = contexto_ssl.wrap_socket(servidor_http.socket, server_side=True)
    print(f"Servidor HTTPS iniciado en https://{DIRECCION_SERVIDOR}:{PUERTO_SERVIDOR}")
    print(f"Sirviendo archivos desde el directorio: {os.getcwd()}")
    print("Presiona Ctrl+C para detener el servidor.")
    try:
        servidor_http.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")