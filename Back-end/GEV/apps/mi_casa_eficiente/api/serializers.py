from rest_framework import serializers
from apps.mi_casa_eficiente.models import  comunas_zt, perfilConsumoTipo, equipos, recomendaciones, consultasResultados, energeticosFenomeno, CostoEnergetico #carga bbdd de modelos
#from apps.f_aux.geo_data import getGeoData, llamado
#librerias adicionales
import pandas as pd
import numpy as np
import math

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
            pci_comb = energeticosFenomeno.objects.filter(energetico_id = 6).values('poder_calorifico')[0]['poder_calorifico']
            consumo_elec =  list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_elec',flat=True))
            consumo_elec_sum = sum(consumo_elec) / pci_comb
        else:
            consumo_elec = []
            consumo_elec_sum = 0

        if usa_gn:
            pci_comb = energeticosFenomeno.objects.filter(energetico_id = 2).values('poder_calorifico')[0]['poder_calorifico']  
            consumo_gn = list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_gn',flat=True))
            consumo_gn_sum = sum(consumo_gn) / pci_comb
        else: 
            consumo_gn = []
            consumo_gn_sum = 0

        if usa_glp:
            pci_comb = energeticosFenomeno.objects.filter(energetico_id = 1).values('poder_calorifico')[0]['poder_calorifico']
            consumo_glp = list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_glp',flat=True))
            consumo_glp_sum = sum(consumo_glp) / pci_comb
        else:
            consumo_glp = []
            consumo_glp_sum = 0
        
        if usa_ker:
            pci_comb = energeticosFenomeno.objects.filter(energetico_id = 3).values('poder_calorifico')[0]['poder_calorifico']
            consumo_ker = list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_ker',flat=True))
            consumo_ker_sum = sum(consumo_ker) / pci_comb
        else:
            consumo_ker = []
            consumo_ker_sum = 0

        if usa_len:
            pci_comb = energeticosFenomeno.objects.filter(energetico_id = 5).values('poder_calorifico')[0]['poder_calorifico']
            consumo_len = list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_len',flat=True))
            consumo_len_sum = sum(consumo_len) / pci_comb
        else: 
            consumo_len = []
            consumo_len_sum = 0

        if usa_pel:
            pci_comb = energeticosFenomeno.objects.filter(energetico_id = 4).values('poder_calorifico')[0]['poder_calorifico']
            consumo_pel = list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_pel',flat=True))
            consumo_pel_sum = sum(consumo_pel) / (pci_comb * 20) #sacos de 20 kg
        else:
            consumo_pel = []
            consumo_pel_sum = 0

        #construye diccionario de resultados para el siguiente paso
        resultado = {
            'id' : instance['id'],
            'id_region' : cod_region,
            'id_provincia' : cod_provincia,
            'id_comuna' :  instance['id_comuna'],
            'zt' : zt,
            'superficie' : sup,
            'dormitorios' : n_dor,
            'consumo_elec' : consumo_elec_sum,
            'consumo_ker' : consumo_ker_sum,
            'consumo_gn' : consumo_gn_sum,
            'consumo_glp' : consumo_glp_sum,
            'consumo_len' : consumo_len_sum,
            'consumo_pel' : consumo_pel_sum,
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

        #perfil de consumo mensual
        con_elec = self.validated_data.get('con_elec')
        con_gn = self.validated_data.get('con_gn')
        con_glp = self.validated_data.get('con_glp')
        con_ker = self.validated_data.get('con_ker')
        con_len = self.validated_data.get('con_len')
        con_pel = self.validated_data.get('con_pel')

        zt_2007 = comunas_zt.objects.filter(id_comuna=instance['id_comuna'], clima=instance['clima']).values_list('zt_2007',flat=True)[0]
        #comuna = 
        #region = 
        #Edita las demandas base, siempre que elija cual editar (permite entrar denuevo a cualquier demanda)
        if usa_elec:
            pci_comb = energeticosFenomeno.objects.filter(energetico_id = 6).values('poder_calorifico')[0]['poder_calorifico']
            suma_consumo_elc = sum(con_elec) / 8760 * pci_comb
            consumo_elec =  [suma_consumo_elc]*8760
        else:
            consumo_elec = []

        if usa_gn:
            pci_comb = energeticosFenomeno.objects.filter(energetico_id = 2).values('poder_calorifico')[0]['poder_calorifico'] 
            suma_consumo_gn = sum(con_gn) / 8760 * pci_comb
            consumo_gn = [suma_consumo_gn]*8760
        else: 
            consumo_gn = []

        if usa_glp:
            pci_comb = energeticosFenomeno.objects.filter(energetico_id = 1).values('poder_calorifico')[0]['poder_calorifico']
            suma_consumo_glp = sum(con_glp) / 8760 * pci_comb
            consumo_glp = [suma_consumo_glp]*8760
        else:
            consumo_glp = []
        
        if usa_ker:
            pci_comb = energeticosFenomeno.objects.filter(energetico_id = 3).values('poder_calorifico')[0]['poder_calorifico']
            suma_consumo_ker = sum(con_ker) / 8760 * pci_comb
            consumo_ker = [suma_consumo_ker]*8760
        else:
            consumo_ker = []

        if usa_len:
            pci_comb = energeticosFenomeno.objects.filter(energetico_id = 5).values('poder_calorifico')[0]['poder_calorifico']
            suma_consumo_len = sum(con_len) / 8760 * pci_comb
            consumo_len = [suma_consumo_len]*8760
        else: 
            consumo_len = []

        if usa_pel:
            pci_comb = energeticosFenomeno.objects.filter(energetico_id = 4).values('poder_calorifico')[0]['poder_calorifico']
            suma_consumo_pel = sum(con_pel) / 8760 * pci_comb * 20 #sacos de 20 kg
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
            'consumo_elec' : sum(consumo_elec),
            'consumo_gn' : sum(consumo_gn),
            'consumo_glp' : sum(consumo_glp),
            'consumo_ker' : sum(consumo_ker),
            'consumo_len' : sum(consumo_len),
            'consumo_pel' : sum(consumo_pel),
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
            nombre_grupo_uso = recomendaciones_grupo[0]['grupo_uso'] if recomendaciones_grupo else "Grupo_desconocido"
            # Agregar al diccionario
            lista_recomendaciones[nombre_grupo_uso] = recomendaciones_grupo
            # Orden de la lista
            lista_recomendaciones_ordenada = reorganizar_lista_recomendaciones(lista_recomendaciones)
        #dda_energia_max
        # resumen de consumos energéticos
        energia_perfil = {
            'elec': sum(instance['consumo_elec']),
            'gn': sum(instance['consumo_gn']),
            'glp': sum(instance['consumo_glp']),
            'ker': sum(instance['consumo_ker']),
            'len': sum(instance['consumo_len']),
            'pel': sum(instance['consumo_pel'])
        }
        total_energia_sum = sum(energia_perfil.values())
        #calculo demandas maximas para etiqueta
        id_comuna = instance['id_comuna']
        zt = instance['zt']
        zt_2007 = comunas_zt.objects.filter(id_comuna=id_comuna, zt=zt).values_list('zt_2007',flat=True)[0]
        #recorrido para binarios de energeticos
        energia_bol = {clave: valor > 0 for clave, valor in energia_perfil.items()}
        dda_maxima_elec = sum(list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_elec', flat=True)))
        dda_maxima_gn = sum(list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_gn', flat=True)))
        dda_maxima_glp = sum(list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_glp', flat=True)))
        dda_maxima_ker = sum(list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_ker', flat=True)))
        dda_maxima_len = sum(list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_len', flat=True)))
        dda_maxima_pel = sum(list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_pel', flat=True)))
        dda_maxima = {
            'elec': dda_maxima_elec,
            'gn': dda_maxima_gn,
            'glp': dda_maxima_glp,
            'ker': dda_maxima_ker,
            'len': dda_maxima_len,
            'pel': dda_maxima_pel
        }
        dda_maxima_total = 0
        for clave in energia_bol:
            dda_maxima_total += energia_bol[clave] * dda_maxima[clave]
        #compara demanda maxima regional y zt con dda real y elige cual es la maxima para el rango:
        if dda_maxima_total <= total_energia_sum:
            dda_maxima_total = total_energia_sum
        resultado_dict = {
            'dda_energia_max': dda_maxima_total,
            'lista_consumos_ordenada': lista_consumos_ordenada,
            'lista_recomendaciones': lista_recomendaciones_ordenada
        }

        return(resultado_dict)
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
        total_energia_sum = sum(energia_perfil.values())
        #agregar costo energético. 
        #comuna y region
        cod_region = comunas_zt.objects.filter(id_comuna=instance['id_comuna'], clima=instance['clima']).values()[0]['id_regional']
        #cod_comuna = instance['id_comuna']
        costo_comb = CostoEnergetico.objects.filter(id_regional=cod_region, id_comuna__isnull=True).values()
        #costo_comb = costo_comb.append(pd.DataFrame(data=CostoEnergetico.objects.filter(id_regional=cod_region, id_comuna=cod_comuna).values()), ignore_index=True)
        costo_unitario = {
            'elec': costo_comb[0]['costo_alto_ele'],
            'gn': costo_comb[0]['costo_alto_gn'],
            'glp': costo_comb[0]['costo_alto_glp'],
            'ker': costo_comb[0]['costo_alto_ker'],
            'len': costo_comb[0]['costo_alto_len'],
            'pel': costo_comb[0]['costo_alto_pel']
        }
        costo_unitario = {k: v if v is not None else 0 for k, v in costo_unitario.items()}
        #lista de costos
        costo_perfil = {
            'elec': sum(instance['consumo_elec'])*costo_unitario['elec'],
            'gn': sum(instance['consumo_gn'])*costo_unitario['gn'],
            'glp': sum(instance['consumo_glp'])*costo_unitario['glp'],
            'ker': sum(instance['consumo_ker'])*costo_unitario['ker'],
            'len': sum(instance['consumo_len'])*costo_unitario['len'],
            'pel': sum(instance['consumo_pel'])*costo_unitario['pel']
        }
        # agregar emisiones
        #calculo de emisiones por tipo energetico
        #pci_energetico = energeticosFenomeno.objects.filter(energetico_id__in=[1,2,3,4,5,6]).values('poder_calorifico')
        emisiones_comb = energeticosFenomeno.objects.filter(energetico_id__in=[1,2,3,4,5,6]).values('co2_eq')
        
        emisiones_perfil = {
            'elec': sum(instance['consumo_elec'])*emisiones_comb[5]['co2_eq']/1000,
            'gn': sum(instance['consumo_gn'])*emisiones_comb[1]['co2_eq']/1000,
            'glp': sum(instance['consumo_glp'])*emisiones_comb[0]['co2_eq']/1000,
            'ker': sum(instance['consumo_ker'])*emisiones_comb[2]['co2_eq']/1000,
            'len': sum(instance['consumo_len'])*emisiones_comb[4]['co2_eq']/1000,
            'pel': sum(instance['consumo_pel'])*emisiones_comb[3]['co2_eq']/1000
        }
        #calculo demandas maximas para etiqueta
        id_comuna = instance['id_comuna']
        zt = instance['zt']
        zt_2007 = comunas_zt.objects.filter(id_comuna=id_comuna, zt=zt).values_list('zt_2007',flat=True)[0]

        #recorrido para binarios de energeticos
        energia_bol = {clave: valor > 0 for clave, valor in energia_perfil.items()}
        dda_maxima_elec = sum(list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_elec', flat=True)))
        dda_maxima_gn = sum(list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_gn', flat=True)))
        dda_maxima_glp = sum(list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_glp', flat=True)))
        dda_maxima_ker = sum(list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_ker', flat=True)))
        dda_maxima_len = sum(list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_len', flat=True)))
        dda_maxima_pel = sum(list(perfilConsumoTipo.objects.filter(zt_2007=zt_2007).values_list('consumo_pel', flat=True)))
        dda_maxima = {
            'elec': dda_maxima_elec,
            'gn': dda_maxima_gn,
            'glp': dda_maxima_glp,
            'ker': dda_maxima_ker,
            'len': dda_maxima_len,
            'pel': dda_maxima_pel
        }
        dda_maxima_total = 0
        for clave in energia_bol:
            dda_maxima_total += energia_bol[clave] * dda_maxima[clave]
        #compara demanda maxima regional y zt con dda real y elige cual es la maxima para el rango:
        if dda_maxima_total <= total_energia_sum:
            dda_maxima_total = total_energia_sum

        #Medidas seleccionadas
        medidas_dict = {}
        id_medidas = instance['recomendaciones_id']

        for medida in id_medidas:
            medidas_dict[medida] = recomendaciones.objects.filter(id=medida).values()
        
        # 1. Agrupar la información por 'grupo_uso_id' para obtener los totales de energía
        #    y conteos de elementos de forma consistente con el paso 4.
        datos_por_grupo_id = {}
        for equipo_data in instance['equipos_seleccionados'].values():
            grupo_id = equipo_data.get('grupo_uso_id')
            if grupo_id not in datos_por_grupo_id:
                datos_por_grupo_id[grupo_id] = {
                    'suma_energia': 0,
                    'cantidad_elementos': 0,
                    'nombre_grupo': "Grupo Desconocido" # Valor por defecto
                }
            datos_por_grupo_id[grupo_id]['suma_energia'] += equipo_data.get('promedio_energia_anual', 0)
            datos_por_grupo_id[grupo_id]['cantidad_elementos'] += 1

        # 2. Obtener los nombres correctos para cada 'grupo_uso_id' desde la tabla de recomendaciones,
        #    que es la fuente de verdad para los nombres de las categorías.
        ids_unicos = datos_por_grupo_id.keys()
        nombres_reales = recomendaciones.objects.filter(grupo_uso_id__in=ids_unicos).values('grupo_uso_id', 'grupo_uso_corto').distinct()
        
        mapa_id_nombre = {item['grupo_uso_id']: item['grupo_uso_corto'] for item in nombres_reales}

        # 3. Construir el diccionario final 'resumen_desempeno' combinando los datos.
        resumen_desempeno = {}
        suma_desempeno = 0
        for grupo_id, data in datos_por_grupo_id.items():
            nombre_final = mapa_id_nombre.get(grupo_id, data['nombre_grupo'])
            resumen_desempeno[nombre_final] = {
                'cantidad_elementos': data['cantidad_elementos'],
                'suma_energia': data['suma_energia'],
                'puntaje': 0 # Se calculará después
            }
            suma_desempeno += data['suma_energia']

        # 4. Calcular los puntajes para cada categoría.
        for grupo, data in resumen_desempeno.items():
            if suma_desempeno > 0:
                data['puntaje'] = math.ceil(data['suma_energia'] / suma_desempeno * 5)
            else:
                data['puntaje'] = 0
        
        resumen_previo = {
            'id' : instance['id'],
            'id_comuna' : instance['id_comuna'],
            'id_provincia' : instance['id_provincia'],
            'id_regional' : instance['id_regional'],
            'zt' : instance['zt'],
            'tipo_vivienda' : instance['tipo_vivienda'],
            'superficie' : instance['superficie'],
            'dormitorios' : instance['dormitorios'],
            'anio_construccion' : instance['anio_construccion'],
            'dda_maxima': dda_maxima_total,
            'Resumen de consumos' : energia_perfil,
            'Costo_consumo_anual' : costo_perfil,
            'Emisiones_total': emisiones_perfil,
            'Resumen_desempeno' : resumen_desempeno,
            'Medidas seleccionadas': medidas_dict,
        }
        resultado_medidas = calcular_resultados_medidas(resumen_previo)
        
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
            'dda_maxima': dda_maxima_total,
            'Resumen de consumos' : energia_perfil,
            'Costo_consumo_anual' : costo_perfil,
            'Emisiones_total': emisiones_perfil,
            'Resumen_desempeno' : resumen_desempeno,
            'Medidas seleccionadas': medidas_dict,
            'Ahorro_medidas': resultado_medidas
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


def reorganizar_lista_recomendaciones(lista_recomendaciones):
    """
    Reorganiza el diccionario de lista_recomendaciones en la estructura deseada.

    Args:
        lista_recomendaciones (dict): El diccionario original de recomendaciones.

    Returns:
        list: Una lista de diccionarios con la estructura reorganizada.
    """

    nueva_lista_recomendaciones = []
    for grupo_uso, recomendaciones in lista_recomendaciones.items():
        grupo_uso_id = recomendaciones[0]['grupo_uso_id'] if recomendaciones else None #obtiene el id del grupo, para ordenarlos por eso.
        nueva_lista_recomendaciones.append({
            "grupo_uso": grupo_uso,
            "grupo_uso_id": grupo_uso_id,
            "recomendaciones": recomendaciones
        })
    return nueva_lista_recomendaciones
   
def calcular_resultados_medidas(data):
    """
    Calcula resultados estimados de eficiencia energética basados en las medidas seleccionadas.
    
    Args:
        data: Diccionario completo con los datos de análisis energético
    
    Returns:
        dict: Diccionario con los resultados estructurados según el formato solicitado
    """
    # 1. Extraer secciones relevantes del diccionario
    medidas_seleccionadas = data.get("Medidas seleccionadas", {})
    resumen_desempeno = data.get("Resumen_desempeno", {})
    emisiones_perfil = data.get("Emisiones_total", {})
    costos_energia = data.get("Costo_consumo_anual", {})
    
    # 2. Definir porcentajes de ahorro según ahorro_ee_id
    rangos_ahorro = {
        1: (0, 5),     # Nivel 1: menos del 5%
        2: (5, 15),    # Nivel 2: entre 5% y 15% 
        3: (15, 30),   # Nivel 3: entre 15% y 30%
        4: (30, 50),    # Nivel 4: entre 30% y 50%
        5: (50, 60)     # Nivel 5: más del 50%
    }
    
    # 3. Definir valores y mapeo de texto para inversión
    niveles_inversion = {
        1: 1,   # Nula
        2: 2,   # Baja
        3: 3,   # Media
        4: 4    # Alta 
    }
    mapeo_inversion_texto = {
        1: "Nula",
        2: "Baja",
        3: "Media",
        4: "Alta"
    }
    
    # 4. Agrupar ahorros y costos de inversión por categoría (grupo_uso_corto)
    impactos_por_categoria = {}
    total_inversiones_valor = 0
    numero_medidas = 0

    for medida_id, detalles_medidas in medidas_seleccionadas.items():
        for medida in detalles_medidas:
            numero_medidas += 1
            grupo_uso_corto = medida.get("grupo_uso_corto")
            ahorro_ee_id = medida.get("ahorro_ee_id")
            inversion_id = medida.get("inversion_id")

            if grupo_uso_corto:
                if grupo_uso_corto not in impactos_por_categoria:
                    impactos_por_categoria[grupo_uso_corto] = {"ahorros": []}
                
                rango = rangos_ahorro.get(ahorro_ee_id, (0, 0))
                impactos_por_categoria[grupo_uso_corto]["ahorros"].append(rango)

            total_inversiones_valor += niveles_inversion.get(inversion_id, 0)
    # 5. Calcular el ahorro energético total sumando los ahorros de cada categoría
    ahorro_energia_min_total = 0
    ahorro_energia_max_total = 0.
    
    for categoria, impactos in impactos_por_categoria.items():
        if categoria in resumen_desempeno and impactos["ahorros"]:
            energia_categoria = resumen_desempeno[categoria].get("suma_energia", 0)
            # INICIALIZAR LA SUMA DE PORCENTAJES PARA LA CATEGORÍA
            ahorro_min_sumado_cat = 0
            ahorro_max_sumado_cat = 0
            
            # SE SUMAN LOS PORCENTAJES DE AHORRO DE TODAS LAS MEDIDAS SELECCIONADAS EN LA CATEGORÍA
            for rango_ahorro_medida in impactos["ahorros"]:
                ahorro_min_sumado_cat += rango_ahorro_medida[0]
                ahorro_max_sumado_cat += rango_ahorro_medida[1]

            # SE APLICA EL TOPE MÁXIMO DE AHORRO DEL 80% A LA SUMA TOTAL DE PORCENTAJES
            porcentaje_ahorro_min_final = min(ahorro_min_sumado_cat, 80)
            porcentaje_ahorro_max_final = min(ahorro_max_sumado_cat, 80)

            # CALCULAR EL AHORRO DE ENERGÍA PARA LA CATEGORÍA, USANDO LOS PORCENTAJES ACUMULADOS Y CON TOPE
            ahorro_energia_min_total += energia_categoria * (porcentaje_ahorro_min_final / 100)
            ahorro_energia_max_total += energia_categoria * (porcentaje_ahorro_max_final / 100)

    # 6. Calcular el porcentaje de eficiencia energética total
    total_energia = sum(datos.get("suma_energia", 0) for datos in resumen_desempeno.values())
    ahorro_min_ponderado = (ahorro_energia_min_total / total_energia) * 100 if total_energia > 0 else 0
    ahorro_max_ponderado = (ahorro_energia_max_total / total_energia) * 100 if total_energia > 0 else 0
    # 7. Calcular ahorro monetario potencial
    costo_total = sum(costos_energia.values())
    
    ahorro_min_monetario = (ahorro_min_ponderado / 100) * costo_total
    ahorro_max_monetario = (ahorro_max_ponderado / 100) * costo_total
    ahorro_promedio_monetario = (ahorro_min_monetario + ahorro_max_monetario) / 2

    # 8. Calcular nivel de inversión promedio y su valor textual
    nivel_inversion_promedio = 0
    valor_inversion_texto = "N/A" # Valor por defecto
    if numero_medidas > 0:
        nivel_inversion_promedio = total_inversiones_valor / numero_medidas
        inversion_entero = min(max(math.ceil(nivel_inversion_promedio), 1), 4) 
        valor_inversion_texto = mapeo_inversion_texto.get(inversion_entero, "Desconocida")

    # 9. Calcular emisiones totales y ahorro energético promedio
    total_emisiones = sum(emisiones_perfil.values())
    ahorro_energetico_promedio = (ahorro_energia_min_total + ahorro_energia_max_total) / 2

    # 10. Construir el diccionario de resultados
    resultados = {
        "eficiencia_energetica": [round(ahorro_min_ponderado, 1), round(ahorro_max_ponderado, 1)],
        "ahorro_energetico": [ahorro_energia_min_total, ahorro_energia_max_total],
        "ahorro_energetico_promedio": ahorro_energetico_promedio,
        "ahorro_potencial_monetario": [round(ahorro_min_monetario), round(ahorro_max_monetario)],
        "ahorro_promedio_monetario": round(ahorro_promedio_monetario),
        "inversion_total": round(nivel_inversion_promedio, 1),
        "valor_inversion": valor_inversion_texto,
        "emisiones": round(total_emisiones, 2)
    }
    
    return resultados