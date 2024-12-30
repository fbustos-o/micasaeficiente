from django.db import models

# Create your models here.
#1 - tabla comunas y clima - tabla fija
class comunas_zt(models.Model):
    id_regional = models.IntegerField(blank=True,null=True)
    id_provincia = models.IntegerField(blank=True,null=True)
    id_comuna = models.IntegerField(blank=True,null=True)
    region = models.CharField(max_length=150,blank=True,null=True)
    provincia = models.CharField(max_length=150,blank=True,null=True)
    comuna = models.CharField(max_length=150,blank=True,null=True)
    zt = models.CharField(max_length=2, blank=True, null=True)
    zt_2007 = models.IntegerField(blank=True,null=True)
    limite_meridiano = models.CharField(max_length=150,blank=True,null=True)
    limite_altitud = models.CharField(max_length=150,blank=True,null=True)
    tipo_clima = models.CharField(max_length=150,blank=True,null=True)
    class climaTipo(models.IntegerChoices):
        ninguno = 1
        costa = 2
        valle = 3
        cordillera = 4
        alta_cordillera = 5
    clima = models.IntegerField(choices=climaTipo.choices, default=0,blank=True,null=True)
    PDA = models.BooleanField('zona_PDA',default = False)
    prohibicion_lena = models.CharField(max_length=150,blank=True, null=True)
    prohibicion_pellet = models.CharField(max_length=150,blank=True, null=True)
    plan_PDA_actual = models.CharField(max_length=250,blank=True, null=True)
    link_PDA = models.CharField(max_length=250,blank=True, null=True)
    lat = models.FloatField(blank=True,null=True)
    lon = models.FloatField(blank=True,null=True)

# 2 - perfiles de consumo tipo (base estudio residencial 2018) kWh - tabla fija
class perfilConsumoTipo(models.Model):
    grupo_se_id = models.IntegerField(blank=True,null=True, default=5) #grupos NSE: 1: C1; 2: C2, 3: C3, 4: D-E, 5: None
    zt_2007 = models.IntegerField(blank=True,null=True)
    mes = models.IntegerField(blank=True,null=True)
    dia = models.IntegerField(blank=True,null=True)
    hora = models.IntegerField(blank=True,null=True)
    consumo_elec = models.FloatField(blank=True, null=True)
    consumo_gn = models.FloatField(blank=True, null=True)
    consumo_glp = models.FloatField(blank=True, null=True)
    consumo_ker = models.FloatField(blank=True, null=True)
    consumo_len = models.FloatField(blank=True, null=True)
    consumo_pel = models.FloatField(blank=True, null=True)

# 3 - costos de energéticos - tabla fija
class CostoEnergetico(models.Model):
    id_regional = models.IntegerField(blank=True,null=True)
    id_comuna = models.IntegerField(blank=True,null=True)
    region = models.CharField(max_length=150,blank=True,null=True)
    comuna = models.CharField(max_length=150,blank=True,null=True)
    costo_bajo_gn = models.FloatField(blank=True,null=True)
    costo_alto_gn = models.FloatField(blank=True,null=True)
    costo_bajo_glp = models.FloatField(blank=True,null=True)
    costo_alto_glp = models.FloatField(blank=True,null=True)
    costo_bajo_ele = models.FloatField(blank=True,null=True)
    costo_alto_ele = models.FloatField(blank=True,null=True)
    costo_bajo_ker = models.FloatField(blank=True,null=True)
    costo_alto_ker = models.FloatField(blank=True,null=True)
    costo_bajo_len = models.FloatField(blank=True,null=True)
    costo_alto_len = models.FloatField(blank=True,null=True)
    costo_bajo_pel = models.FloatField(blank=True,null=True)
    costo_alto_pel = models.FloatField(blank=True,null=True)

