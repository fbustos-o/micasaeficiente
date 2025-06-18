import csv
import os
from django.core.management.base import BaseCommand
from django.conf import settings

from apps.mi_casa_eficiente.models import (
    comunas_zt, CostoEnergetico, energeticosFenomeno,
    equipos, perfilConsumoTipo, recomendaciones
)

# --- Función Auxiliar para limpiar y convertir números de forma segura ---
def clean_float(value, default=None):
    """Convierte un valor a float, manejando comas y valores vacíos."""
    if not value:
        return default
    try:
        return float(value.replace(',', '.'))
    except (ValueError, TypeError):
        return default

def clean_int(value, default=None):
    """Convierte un valor a int, manejando valores vacíos."""
    if not value:
        return default
    try:
        return int(float(value)) # Usamos float primero para manejar "1.0"
    except (ValueError, TypeError):
        return default

def clean_bool(value, default=False):
    """Convierte un valor a booleano."""
    return str(value).lower() in ['true', '1', 't', 'y', 'yes']

# --- Comando Principal ---
class Command(BaseCommand):
    help = 'Carga todos los datos iniciales para la aplicación desde los archivos CSV.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("--- Iniciando la carga de datos iniciales (Versión Robusta) ---"))
        base_path = 'BBDD'

        # --- 1. Carga de comunas_zt ---
        file_path = os.path.join(base_path, '1_-_comuna_zt.csv')
        self.stdout.write(f"Cargando modelo 'comunas_zt' desde {file_path}...")
        try:
            with open(file_path, mode='r', encoding='utf-8-sig') as file:
                reader = csv.DictReader(file, delimiter=';')
                for row in reader:
                    cleaned_row = {key.strip(): value for key, value in row.items()}
                    comunas_zt.objects.get_or_create(
                        id=int(cleaned_row['id']),
                        defaults={
                            'id_regional': clean_int(cleaned_row.get('ID_regional')),
                            'id_provincia': clean_int(cleaned_row.get('ID_provincia')),
                            'id_comuna': clean_int(cleaned_row.get('ID_comuna')),
                            'region': cleaned_row.get('Región'),
                            'provincia': cleaned_row.get('Provincia'),
                            'comuna': cleaned_row.get('Comuna'),
                            'zt': cleaned_row.get('zt'), 'zt_2007': clean_int(cleaned_row.get('zt_2007')),
                            'limite_meridiano': cleaned_row.get('limite_meridiano'), 'limite_altitud': cleaned_row.get('limite_altitud'),
                            'tipo_clima': cleaned_row.get('tipo_clima'), 'clima': clean_int(cleaned_row.get('clima')),
                            'PDA': clean_bool(cleaned_row.get('PDA')),
                            'prohibicion_lena': cleaned_row.get('prohibicion_lena'), 'prohibicion_pellet': cleaned_row.get('prohibicion_pellet'),
                            'plan_PDA_actual': cleaned_row.get('plan_PDA_actual'), 'link_PDA': cleaned_row.get('link_PDA'),
                            'lat': clean_float(cleaned_row.get('lat')), 'lon': clean_float(cleaned_row.get('lon')),
                        }
                    )
            self.stdout.write(self.style.SUCCESS("-> Modelo 'comunas_zt' cargado."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error cargando 'comunas_zt': {e}"))

        # --- 2. Carga de CostoEnergetico ---
        file_path = os.path.join(base_path, '6_-_costo_energetico.csv')
        self.stdout.write(f"Cargando modelo 'CostoEnergetico' desde {file_path}...")
        try:
            with open(file_path, mode='r', encoding='utf-8-sig') as file:
                reader = csv.DictReader(file, delimiter=';')
                for row in reader:
                    cleaned_row = {key.strip(): value for key, value in row.items()}
                    CostoEnergetico.objects.get_or_create(
                        id=int(cleaned_row['id']),
                        defaults={
                            'id_regional': clean_int(cleaned_row.get('id_regional')), 'id_comuna': clean_int(cleaned_row.get('id_comuna')),
                            'region': cleaned_row.get('region'), 'comuna': cleaned_row.get('comuna'),
                            'costo_bajo_gn': clean_float(cleaned_row.get('costo_bajo_gn')), 'costo_alto_gn': clean_float(cleaned_row.get('costo_alto_gn')),
                            'costo_bajo_glp': clean_float(cleaned_row.get('costo_bajo_glp')), 'costo_alto_glp': clean_float(cleaned_row.get('costo_alto_glp')),
                            'costo_bajo_ele': clean_float(cleaned_row.get('costo_bajo_ele')), 'costo_alto_ele': clean_float(cleaned_row.get('costo_alto_ele')),
                            'costo_bajo_ker': clean_float(cleaned_row.get('costo_bajo_ker')), 'costo_alto_ker': clean_float(cleaned_row.get('costo_alto_ker')),
                            'costo_bajo_len': clean_float(cleaned_row.get('costo_bajo_len')), 'costo_alto_len': clean_float(cleaned_row.get('costo_alto_len')),
                            'costo_bajo_pel': clean_float(cleaned_row.get('costo_bajo_pel')), 'costo_alto_pel': clean_float(cleaned_row.get('costo_alto_pel')),
                        }
                    )
            self.stdout.write(self.style.SUCCESS("-> Modelo 'CostoEnergetico' cargado."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error cargando 'CostoEnergetico': {e}"))

        # --- 3. Carga de energeticosFenomeno ---
        file_path = os.path.join(base_path, '5_-_energetico_fenomeno.csv')
        self.stdout.write(f"Cargando modelo 'energeticosFenomeno' desde {file_path}...")
        try:
            with open(file_path, mode='r', encoding='utf-8-sig') as file:
                reader = csv.DictReader(file, delimiter=';')
                for row in reader:
                    cleaned_row = {key.strip(): value for key, value in row.items()}
                    energeticosFenomeno.objects.get_or_create(
                        id=int(cleaned_row['id']),
                        defaults={
                            'energetico_id': clean_int(cleaned_row.get('energetico_id')), 'energetico_fenomeno': cleaned_row.get('energetico_fenomeno'),
                            'unidad': cleaned_row.get('unidad'), 'poder_calorifico': clean_float(cleaned_row.get('poder_calorifico')),
                            'eficiencia_base': clean_float(cleaned_row.get('eficiencia_base')),
                            'mp25': clean_float(cleaned_row.get('mp25')), 'nox': clean_float(cleaned_row.get('nox')),
                            'so2': clean_float(cleaned_row.get('so2')), 'co': clean_float(cleaned_row.get('co')),
                            'co2_eq': clean_float(cleaned_row.get('co2_eq')),
                        }
                    )
            self.stdout.write(self.style.SUCCESS("-> Modelo 'energeticosFenomeno' cargado."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error cargando 'energeticosFenomeno': {e}"))

        # --- 4. Carga de equipos ---
        file_path = os.path.join(base_path, '3_-_equipos.csv')
        self.stdout.write(f"Cargando modelo 'equipos' desde {file_path}...")
        try:
            with open(file_path, mode='r', encoding='utf-8-sig') as file:
                reader = csv.DictReader(file, delimiter=';')
                for row in reader:
                    cleaned_row = {key.strip(): value for key, value in row.items()}
                    equipos.objects.get_or_create(
                        id=int(cleaned_row['id']),
                        defaults={
                            'nombre_equipo': cleaned_row.get('nombre_equipo'), 'grupo_uso_corto': cleaned_row.get('grupo_uso_corto'),
                            'espacio_exterior': clean_bool(cleaned_row.get('espacio_exterior')),
                            'espacio_cocina': clean_bool(cleaned_row.get('espacio_cocina')),
                            'espacio_bahno': clean_bool(cleaned_row.get('espacio_bahno')),
                            'espacio_dormitorio': clean_bool(cleaned_row.get('espacio_dormitorio')),
                            'espacio_living': clean_bool(cleaned_row.get('espacio_living')),
                            'subtitulo': cleaned_row.get('subtitulo'), 'descripcion': cleaned_row.get('descripcion'),
                            'etiqueta': clean_bool(cleaned_row.get('etiqueta')),
                            'energia_base_id': clean_int(cleaned_row.get('energia_base_id')), 'grupo_uso_id': clean_int(cleaned_row.get('grupo_uso_id')),
                            'cantidad_promedio': clean_int(cleaned_row.get('cantidad_promedio')), 'horas_uso_tipo': clean_float(cleaned_row.get('horas_uso_tipo')),
                            'potencia_equipo': clean_float(cleaned_row.get('potencia_equipo')),
                            'eficiencia_equipo': clean_float(cleaned_row.get('eficiencia_equipo')),
                            'promedio_energia_anual': clean_float(cleaned_row.get('promedio_energia_anual')),
                            'fuente': cleaned_row.get('fuente'),
                        }
                    )
            self.stdout.write(self.style.SUCCESS("-> Modelo 'equipos' cargado."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error cargando 'equipos': {e}"))
        
        # --- 5. Carga de perfilConsumoTipo ---
        file_path = os.path.join(base_path, '2_-_perfilConsumoTipo.csv')
        self.stdout.write(f"Cargando modelo 'perfilConsumoTipo' desde {file_path}...")
        try:
            with open(file_path, mode='r', encoding='utf-8-sig') as file:
                reader = csv.DictReader(file, delimiter=';')
                for row in reader:
                    cleaned_row = {key.strip(): value for key, value in row.items()}
                    perfilConsumoTipo.objects.get_or_create(
                        id=int(cleaned_row['id']),
                        defaults={
                            'grupo_se_id': clean_int(cleaned_row.get('grupo_se_id')), 'zt_2007': clean_int(cleaned_row.get('zt_2007')),
                            'mes': clean_int(cleaned_row.get('mes')), 'dia': clean_int(cleaned_row.get('dia')), 'hora': clean_int(cleaned_row.get('hora')),
                            'consumo_elec': clean_float(cleaned_row.get('consumo_elec')),
                            'consumo_gn': clean_float(cleaned_row.get('consumo_gn')),
                            'consumo_glp': clean_float(cleaned_row.get('consumo_glp')),
                            'consumo_ker': clean_float(cleaned_row.get('consumo_ker')),
                            'consumo_len': clean_float(cleaned_row.get('consumo_len')),
                            'consumo_pel': clean_float(cleaned_row.get('consumo_pel')),
                        }
                    )
            self.stdout.write(self.style.SUCCESS("-> Modelo 'perfilConsumoTipo' cargado."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error cargando 'perfilConsumoTipo': {e}"))

        # --- 6. Carga de recomendaciones ---
        file_path = os.path.join(base_path, '4_-_recomendaciones.csv')
        self.stdout.write(f"Cargando modelo 'recomendaciones' desde {file_path}...")
        try:
            with open(file_path, mode='r', encoding='utf-8-sig') as file:
                reader = csv.DictReader(file, delimiter=';')
                for row in reader:
                    cleaned_row = {key.strip(): value for key, value in row.items()}
                    recomendaciones.objects.get_or_create(
                        id=int(cleaned_row['id']),
                        defaults={
                            'grupo_uso_id': clean_int(cleaned_row.get('grupo_uso_id')), 'grupo_uso': cleaned_row.get('grupo_uso'),
                            'grupo_uso_corto': cleaned_row.get('grupo_uso_corto'), 'imagen_tarjeta': cleaned_row.get('imagen_tarjeta'),
                            'recomendacion': cleaned_row.get('recomendacion'), 'inversion_id': clean_int(cleaned_row.get('inversion_id')),
                            'inversion': cleaned_row.get('inversion'), 'ahorro_ee_id': clean_int(cleaned_row.get('ahorro_ee_id')),
                            'ahorro_ee': cleaned_row.get('ahorro_ee'),
                        }
                    )
            self.stdout.write(self.style.SUCCESS("-> Modelo 'recomendaciones' cargado."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error cargando 'recomendaciones': {e}"))

        self.stdout.write(self.style.SUCCESS("--- Proceso de carga de datos finalizado ---"))