from rest_framework import serializers
from apps.mi_casa_eficiente.models import  comunas_zt, perfilConsumoTipo, equipos, recomendaciones, consultasResultados #carga bbdd de modelos
from apps.f_aux.geo_data import getGeoData, llamado
#librerias adicionales
import pandas as pd
import numpy as np

#para lista de recomendaciones
class RecomendacionesSerializer(serializers.ModelSerializer):
    class Meta:
        model = recomendaciones
        fields = '__all__'

#para lista de equipos
class EquiposSerializer(serializers.ModelSerializer):
    class Meta:
        model = equipos
        fields = '__all__'

# serializardor de comunas
class ComunasSerializer(serializers.ModelSerializer):
    #GET
    class Meta:
        model = comunas_zt
        fields = '__all__'

# serializador de consulta MCE crea un id nuevo de consulta.
class MCESerializer(serializers.ModelSerializer):
    # Campos adicionales para recibir los datos auxiliares
    usa_elec = serializers.BooleanField(required=False)
    usa_gn = serializers.BooleanField(required=False)
    usa_glp = serializers.BooleanField(required=False)
    usa_ker = serializers.BooleanField(required=False)
    usa_len = serializers.BooleanField(required=False)
    usa_pel = serializers.BooleanField(required=False)
    # campos para paso 2_1
    con_elec = serializers.ListField(required=False)
    con_gn = serializers.ListField(required=False)
    con_glp = serializers.ListField(required=False)
    con_ker = serializers.ListField(required=False)
    con_len = serializers.ListField(required=False)
    con_pel = serializers.ListField(required=False)

    class Meta:
        model = consultasResultados
        fields = '__all__'
    # funcion de agregación de datos fuera de las bbdd, se utiliza como auxiliar. 
    def create(self, validated_data):
        usa_elec = validated_data.pop('usa_elec', None)  
        usa_gn = validated_data.pop('usa_gn', None)
        usa_glp = validated_data.pop('usa_glp', None)
        usa_ker = validated_data.pop('usa_ker', None)
        usa_len = validated_data.pop('usa_len', None)
        usa_pel = validated_data.pop('usa_pel', None)

        con_elec = validated_data.pop('con_elec', None)
        con_gn = validated_data.pop('con_gn', None)
        con_glp = validated_data.pop('con_glp', None)
        con_ker = validated_data.pop('con_ker', None)
        con_len = validated_data.pop('con_len', None)
        con_pel = validated_data.pop('con_pel', None)
        # Crea la instancia del modelo con los datos restantes
        instance = consultasResultados.objects.create(**validated_data)
        return instance

    def paso_1(self, instance):
        # Accede a los datos adicionales a través de la instancia del serializador
        usa_elec = self.validated_data.get('usa_elec')
        usa_gn = self.validated_data.get('usa_gn')
        usa_glp = self.validated_data.get('usa_glp')
        usa_ker = self.validated_data.get('usa_ker')
        usa_len = self.validated_data.get('usa_len')
        usa_pel = self.validated_data.get('usa_pel')
        
        # Agrega datos de provincia, comuna, región y zt
        cod_region = comunas_zt.objects.filter(id_comuna=instance['id_comuna'], clima=instance['clima']).values()[0]['id_regional']
        cod_provincia = comunas_zt.objects.filter(id_comuna=instance['id_comuna'], clima=instance['clima']).values()[0]['id_provincia']
        zt = comunas_zt.objects.filter(id_comuna=instance['id_comuna'], clima=instance['clima']).values_list('zt',flat=True)[0]
        zt_2007 = comunas_zt.objects.filter(id_comuna=instance['id_comuna'], clima=instance['clima']).values_list('zt_2007',flat=True)[0]

        # superficies y dormitorios.
        if instance['conoce_superficie']:
            sup = instance['superficie']
            if sup>15:
                sup_dor = sup*0.45 #valor fijo de proporción
                dor_principal = 15 #superficie dormitorio pricipal                
                n_dor = round((sup_dor - dor_principal)/9)+1
            else: 
                n_dor=1
        else:
            n_dor = instance['dormitorios']
            dor_principal = 15 #superficie dormitorio pricipal
            dor_sec = 9 #superficie dormitorio sec
            sup_dor = dor_principal + dor_sec*(n_dor-1) #superficie total de dormitorios
            sup = round(sup_dor/0.45) #

        #agrega demandas base
        if usa_elec:
            consumo_elec =  list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_elec',flat=True))
        else:
            consumo_elec = []

        if usa_gn: 
            consumo_gn = list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_gn',flat=True))
        else: 
            consumo_gn = []

        if usa_glp:
            consumo_glp = list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_glp',flat=True))
        else:
            consumo_glp = []
        
        if usa_ker:
            consumo_ker = list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_ker',flat=True))
        else:
            consumo_ker = []

        if usa_len:
            consumo_len = list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_len',flat=True))
        else: 
            consumo_len = []

        if usa_pel:
            consumo_pel = list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_pel',flat=True))
        else:
            consumo_pel = []

        #construye diccionario de resultados para el siguiente paso
        resultado = {
            'id' : instance['id'],
            'id_region' : cod_region,
            'id_provincia' : cod_provincia,
            'id_comuna' :  instance['id_comuna'],
            'zt' : zt,
            'superficie' : sup,
            'dormitorios' : n_dor,
            'consumo_elec' : sum(consumo_elec),
            'consumo_gn' : sum(consumo_gn),
            'consumo_glp' : sum(consumo_glp),
            'consumo_ker' : sum(consumo_ker),
            'consumo_len' : sum(consumo_len),
            'consumo_pel' : sum(consumo_pel),
        }

        #Save en resultados en la bbdd:
        r = consultasResultados(
            id = instance['id'],
            id_comuna = instance['id_comuna'],
            id_provincia = cod_provincia,
            id_regional = cod_region,
            clima = instance['clima'],
            zt = zt,
            tipo_vivienda = instance['tipo_vivienda'],
            n_pisos = instance['n_pisos'],
            ultimo_piso = instance['ultimo_piso'],
            conoce_superficie = instance['conoce_superficie'],
            superficie = sup,
            dormitorios = n_dor,
            anio_construccion = instance['anio_construccion'],
            consumo_elec = consumo_elec,
            consumo_gn = consumo_gn,
            consumo_glp = consumo_glp,
            consumo_ker = consumo_ker,
            consumo_len = consumo_len,
            consumo_pel = consumo_pel,
        )
        r.save()

        return resultado
    
    def paso_2(self, instance):
        #energía anual del perfil general
        energia_perfil = {
            'elec': sum(instance['consumo_elec']),
            'gn': sum(instance['consumo_gn']),
            'glp': sum(instance['consumo_glp']),
            'ker': sum(instance['consumo_ker']),
            'len': sum(instance['consumo_len']),
            'pel': sum(instance['consumo_pel'])
        }
        # Diccionario de energéticos id: 
        energeticos_ids = {
            'elec': 6,
            'gn': 2,
            'glp': 1,
            'ker': 3,
            'len': 5,
            'pel': 4
        }
        # Crear la lista de energéticos disponibles (consumo mayor a cero)
        lista_energeticos = [energeticos_ids[energetico] for energetico, consumo in energia_perfil.items() if consumo > 0]

        #perfil de consumos energéticos base          
        energia_equipos = {
            'elec': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=6).values_list('promedio_energia_anual', flat=True))),
            'gn': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=2).values_list('promedio_energia_anual', flat=True))),
            'glp': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=1).values_list('promedio_energia_anual', flat=True))),
            'ker': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=3).values_list('promedio_energia_anual', flat=True))),
            'len': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=5).values_list('promedio_energia_anual', flat=True))),
            'pel': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=4).values_list('promedio_energia_anual', flat=True)))
        }
        #Equipos filtrados por tipo energético disponible
        equipos_dict = {}
        for equipo in equipos.objects.filter(horas_uso_tipo__gt=0, energia_base_id__in = lista_energeticos).values():
            equipos_dict[equipo['id']] = equipo 
        #edición de perfiles de consumos en el diccionario (balance)
        # Balancear el consumo de energía por tipo
        for energetico, consumo_perfil in energia_perfil.items():
            consumo_equipos = energia_equipos[energetico]

            # Solo balancear si hay consumo en el perfil y en los equipos
            if consumo_perfil > 0 and consumo_equipos > 0:
                # Obtener los IDs de los equipos que usan este energético
                equipos_ids = [
                    equipo_id
                    for equipo_id, equipo_data in equipos_dict.items()
                    if equipo_data['energia_base_id'] == energeticos_ids[energetico]
                ]

                # Calcular la proporción de consumo para cada equipo
                total_consumo_equipos = sum(
                    equipos_dict[equipo_id]['promedio_energia_anual'] for equipo_id in equipos_ids
                )
                proporciones = {
                    equipo_id: equipos_dict[equipo_id]['promedio_energia_anual'] / total_consumo_equipos
                    for equipo_id in equipos_ids
                }

                # Ajustar el consumo de cada equipo y actualizar los diccionarios
                for equipo_id in equipos_ids:
                    nuevo_consumo = consumo_perfil * proporciones[equipo_id]
                    equipos_dict[equipo_id]['promedio_energia_anual'] = nuevo_consumo
                    energia_equipos[energetico] -= equipos_dict[equipo_id]['promedio_energia_anual']
                    energia_equipos[energetico] += nuevo_consumo

        resultado = False
        if instance['conoce_consumos']:
            resultado = True
        r = consultasResultados(
            id = instance['id'],
            id_comuna = instance['id_comuna'],
            id_provincia = instance['id_provincia'],
            id_regional = instance['id_regional'],
            clima = instance['clima'],
            zt = instance['zt'],
            tipo_vivienda = instance['tipo_vivienda'],
            n_pisos = instance['n_pisos'],
            ultimo_piso = instance['ultimo_piso'],
            conoce_superficie = instance['conoce_superficie'],
            superficie = instance['superficie'],
            dormitorios = instance['dormitorios'],
            anio_construccion = instance['anio_construccion'],
            conoce_consumos = instance['conoce_consumos'],
            consumo_elec = instance['consumo_elec'],
            consumo_gn = instance['consumo_gn'],
            consumo_glp = instance['consumo_glp'],
            consumo_ker = instance['consumo_ker'],
            consumo_len = instance['consumo_len'],
            consumo_pel = instance['consumo_pel'],
            equipos_seleccionados = equipos_dict
        )
        r.save()
        return (resultado)
    
    def paso_2_1(self, instance):
        # Accede a los datos adicionales a través de la instancia del serializador
        usa_elec = self.validated_data.get('usa_elec')
        usa_gn = self.validated_data.get('usa_gn')
        usa_glp = self.validated_data.get('usa_glp')
        usa_ker = self.validated_data.get('usa_ker')
        usa_len = self.validated_data.get('usa_len')
        usa_pel = self.validated_data.get('usa_pel')
        
        con_elec = self.validated_data.get('con_elec')
        con_gn = self.validated_data.get('con_gn')
        con_glp = self.validated_data.get('con_glp')
        con_ker = self.validated_data.get('con_ker')
        con_len = self.validated_data.get('con_len')
        con_pel = self.validated_data.get('con_pel')

        zt_2007 = comunas_zt.objects.filter(id_comuna=instance['id_comuna'], clima=instance['clima']).values_list('zt_2007',flat=True)[0]
        #Edita las demandas base, siempre que elija cual editar (permite entrar denuevo a cualquier demanda)
        if usa_elec:
            suma_consumo_elc = sum(con_elec) / 8760
            consumo_elec =  [suma_consumo_elc]*8760
        else:
            consumo_elec = []

        if usa_gn: 
            suma_consumo_gn = sum(con_gn) / 8760
            consumo_gn = [suma_consumo_gn]*8760
        else: 
            consumo_gn = []

        if usa_glp:
            suma_consumo_glp = sum(con_glp) / 8760
            consumo_glp = [suma_consumo_glp]*8760
        else:
            consumo_glp = []
        
        if usa_ker:
            suma_consumo_ker = sum(con_ker) / 8760
            consumo_ker = [suma_consumo_ker]*8760
        else:
            consumo_ker = []

        if usa_len:
            suma_consumo_len = sum(con_len) / 8760
            consumo_len = [suma_consumo_len]*8760
        else: 
            consumo_len = []

        if usa_pel:
            suma_consumo_pel = sum(con_pel) / 8760
            consumo_pel = [suma_consumo_pel]*8760
        else:
            consumo_pel = []
        
        #energía anual del perfil general
        energia_perfil = {
            'elec': sum(consumo_elec),
            'gn': sum(consumo_gn),
            'glp': sum(consumo_glp),
            'ker': sum(consumo_ker),
            'len': sum(consumo_len),
            'pel': sum(consumo_pel)
        }

        # Diccionario de energéticos id: 
        energeticos_ids = {
            'elec': 6,
            'gn': 2,
            'glp': 1,
            'ker': 3,
            'len': 5,
            'pel': 4
        }
        # Crear la lista de energéticos disponibles (consumo mayor a cero)
        lista_energeticos = [energeticos_ids[energetico] for energetico, consumo in energia_perfil.items() if consumo > 0]

        #perfil de consumos energéticos base          
        energia_equipos = {
            'elec': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=6).values_list('promedio_energia_anual', flat=True))),
            'gn': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=2).values_list('promedio_energia_anual', flat=True))),
            'glp': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=1).values_list('promedio_energia_anual', flat=True))),
            'ker': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=3).values_list('promedio_energia_anual', flat=True))),
            'len': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=5).values_list('promedio_energia_anual', flat=True))),
            'pel': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=4).values_list('promedio_energia_anual', flat=True)))
        }
        #Equipos filtrados por tipo energético disponible
        equipos_dict = {}
        for equipo in equipos.objects.filter(horas_uso_tipo__gt=0, energia_base_id__in = lista_energeticos).values():
            equipos_dict[equipo['id']] = equipo 
        #edición de perfiles de consumos en el diccionario (balance)
        # Balancear el consumo de energía por tipo
        for energetico, consumo_perfil in energia_perfil.items():
            consumo_equipos = energia_equipos[energetico]

            # Solo balancear si hay consumo en el perfil y en los equipos
            if consumo_perfil > 0 and consumo_equipos > 0:
                # Obtener los IDs de los equipos que usan este energético
                equipos_ids = [
                    equipo_id
                    for equipo_id, equipo_data in equipos_dict.items()
                    if equipo_data['energia_base_id'] == energeticos_ids[energetico]
                ]

                # Calcular la proporción de consumo para cada equipo
                total_consumo_equipos = sum(
                    equipos_dict[equipo_id]['promedio_energia_anual'] for equipo_id in equipos_ids
                )
                proporciones = {
                    equipo_id: equipos_dict[equipo_id]['promedio_energia_anual'] / total_consumo_equipos
                    for equipo_id in equipos_ids
                }

                # Ajustar el consumo de cada equipo y actualizar los diccionarios
                for equipo_id in equipos_ids:
                    nuevo_consumo = consumo_perfil * proporciones[equipo_id]
                    equipos_dict[equipo_id]['promedio_energia_anual'] = nuevo_consumo
                    energia_equipos[energetico] -= equipos_dict[equipo_id]['promedio_energia_anual']
                    energia_equipos[energetico] += nuevo_consumo



        resultado = {
            'id' : instance['id'],
            'id_comuna' : instance['id_comuna'],
            'id_provincia' : instance['id_provincia'],
            'id_regional' : instance['id_regional'],
            'clima' : instance['clima'],
            'zt' : instance['zt'],
            'tipo_vivienda' : instance['tipo_vivienda'],
            'n_pisos' : instance['n_pisos'],
            'ultimo_piso' : instance['ultimo_piso'],
            'conoce_superficie' : instance['conoce_superficie'],
            'superficie' : instance['superficie'],
            'dormitorios' : instance['dormitorios'],
            'anio_construccion' : instance['anio_construccion'],
            'conoce_consumos' : instance['conoce_consumos'],
            'consumo_elec' : consumo_elec,
            'consumo_gn' : consumo_gn,
            'consumo_glp' : consumo_glp,
            'consumo_ker' : consumo_ker,
            'consumo_len' : consumo_len,
            'consumo_pel' : consumo_pel,
            'equipos_seleccionados': equipos_dict
        }
        r = consultasResultados(
            id = instance['id'],
            id_comuna = instance['id_comuna'],
            id_provincia = instance['id_provincia'],
            id_regional = instance['id_regional'],
            clima = instance['clima'],
            zt = instance['zt'],
            tipo_vivienda = instance['tipo_vivienda'],
            n_pisos = instance['n_pisos'],
            ultimo_piso = instance['ultimo_piso'],
            conoce_superficie = instance['conoce_superficie'],
            superficie = instance['superficie'],
            dormitorios = instance['dormitorios'],
            anio_construccion = instance['anio_construccion'],
            conoce_consumos = instance['conoce_consumos'],
            consumo_elec = consumo_elec,
            consumo_gn = consumo_gn,
            consumo_glp = consumo_glp,
            consumo_ker = consumo_ker,
            consumo_len = consumo_len,
            consumo_pel = consumo_pel,
            equipos_seleccionados = equipos_dict
        )
        r.save()
        return (resultado)
    
    def paso_3(self, instance):
        #energía anual del perfil general
        energia_perfil = {
            'elec': sum(instance['consumo_elec']),
            'gn': sum(instance['consumo_gn']),
            'glp': sum(instance['consumo_glp']),
            'ker': sum(instance['consumo_ker']),
            'len': sum(instance['consumo_len']),
            'pel': sum(instance['consumo_pel'])
        }
        
        # Diccionario de energéticos id: 
        energeticos_ids = {
            'elec': 6,
            'gn': 2,
            'glp': 1,
            'ker': 3,
            'len': 5,
            'pel': 4
        }
        # Crear la lista de energéticos disponibles (consumo mayor a cero)
        lista_energeticos = [energeticos_ids[energetico] for energetico, consumo in energia_perfil.items() if consumo > 0]

        #perfil de consumos energéticos base          
        energia_equipos = {
            'elec': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=6).values_list('promedio_energia_anual', flat=True))),
            'gn': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=2).values_list('promedio_energia_anual', flat=True))),
            'glp': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=1).values_list('promedio_energia_anual', flat=True))),
            'ker': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=3).values_list('promedio_energia_anual', flat=True))),
            'len': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=5).values_list('promedio_energia_anual', flat=True))),
            'pel': sum(list(equipos.objects.filter(horas_uso_tipo__gt=0,energia_base_id=4).values_list('promedio_energia_anual', flat=True)))
        }
        #Equipos filtrados por tipo energético disponible
        equipos_dict = {}
        for equipo in equipos.objects.filter(horas_uso_tipo__gt=0, energia_base_id__in = lista_energeticos).values():
            equipos_dict[equipo['id']] = equipo 
        #edición de perfiles de consumos en el diccionario (balance)
        # Balancear el consumo de energía por tipo
        for energetico, consumo_perfil in energia_perfil.items():
            consumo_equipos = energia_equipos[energetico]

            # Solo balancear si hay consumo en el perfil y en los equipos
            if consumo_perfil > 0 and consumo_equipos > 0:
                # Obtener los IDs de los equipos que usan este energético
                equipos_ids = [
                    equipo_id
                    for equipo_id, equipo_data in equipos_dict.items()
                    if equipo_data['energia_base_id'] == energeticos_ids[energetico]
                ]

                # Calcular la proporción de consumo para cada equipo
                total_consumo_equipos = sum(
                    equipos_dict[equipo_id]['promedio_energia_anual'] for equipo_id in equipos_ids
                )
                proporciones = {
                    equipo_id: equipos_dict[equipo_id]['promedio_energia_anual'] / total_consumo_equipos
                    for equipo_id in equipos_ids
                }

                # Ajustar el consumo de cada equipo y actualizar los diccionarios
                for equipo_id in equipos_ids:
                    nuevo_consumo = consumo_perfil * proporciones[equipo_id]
                    equipos_dict[equipo_id]['promedio_energia_anual'] = nuevo_consumo
                    energia_equipos[energetico] -= equipos_dict[equipo_id]['promedio_energia_anual']
                    energia_equipos[energetico] += nuevo_consumo

        resultado = False
        if instance['edita_equipos']:
            resultado = True
        r = consultasResultados(
            id = instance['id'],
            id_comuna = instance['id_comuna'],
            id_provincia = instance['id_provincia'],
            id_regional = instance['id_regional'],
            clima = instance['clima'],
            zt = instance['zt'],
            tipo_vivienda = instance['tipo_vivienda'],
            n_pisos = instance['n_pisos'],
            ultimo_piso = instance['ultimo_piso'],
            conoce_superficie = instance['conoce_superficie'],
            superficie = instance['superficie'],
            dormitorios = instance['dormitorios'],
            anio_construccion = instance['anio_construccion'],
            conoce_consumos = instance['conoce_consumos'],
            consumo_elec = instance['consumo_elec'],
            consumo_gn = instance['consumo_gn'],
            consumo_glp = instance['consumo_glp'],
            consumo_ker = instance['consumo_ker'],
            consumo_len = instance['consumo_len'],
            consumo_pel = instance['consumo_pel'],
            edita_equipos = instance['edita_equipos'],
            equipos_seleccionados = equipos_dict
        )
        r.save()
        return ({'edita equipos': resultado, 'lista_equipos':equipos_dict})
    
    def paso_3_1(self, instance):
        #Nueva instancia de actualización con re balance sobre los consumos. 
        #energía anual del perfil general
        energia_perfil = {
            'elec': sum(instance['consumo_elec']),
            'gn': sum(instance['consumo_gn']),
            'glp': sum(instance['consumo_glp']),
            'ker': sum(instance['consumo_ker']),
            'len': sum(instance['consumo_len']),
            'pel': sum(instance['consumo_pel'])
        }
        # Diccionario de energéticos id: 
        energeticos_ids = {
            'elec': 6,
            'gn': 2,
            'glp': 1,
            'ker': 3,
            'len': 5,
            'pel': 4
        }
        #perfil de consumos energéticos base          
        energia_equipos = {
            'elec': 0,
            'gn': 0,
            'glp': 0,
            'ker': 0,
            'len': 0,
            'pel': 0
        }
        # Recorrer los equipos seleccionados y sumar el consumo por energético
        for equipo_id, equipo_data in instance['equipos_seleccionados'].items():
            energia_base_id = equipo_data['energia_base_id']
            for energetico, id_energetico in energeticos_ids.items():
                if energia_base_id == id_energetico:
                    energia_equipos[energetico] += equipo_data['promedio_energia_anual']
        
        # Balancear el consumo de energía por tipo
        for energetico, consumo_perfil in energia_perfil.items():
            consumo_equipos = energia_equipos[energetico]
            # Solo balancear si hay consumo en el perfil y en los equipos
            if consumo_perfil > 0 and consumo_equipos > 0:
                # Obtener los IDs de los equipos que usan este energético
                equipos_ids = [
                    equipo_id
                    for equipo_id, equipo_data in instance['equipos_seleccionados'].items()
                    if equipo_data['energia_base_id'] == energeticos_ids[energetico]
                ]
                # Calcular la proporción de consumo para cada equipo
                total_consumo_equipos = sum(
                    instance['equipos_seleccionados'][equipo_id]['promedio_energia_anual']
                    for equipo_id in equipos_ids
                )
                proporciones = {
                    equipo_id: instance['equipos_seleccionados'][equipo_id]['promedio_energia_anual'] / total_consumo_equipos
                    for equipo_id in equipos_ids
                }
                # Ajustar el consumo de cada equipo y actualizar los diccionarios
                for equipo_id in equipos_ids:
                    nuevo_consumo = consumo_perfil * proporciones[equipo_id]
                    instance['equipos_seleccionados'][equipo_id]['promedio_energia_anual'] = nuevo_consumo
                    energia_equipos[energetico] -= instance['equipos_seleccionados'][equipo_id]['promedio_energia_anual']
                    energia_equipos[energetico] += nuevo_consumo
        
        r = consultasResultados(
            id = instance['id'],
            id_comuna = instance['id_comuna'],
            id_provincia = instance['id_provincia'],
            id_regional = instance['id_regional'],
            clima = instance['clima'],
            zt = instance['zt'],
            tipo_vivienda = instance['tipo_vivienda'],
            n_pisos = instance['n_pisos'],
            ultimo_piso = instance['ultimo_piso'],
            conoce_superficie = instance['conoce_superficie'],
            superficie = instance['superficie'],
            dormitorios = instance['dormitorios'],
            anio_construccion = instance['anio_construccion'],
            conoce_consumos = instance['conoce_consumos'],
            consumo_elec = instance['consumo_elec'],
            consumo_gn = instance['consumo_gn'],
            consumo_glp = instance['consumo_glp'],
            consumo_ker = instance['consumo_ker'],
            consumo_len = instance['consumo_len'],
            consumo_pel = instance['consumo_pel'],
            edita_equipos = instance['edita_equipos'],
            equipos_seleccionados = instance['equipos_seleccionados']
        )
        r.save()
        return (instance['equipos_seleccionados'])
    