# 4 - equipos base de la vivienda
class equipos(models.Model):
    nombre_equipo = models.CharField(max_length=150,blank=True,null=True)
    grupo_uso_corto = models.CharField(max_length=150,blank=True,null=True)
    espacio_exterior = models.BooleanField('Exterior', blank=True,null=True)
    espacio_cocina = models.BooleanField('Cocina', blank=True,null=True)
    espacio_bahno = models.BooleanField('Baño', blank=True,null=True)
    espacio_dormitorio = models.BooleanField('Dormitorio', blank=True,null=True)
    espacio_living = models.BooleanField('Living-comedor', blank=True,null=True)
    descripcion = models.TextField(null=True)
    energia_base_id = models.IntegerField(null=True) 
    grupo_uso_id = models.IntegerField(blank=True, null=True)
    cantidad_promedio = models.IntegerField(blank=True,null=True)
    horas_uso_tipo = models.FloatField(blank=True,null=True)
    potencia_equipo = models.FloatField(blank=True,null=True)
    eficiencia_equipo = models.FloatField(blank=True,null=True)
    promedio_energia_anual = models.FloatField(blank=True,null=True)
    fuente = models.TextField(null=True)

# 5 - energéticos fenomeno - tabla fija
class energeticosFenomeno(models.Model):
    energetico_id = models.IntegerField(null=True)
    energetico_fenomeno = models.CharField(max_length=150,blank=True,null=True)
    poder_calorifico = models.FloatField(blank=True,null=True)
    eficiencia_base = models.FloatField(blank=True,null=True)
    mp25 = models.FloatField(blank=True,null=True)
    nox = models.FloatField(blank=True,null=True)
    so2 = models.FloatField(blank=True,null=True)
    co = models.FloatField(blank=True,null=True)
    co2_eq = models.FloatField(blank=True,null=True) #valores en ton/MWh

# 6 - Recomendaciones
class recomendaciones(models.Model):
    grupo_uso_id = models.IntegerField(blank=True, null=True)
    grupo_uso = models.CharField(max_length=100, blank=True, null=True)
    grupo_uso_corto = models.CharField(max_length=100, blank=True, null=True)
    recomendacion = models.TextField(blank=True, null=True)
    inversion_id = models.IntegerField(blank=True, null=True)
    inversion = models.CharField(max_length=100, blank=True, null=True)
    ahorro_ee_id = models.IntegerField(blank=True, null=True)
    ahorro_ee = models.CharField(max_length=100, blank=True, null=True)

# 7 - Resultados 
class consultasResultados(models.Model):
    id_comuna = models.IntegerField(blank=True,null=True)
    id_provincia = models.IntegerField(blank=True,null=True)
    id_regional = models.IntegerField(blank=True,null=True)
    clima = models.IntegerField(blank=True,null=True)
    zt = models.CharField(max_length=2, blank=True, null=True)
    class TipoVivienda(models.IntegerChoices):
        aislada = 1
        pareada = 2
        departamento = 3
    tipo_vivienda = models.IntegerField(choices=TipoVivienda.choices, blank=True,null=True)
    class nPisos(models.IntegerChoices):
        piso_1 = 1
        piso_2 = 2
    n_pisos = models.IntegerField(choices=nPisos.choices, default=1)
    ultimo_piso = models.BooleanField('Ultimo_piso',default = False)
    conoce_superficie = models.BooleanField('Conoce_Superficie', default=True, blank=True,null=True)
    superficie = models.IntegerField(null=True, default=75) #valor por defecto Tabla 10, PROMEDIO Y MEDIANA DE SUPERFICIE DE VIVIENDAS, SEGÚN NSE (pag 36)
    dormitorios = models.IntegerField(null=True, default=3)
    class AnioConstruccion(models.IntegerChoices):
        anio_2000 = 1
        anio_2001_2007 = 2
        anio_2007_2021 = 3
        anio_nueva_oguc = 4
    anio_construccion = models.IntegerField(choices=AnioConstruccion.choices, blank=True,null=True, default=1)
    conoce_consumos = models.BooleanField('conoce_consumos', default = False)
    consumo_elec = models.JSONField(blank=True,null=True, default=list)
    consumo_gn = models.JSONField(blank=True,null=True, default=list)
    consumo_glp = models.JSONField(blank=True,null=True, default=list)
    consumo_ker = models.JSONField(blank=True,null=True, default=list)
    consumo_len = models.JSONField(blank=True,null=True, default=list)
    consumo_pel = models.JSONField(blank=True,null=True, default=list)
    edita_equipos = models.BooleanField('edita_equipos', default = False)
    equipos_seleccionados = models.JSONField(blank=True,null=True, default=list)
    recomendaciones_id = models.JSONField(blank=True,null=True, default=list)