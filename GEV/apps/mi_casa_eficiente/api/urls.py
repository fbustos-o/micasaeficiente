from django.urls import path
from .api import consulta_comunas, datos_demanda, edita_consumo, datos_equipos, edita_equipos, recomendaciones_el, recomendaciones_priorizadas, lista_equipos, lista_recomendaciones

urlpatterns = [
    path('comunas/', consulta_comunas, name = 'Consulta Comunas'), #Paso 1: lista de comunas disponibles y POST de elección de comuna y consumos de energía que posee la vivienda.
    path('demanda/<int:pk>', datos_demanda, name = 'Datos Demanda'), #Paso 2: consulta si conoces tu consumo y deseas editarlo
    path('edita_consumo/<int:pk>', edita_consumo, name = 'Edita Consumo'),#Paso 2_1: edita consumos mensuales
    path('equipos/<int:pk>', datos_equipos, name = 'Equipos' ),#Paso 3: equipos disponibles en el hogar, consulta si desea editarlos, de base es no.
    path('edita_equipos/<int:pk>', edita_equipos, name = 'Edita Equipos'), #Paso 3_1: edita equipos a gusto (realiza balance para mantener la demanda de energía)
    path('recomendaciones/<int:pk>', recomendaciones_el, name = 'Recomendaciones'), #Paso 4: recomendaciones y selección de prioridades
    path('recomendaciones_select/<int:pk>', recomendaciones_priorizadas, name = 'Recomendaciones Seleccionadas'), # Paso final: lista de consulta GET en función del paso 4, resultados de consumos con selección de recomendaciones tomada. 
    path('lista_equipos/', lista_equipos, name = 'Lista Equipos'), #lista de equipos
    path('lista_recomendaciones/', lista_recomendaciones, name = 'Lista Recomendaciones'), #lista de recomendaciones
]
