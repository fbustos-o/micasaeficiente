from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.shortcuts import render
from django.views.generic import View 

from rest_framework.views import APIView
from rest_framework.response import Response
from apps.mi_casa_eficiente.models import comunas_zt,  consultasResultados, equipos, recomendaciones #agregar tablas modelos

import json

@require_GET
def resultados_completos(request, pk):
    # Now you can use pk to access the primary key, e.g.,
    try:
        resultado = consultasResultados.objects.get(pk=pk)
        # ... further processing of resultado ...
        print(resultado)
        print(pk)
        context = {
            'resultado': resultado,
            #'resultado_json': json.dumps(resultado),
            'pk': json.dumps({'pk': pk})
        }
        return render(request, 'resultado_5.html', context=context)
    except consultasResultados.DoesNotExist:
        return JsonResponse({'error': 'Resultado not found'}, status=404)