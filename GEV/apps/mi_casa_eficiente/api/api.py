from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view

from apps.mi_casa_eficiente.models import comunas_zt,  consultasResultados #agregar tablas modelos
from apps.mi_casa_eficiente.api.serializers import  ComunasSerializer, resultadosSerializer, MCESerializer #agregar los serializadores

## 1 - consulta comunas e ingresa datos de ubicación para consulta y pregunta que energéticos usa. 
@api_view(['GET', 'POST'])
def consulta_comunas(request):
    #GET: Lista de comunas ingresadas
    if request.method == 'GET':
        try:
            # Obtener todas las regiones únicas
            regiones = comunas_zt.objects.order_by('id').values("region").distinct()
            #diccionario base
            comunas_por_region = {}
            # Iterar sobre las regiones
            for region in regiones:
                nombre_region = region['region']
                # Obtener las comunas únicas para la región actual
                comunas = comunas_zt.objects.filter(region=nombre_region).values_list('comuna', 'id_comuna').distinct()
                # Agregar la región y sus comunas al diccionario
                comunas_por_region[nombre_region] = {
                    'comunas': list(comunas)
                }
            response = comunas_por_region
            status_code = status.HTTP_200_OK
        except Exception as e:
            response = str(e)
            status_code = status.HTTP_400_BAD_REQUEST
        return Response(response,status_code)
    #POST: ingresa el dato de la comuna, tipo clima
    if request.method == 'POST':
        consulta_mce_serializer = MCESerializer(data = request.data)
        if consulta_mce_serializer.is_valid():    
            consulta_mce_serializer.save()
            respuesta= consulta_mce_serializer.paso_1(consulta_mce_serializer.data) # FIX DE LA FUNCION
            return Response(respuesta, status = status.HTTP_201_CREATED)
        return Response(consulta_mce_serializer.errors, status = status.HTTP_400_BAD_REQUEST)

## 2 - conoces tu consumo?
@api_view(['GET','PUT'])
def datos_demanda(request, pk=None):
    consulta_resumen = consultasResultados.objects.filter(id = pk).first()
    #GET: Resumen de su resultado hasta el momento
    if request.method == 'GET':
        serializer = MCESerializer(consulta_resumen)
        return Response(serializer.data, status = status.HTTP_200_OK)
    #PUT: Ingresa boleano de edición de demanda
    if request.method == 'PUT':
        consulta_mce_serializer = MCESerializer(consulta_resumen, data = request.data)
        if consulta_mce_serializer.is_valid():    
            consulta_mce_serializer.save()
            respuesta= consulta_mce_serializer.paso_2(consulta_mce_serializer.data) # FIX DE LA FUNCION
            return Response(respuesta, status = status.HTTP_201_CREATED)
        return Response(consulta_mce_serializer.errors, status = status.HTTP_400_BAD_REQUEST)

## 2_1 - edita tus consumos de energía (mensual)
@api_view(['GET','PUT'])
def edita_consumo(request, pk=None):
    #GET: muestra los perfiles de consumo (mensualizados?, por energético)
    consulta_demanda_base = consultasResultados.objects.filter(id = pk).first()
    if request.method == 'GET':
        serializer = MCESerializer(consulta_demanda_base)
        return Response(serializer.data, status = status.HTTP_200_OK)
    #PUT: Ingresa boleano de edición de demanda
    if request.method == 'PUT':
        consulta_mce_serializer = MCESerializer(consulta_demanda_base, data = request.data)
        if consulta_mce_serializer.is_valid():    
            consulta_mce_serializer.save()
            respuesta= consulta_mce_serializer.paso_2_1(consulta_mce_serializer.data) # FIX DE LA FUNCION
            return Response(respuesta, status = status.HTTP_201_CREATED)
        return Response(consulta_mce_serializer.errors, status = status.HTTP_400_BAD_REQUEST)


## 3 - editas los equipos de tu casa?
@api_view(['GET', 'PUT'])
def datos_equipos(request, pk=None):
    #GET: resumen de consumos y vivienda, propuesta equipos base
    consulta_equipos = consultasResultados.objects.filter(id = pk).first()
    if request.method == 'GET':
        serializer = MCESerializer(consulta_equipos)
        return Response(serializer.data, status = status.HTTP_200_OK)
    #PUT: Ingresa boleano de edición de demanda
    if request.method == 'PUT':
        consulta_mce_serializer = MCESerializer(consulta_equipos, data = request.data)
        if consulta_mce_serializer.is_valid():    
            consulta_mce_serializer.save()
            respuesta= consulta_mce_serializer.paso_3(consulta_mce_serializer.data) # FIX DE LA FUNCION
            return Response(respuesta, status = status.HTTP_201_CREATED)
        return Response(consulta_mce_serializer.errors, status = status.HTTP_400_BAD_REQUEST)

## 3_1 - edita los equipos 
@api_view(['GET', 'PUT'])
def edita_equipos(request, pk=None):
    #GET: resumen de equipos base
    consulta_equipos = consultasResultados.objects.filter(id = pk).first()
    if request.method == 'GET':
        serializer = MCESerializer(consulta_equipos)
        return Response(serializer.data, status = status.HTTP_200_OK)
    #PUT: Ingresa boleano de edición de demanda
    if request.method == 'PUT':
        consulta_mce_serializer = MCESerializer(consulta_equipos, data = request.data)
        if consulta_mce_serializer.is_valid():    
            consulta_mce_serializer.save()
            respuesta= consulta_mce_serializer.paso_3_1(consulta_mce_serializer.data) 
            return Response(respuesta, status = status.HTTP_201_CREATED)
        return Response(consulta_mce_serializer.errors, status = status.HTTP_400_BAD_REQUEST)

## 4 - Recomendaciones y elección
@api_view(['GET', 'PUT'])
def recomendaciones(request, pk=None):
    #GET: Lista de recomendaciones
    resumen_resultados = consultasResultados.objects.filter(id = pk).first() 
    if request.method == 'GET':
        serializer = resultadosSerializer(resumen_resultados)
        #función que arroja los tipos de recomendaciones posibles ordenadas
        respuesta = serializer.paso_4_get(serializer.data)
        return Response(respuesta, status = status.HTTP_200_OK)
    #PUT: Ingresa lista de elecciones
    if request.method == 'PUT':
        consulta_mce_serializer = resultadosSerializer(resumen_resultados, data = request.data)
        if consulta_mce_serializer.is_valid():    
            consulta_mce_serializer.save()
            respuesta= consulta_mce_serializer.paso_4_put(consulta_mce_serializer.data) 
            return Response(respuesta, status = status.HTTP_201_CREATED)
        return Response(consulta_mce_serializer.errors, status = status.HTTP_400_BAD_REQUEST)

## 5 - lista de recomendaciones en función de la demanda solo GET resumen de resultados de recomendaciones para mejorar en EE. 
@api_view(['GET'])
def recomendaciones_priorizadas(request, pk=None):
    #GET: resumen de equipos base
    recomendacion_priorizada = consultasResultados.objects.filter(id = pk).first()
    if request.method == 'GET':
        serializer = resultadosSerializer(recomendacion_priorizada)
        #función que arroja los tipos de recomendaciones posibles ordenadas
        respuesta = serializer.paso_5_get(serializer.data)
        return Response(respuesta, status = status.HTTP_200_OK)