# serializador de consulta MCE crea un id nuevo de consulta.
class resultadosSerializer(serializers.ModelSerializer):

    class Meta:
        model = consultasResultados
        fields = '__all__'

    def paso_4_get(self, instance):
        #metodo GET recibe la lista de recomendaciones ordenadas,
        lista_consumos_ordenada = ordenar_y_sumar_consumos(instance['equipos_seleccionados'])     
        lista_recomendaciones = {}
        for grupo_uso_id, _ in lista_consumos_ordenada:  # Iterar en orden de consumo
            # Obtener todas las recomendaciones para el grupo_uso_id actual
            recomendaciones_grupo = list(recomendaciones.objects.filter(grupo_uso_id=grupo_uso_id).order_by('inversion_id').values()) 
            # Obtener el nombre del grupo de uso
            nombre_grupo_uso = recomendaciones_grupo[0]['grupo_uso'] if recomendaciones_grupo else "Grupo desconocido"
            # Agregar al diccionario
            lista_recomendaciones[nombre_grupo_uso] = recomendaciones_grupo

        return(lista_consumos_ordenada, lista_recomendaciones)
    def paso_4_put(self, instance):
        recomendaciones_seleccionadas = instance['recomendaciones_id']
        recomendaciones_dict = {}
        for id_recomendacion in recomendaciones_seleccionadas:
            recomendacion = recomendaciones.objects.filter(id=id_recomendacion).order_by('inversion_id').values()
            if recomendacion:
                recomendaciones_dict[id_recomendacion] = recomendacion
        #metodo PUT almacena las id de las soluciones seleccionadas.
        r = consultasResultados(
            id = instance['id'],
            id_comuna = instance['id_comuna'],
            id_provincia = instance['id_provincia'],
            id_regional = instance['id_regional'],
            clima = instance['clima'],
            zt = instance['zt'],
            tipo_vivienda = instance['tipo_vivienda'],
            n_pisos = instance['n_pisos'],
            ultimo_piso = instance['ultimo_piso'],
            conoce_superficie = instance['conoce_superficie'],
            superficie = instance['superficie'],
            dormitorios = instance['dormitorios'],
            anio_construccion = instance['anio_construccion'],
            conoce_consumos = instance['conoce_consumos'],
            consumo_elec = instance['consumo_elec'],
            consumo_gn = instance['consumo_gn'],
            consumo_glp = instance['consumo_glp'],
            consumo_ker = instance['consumo_ker'],
            consumo_len = instance['consumo_len'],
            consumo_pel = instance['consumo_pel'],
            edita_equipos = instance['edita_equipos'],
            equipos_seleccionados = instance['equipos_seleccionados'],
            recomendaciones_id = instance['recomendaciones_id']
        )
        r.save()         
        return (recomendaciones_dict)
    
    def paso_5_get(self, instance):
        #metodo GET recibe la lista de resultados ordenadas
        # resumen de consumos energéticos
        energia_perfil = {
            'elec': sum(instance['consumo_elec']),
            'gn': sum(instance['consumo_gn']),
            'glp': sum(instance['consumo_glp']),
            'ker': sum(instance['consumo_ker']),
            'len': sum(instance['consumo_len']),
            'pel': sum(instance['consumo_pel'])
        }
        '''
        energia_perfil = {
            'elec': [],
            'gn': [],
            'glp': [],
            'ker': [],
            'len': [],
            'pel': []
        }
        horas_mes = [0, 744, 1416, 2160, 2880, 3624, 4344, 5088, 5832, 6552, 7296, 8016, 8760]
        for i in range(12):
            energia_perfil['elec'].append(sum(instance['consumo_elec'][horas_mes[i]:horas_mes[i+1]]))
            energia_perfil['gn'].append(sum(instance['consumo_gn'][horas_mes[i]:horas_mes[i+1]]))
            energia_perfil['glp'].append(sum(instance['consumo_glp'][horas_mes[i]:horas_mes[i+1]]))
            energia_perfil['ker'].append(sum(instance['consumo_ker'][horas_mes[i]:horas_mes[i+1]]))
            energia_perfil['len'].append(sum(instance['consumo_len'][horas_mes[i]:horas_mes[i+1]]))
            energia_perfil['pel'].append(sum(instance['consumo_pel'][horas_mes[i]:horas_mes[i+1]]))
        '''
        #Medidas seleccionadas
        medidas_dict = {}
        id_medidas = instance['recomendaciones_id']

        for medida in id_medidas:
            medidas_dict[medida] = recomendaciones.objects.filter(id=medida).values()
        
        resultados = {
            'id' : instance['id'],
            'id_comuna' : instance['id_comuna'],
            'id_provincia' : instance['id_provincia'],
            'id_regional' : instance['id_regional'],
            'zt' : instance['zt'],
            'tipo_vivienda' : instance['tipo_vivienda'],
            'superficie' : instance['superficie'],
            'dormitorios' : instance['dormitorios'],
            'anio_construccion' : instance['anio_construccion'],
            'Resumen de consumos' : energia_perfil,
            'Medidas seleccionadas': medidas_dict,
        }
        return (resultados)

##### FUNCIONES AUXILIARES #####
def ordenar_y_sumar_consumos(equipos_seleccionados):
    """
    Ordena los equipos por 'grupo_uso_id' y suma el 'promedio_energia_anual' para cada grupo.

    Args:
        equipos_seleccionados (dict): Un diccionario con la información de los equipos seleccionados.

    Returns:
        list: Una lista de tuplas ordenada de mayor a menor consumo, donde cada tupla contiene 
              el 'grupo_uso_id' y la suma del 'promedio_energia_anual' para ese grupo.
    """

    consumos_por_grupo = {}
    for equipo_id, equipo_data in equipos_seleccionados.items():
        grupo_uso_id = equipo_data['grupo_uso_id']
        consumo = equipo_data['promedio_energia_anual']

        if grupo_uso_id not in consumos_por_grupo:
            consumos_por_grupo[grupo_uso_id] = 0
        consumos_por_grupo[grupo_uso_id] += consumo

    # Ordenar por consumo de mayor a menor
    lista_ordenada = sorted(consumos_por_grupo.items(), key=lambda item: item[1], reverse=True)
    return lista_ordenada