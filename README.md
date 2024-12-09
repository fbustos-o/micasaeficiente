# Mi Casa Eficiente
![image](https://github.com/user-attachments/assets/1ac1b78a-8dce-4496-a54a-b6bd3a1a2b4c)

Breve manual de uso de los métodos GET, POST y PUT del back-end de “Mi casa Eficiente”

Para utilizarlo puedes ir a: https://github.com/fbustos-o/micasaeficiente

Las bases de datos a pre-cargar en el back-end son las siguientes: 

1. comunas_zt.csv 
2. perfilConsumoTipo.csv
3. equipos.csv
4. recomendaciones.csv

Se puede descargar desde el siguiente [link](https://minenergia-my.sharepoint.com/:f:/g/personal/fbustos_minenergia_cl/Eqws0780Kf1DvVfP0xhIfDQBZ3AU_7WRxs19yDHkjso6HA?e=OzZa6A). 

## Pasos de consulta

### Diccionarios base.

 la API utiliza los siguientes IDs para identificar los energéticos, tipos de vivienda y años de construcción:

### Energéticos

```json
{
  'GLP': 1,
  'GN': 2,
  'Kerosene': 3,
  'Pellet': 4,
  'Leña': 5,
  'Electricidad': 6
}
```

### Tipos de vivienda

```json
{
  'Casa Individual': 1,
  'Casa Aislada': 2,
  'Departamento': 3
}
```

### Años de construcción

```json
{
  'Pre 2001': 1,
  '2001 - 2007': 2,
  '2008 - 2023': 3,
  'pos 2023': 4
}
```

### Tipos de clima

```json
{
null : 1,
'Costa': 2
'Valle': 3,
'Cordillera': 4,
'Alta Cordillera': 5
}
```

### Pasos de la herramienta

Para realizar la evaluación de la casa eficiente se debe acceder a las siguientes urls del back-end, las que alimentarán un registro de la bbdd para cada consulta: 

### Paso 1

Consulta comunas, selecciona comunas

<aside>
🔗

`../mi_casa_eficiente/comunas/`

</aside>

Métodos del paso: 

**GET** **:** Este *endpoint*, entrega un listado de todas las regiones del país y un subconjunto de las comunas dentro de la región con su nombre en *string,* su Código Único Tributario (CUT) en forma de id_comuna en formato *integer y* el clima que representa con su respectivo id (puede que se repitan algunas comunas con múltiples climas, esos se deben consultar en el ingreso)*.*

```json
Ejemplo solo para la comuna de Arica: 
HTTP 200 OK
Allow: POST, GET, OPTIONS
Content-Type: application/json
Vary: Accept

{
    "De Arica y Parinacota": {
        "comunas": [
            [
                "Arica",
                15101,
                2
            ],
            [
                "Arica",
                15101,
                3
            ],
            [
                "Arica",
                15101,
                4
            ],
            [
                "Camarones",
                15102,
                2
            ],
            [
                "Camarones",
                15102,
                3
            ],
            [
                "Camarones",
                15102,
                4
            ],
            [
                "General Lagos",
                15202,
                1
            ],
            [
                "Putre",
                15201,
                1
            ]
        ]
    }
  }
```

> Se puede visitar: [https://climatiza.exploradorenergia.cl/home](https://climatiza.exploradorenergia.cl/home) para entender el primer paso.
> 

**POST :** Para iniciar la consulta se debe enviar algunos datos de la vivienda y que tipos de combustible utiliza en el siguiente formato: 

```json
Ejemplo si conoce su superficie de construcción: 
{
  "id_comuna": 13115, 
  "clima": 3,
  "tipo_vivienda": 1,
  "n_pisos": 1, 
  "ultimo_piso": false,
  "conoce_superficie": true,
  "superficie": 70,
  "anio_construccion": 2,
  "usa_elec": true,
  "usa_gn": true,
  "usa_glp": true,
  "usa_ker": false,
  "usa_len": false,
  "usa_pel": false
} 
Ejemplo si no conoce su superficie de contrucción:
{
  "id_comuna": 13115, 
  "clima": 3,
  "tipo_vivienda": 1,
  "n_pisos": 1, 
  "ultimo_piso": false,
  "conoce_superficie": false,
  "dormitorio": 3,
  "anio_construccion": 2,
  "usa_elec": true,
  "usa_gn": true,
  "usa_glp": true,
  "usa_ker": false,
  "usa_len": false,
  "usa_pel": false
} 
```

Una vez ejecutado el método, entregará el siguiente resultado:

```json
HTTP 201 Created
Allow: GET, POST, OPTIONS
Content-Type: application/json
Vary: Accept

{
    "id": 3,
    "id_region": 13,
    "id_provincia": 131,
    "id_comuna": 13115,
    "zt": "D",
    "superficie": 70,
    "dormitorios": 3,
    "consumo_elec": 2508.999999,
    "consumo_gn": 1154.0000016,
    "consumo_glp": 1978.99999992,
    "consumo_ker": 0,
    "consumo_len": 0,
    "consumo_pel": 0
}
```

Entrega datos generales, y los consumos de energía anualizados base, que vienen del estudio residencial 2018. 

### **Paso 2**

Indicar si conoces tus consumos. En caso de que el usuario encuentre que los consumos que se indican no concuerdan con sus expectativas, se debe ingresar a este método. Si él usuario no desea modificar sus consumos, puede pasar directo al paso 3. 

Para que este método funcione, se debe tomar el valor id del paso anterior para alimentar con su numero a la url en la parte `*<int:pk>`.*

<aside>
🔗

`../mi_casa_eficiente/demanda/<int:pk>`

</aside>

**GET** **:** Entrega la información general del resultado. Presenta vectores de 8760 horas para cada componente de energía. Se pueden sumar dichos vectores para entregar un valor anualizado en kWh. 

**PUT :** El método PUT permite editar el valor de “conoce_consumos”, para pasar de *false* a *true*.

```json
{
  "conoce_consumos": true/false
}
```

### Paso 2.1

En caso de realizar el paso 2 en *true*. Se debe inyectar la información de los perfiles de uso. En esta oportunidad se puede agregar nuevos perfiles de uso, a pesar de que en paso 1 no se marcaron. 

<aside>
🔗

`../mi_casa_eficiente/edita_consumo/<int:pk>`

</aside>

**GET** **:** Entrega la información general del resultado. Presenta vectores de 8760 horas para cada componente de energía. Se pueden sumar dichos vectores para entregar un valor anualizado en kWh. 

**PUT :** El método PUT, debe incluir los perfiles de consumo mensualizados (hasta el momento en kWh, se podrán hacer conversiones). 

Ejemplo:

```json
Queremos solo dejar el consumo eléctrico: 
{
  "usa_elec": true,
  "usa_gn": false,
  "usa_glp": false,
  "usa_ker": false,
  "usa_len": false,
  "usa_pel": false,
  "con_elec": [100, 150, 100, 200, 220, 180, 260, 240, 200, 180, 130, 110]
}
```

El resultado que sale es el siguiente, agregando los equipos: 

```json
HTTP 201 Created
Allow: GET, PUT, OPTIONS
Content-Type: application/json
Vary: Accept

{
    "id": 4,
    "id_comuna": 13115,
    "id_provincia": 131,
    "id_regional": 13,
    "clima": 3,
    "zt": "D",
    "tipo_vivienda": 1,
    "n_pisos": 1,
    "ultimo_piso": false,
    "conoce_superficie": true,
    "superficie": 70,
    "dormitorios": 3,
    "anio_construccion": 2,
    "conoce_consumos": false,
    "consumo_elec": [
        0.2363013698630137,
        0.2363013698630137,
        0.2363013698630137,
        ...
        0.2363013698630137,
        0.2363013698630137,
        0.2363013698630137
    ],
    "consumo_gn": [],
    "consumo_glp": [],
    "consumo_ker": [],
    "consumo_len": [],
    "consumo_pel": [],
    "equipos_seleccionados": {
        "1": {
            "id": 1,
            "nombre_equipo": "Ampolleta LED",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": true,
            "espacio_dormitorio": true,
            "espacio_living": true,
            "descripcion": "vida util: 15000 horas",
            "energia_base_id": 6,
            "grupo_uso_id": 1,
            "cantidad_promedio": 13,
            "horas_uso_tipo": 15.8,
            "potencia_equipo": 13.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 38.02076029486563,
            "fuente": null
        },
			},
		}
```

### Paso 3

Indica si se desea editar los equipos al interior de la casa. 

<aside>
🔗

`../mi_casa_eficiente/equipos/<int:pk>`

</aside>

**GET** **:**  Entrega la información general del resultado. Presenta vectores de 8760 horas para cada componente de energía. Se pueden sumar dichos vectores para entregar un valor anualizado en kWh. También entrega un resumen de los equipos “pre-seleccionados” para la vivienda. 

**PUT :** El método PUT permite editar el valor de “edita_equipos”, para pasar de *false* a *true*.

```json
{
	"edita_equipos": true/false
}
```

### Paso 3.1

Edita los equipos a seleccionar en la vivienda. 

<aside>
🔗

`../mi_casa_eficiente/edita_equipos/<int:pk>`

</aside>

**GET** **:** Entrega la información general del resultado. Presenta vectores de 8760 horas para cada componente de energía. Se pueden sumar dichos vectores para entregar un valor anualizado en kWh. También entrega un resumen de los equipos “pre-seleccionados” para la vivienda. 

**PUT :** Inyección de datos de los equipos que se seleccionaran para la vivienda. Estos equipos deben ser todos los que quedan en la vivienda.

```json
{
"equipos_seleccionados": {
        "1": {
            "id": 1,
            "descripcion": "vida util: 15000 horas",
            "espacio_bahno": true,
            "nombre_equipo": "Ampolleta LED",
            "espacio_cocina": true,
            "espacio_living": true,
            "horas_uso_tipo": 15.8,
            "energia_base_id": 6,
            "potencia_equipo": 13.0,
            "espacio_exterior": false,
            "cantidad_promedio": 13,
            "eficiencia_equipo": 1.0,
            "espacio_dormitorio": true,
            "promedio_energia_anual": 28.938547078685815
        },
        "4": {
            "id": 4,
            "descripcion": "uso de 10 minutos al día",
            "espacio_bahno": false,
            "nombre_equipo": "Hervidor de agua",
            "espacio_cocina": true,
            "espacio_living": false,
            "horas_uso_tipo": 0.145205479,
            "energia_base_id": 6,
            "potencia_equipo": 2000.0,
            "espacio_exterior": false,
            "cantidad_promedio": 1,
            "eficiencia_equipo": 1.0,
            "espacio_dormitorio": false,
            "promedio_energia_anual": 20.98237636734543
        },
				...
				"26": {
            "id": 26,
            "descripcion": null,
            "espacio_bahno": false,
            "nombre_equipo": "Consola de Juegos",
            "espacio_cocina": false,
            "espacio_living": true,
            "horas_uso_tipo": 0.273972603,
            "energia_base_id": 6,
            "potencia_equipo": 120.0,
            "espacio_exterior": false,
            "cantidad_promedio": 1,
            "eficiencia_equipo": 1.0,
            "espacio_dormitorio": true,
            "promedio_energia_anual": 2.375363362340992
        },
        "27": {
            "id": 27,
            "descripcion": null,
            "espacio_bahno": true,
            "nombre_equipo": "Cargador Celular",
            "espacio_cocina": true,
            "espacio_living": true,
            "horas_uso_tipo": 3.0,
            "energia_base_id": 6,
            "potencia_equipo": 5.0,
            "espacio_exterior": false,
            "cantidad_promedio": 1,
            "eficiencia_equipo": 1.0,
            "espacio_dormitorio": true,
            "promedio_energia_anual": 1.0837595340680777
        }
   }
}
```

### Paso 4:

Paso de selección de las recomendaciones posibles en función de los equipos que tiene la vivienda y los que más consumen energía. 

<aside>
🔗

`../mi_casa_eficiente/recomendaciones/<int:pk>`

</aside>

**GET** **:** Entrega un listado de los grupos de recomendaciones y los consumos de energía anualizados en orden. Luego entrega una lista ordenada de las recomendaciones. La idea es que el “usuario” pueda seleccionar de estas opciones cual le interesa más. 

```json
HTTP 200 OK
Allow: GET, PUT, OPTIONS
Content-Type: application/json
Vary: Accept

[
    [
        [
            2,
            727.6802572552602
        ],
        [
            5,
            447.9862856093812
        ],
        [
            1,
            330.48814717844743
        ],
        [
            3,
            262.5682586579381
        ],
        [
            4,
            220.54069269208748
        ],
        [
            6,
            80.73635860688555
        ]
    ],
    {
        "Reduce tu consumo en calentar agua para ducha y cocina": [
            {
                "id": 16,
                "grupo_uso_id": 2,
                "grupo_uso": "Reduce tu consumo en calentar agua para ducha y cocina",
                "recomendacion": "Realizar el lavado de ropa con agua fría en vez de caliente",
                "inversion_id": 1,
                "inversion": "Nula",
                "ahorro_ee_id": null,
                "ahorro_ee": null
            },
            {
                "id": 15,
                "grupo_uso_id": 2,
                "grupo_uso": "Reduce tu consumo en calentar agua para ducha y cocina",
                "recomendacion": "Realizar el lavado de ropa a carga completa",
                "inversion_id": 1,
                "inversion": "Nula",
                "ahorro_ee_id": null,
                "ahorro_ee": null
            },
            ...
            {
                "id": 25,
                "grupo_uso_id": 4,
                "grupo_uso": "Reduce tu consumo en la cocina",
                "recomendacion": "Recambia tu horno por uno más eficiente",
                "inversion_id": 4,
                "inversion": "Alta",
                "ahorro_ee_id": null,
                "ahorro_ee": null
            }
        ],
        "Reduce tu consumo en ventilación y enfriamiento": [
            {
                "id": 27,
                "grupo_uso_id": 6,
                "grupo_uso": "Reduce tu consumo en ventilación y enfriamiento",
                "recomendacion": "Protege las ventas del sol",
                "inversion_id": 2,
                "inversion": "Baja",
                "ahorro_ee_id": null,
                "ahorro_ee": null
            },
        ]
    }
]
```

**PUT :** Se inyecta una lista de ID de las recomendaciones. 

```json
Ejemplo:
{
	"recomendaciones_id": [16, 15, 13, 1, 5, 3, 20]
}
```

### Paso 5: Resultados finales.

<aside>
🔗

`../mi_casa_eficiente/recomendaciones_select/<int:pk>`

</aside>

**GET** **:** Solo un *endpoint* que entrega un resumen de las elecciones de recomendaciones y un resumen de los consumos de energía. El resultado debería verse de esta forma: 

```json
HTTP 200 OK
Allow: GET, OPTIONS
Content-Type: application/json
Vary: Accept

{
    "id": 5,
    "id_comuna": 13115,
    "id_provincia": 131,
    "id_regional": 13,
    "zt": "D",
    "tipo_vivienda": 1,
    "superficie": 70,
    "dormitorios": 3,
    "anio_construccion": 2,
    "Resumen de consumos": {
        "elec": 2070.0,
        "gn": 0,
        "glp": 0,
        "ker": 0,
        "len": 0,
        "pel": 0
    },
    "Medidas seleccionadas": {
        "16": [
            {
                "id": 16,
                "grupo_uso_id": 2,
                "grupo_uso": "Reduce tu consumo en calentar agua para ducha y cocina",
                "recomendacion": "Realizar el lavado de ropa con agua fría en vez de caliente",
                "inversion_id": 1,
                "inversion": "Nula",
                "ahorro_ee_id": null,
                "ahorro_ee": null
            }
        ],
        "15": [
            {
                "id": 15,
                "grupo_uso_id": 2,
                "grupo_uso": "Reduce tu consumo en calentar agua para ducha y cocina",
                "recomendacion": "Realizar el lavado de ropa a carga completa",
                "inversion_id": 1,
                "inversion": "Nula",
                "ahorro_ee_id": null,
                "ahorro_ee": null
            }
        ],
        "13": [
            {
                "id": 13,
                "grupo_uso_id": 2,
                "grupo_uso": "Reduce tu consumo en calentar agua para ducha y cocina",
                "recomendacion": "Disminuye el tiempo en la ducha. No más de 8 minutos bastarán para una ducha eficiente. ",
                "inversion_id": 1,
                "inversion": "Nula",
                "ahorro_ee_id": null,
                "ahorro_ee": null
            }
        ],
        "1": [
            {
                "id": 1,
                "grupo_uso_id": 5,
                "grupo_uso": "Reduce tu consumo de equipos eléctricos",
                "recomendacion": "Evitar el consumo stand-by",
                "inversion_id": 1,
                "inversion": "Nula",
                "ahorro_ee_id": null,
                "ahorro_ee": null
            }
        ],
        "5": [
            {
                "id": 5,
                "grupo_uso_id": 5,
                "grupo_uso": "Reduce tu consumo de equipos eléctricos",
                "recomendacion": "Haz más eficiente tu consumo eléctrico, revisa cuanto tiempo usas estos equipos y reduce su uso en tiempos no necesarios. ",
                "inversion_id": 1,
                "inversion": "Nula",
                "ahorro_ee_id": null,
                "ahorro_ee": null
            }
        ],
        "3": [
            {
                "id": 3,
                "grupo_uso_id": 5,
                "grupo_uso": "Reduce tu consumo de equipos eléctricos",
                "recomendacion": "Cambio de tv a una más eficiente",
                "inversion_id": 2,
                "inversion": "Baja",
                "ahorro_ee_id": null,
                "ahorro_ee": null
            }
        ],
        "20": [
            {
                "id": 20,
                "grupo_uso_id": 1,
                "grupo_uso": "Reduce tu consumo en iluminación",
                "recomendacion": "Haz más eficiente el consumo de iluminación solo encendiendo las luces cuando sean estrictamente necesarias",
                "inversion_id": 1,
                "inversion": "Nula",
                "ahorro_ee_id": null,
                "ahorro_ee": null
            }
        ]
    }
}
```

## Pasos Adicionales

consulta de equipos completa: 

<aside>
🔗

`../mi_casa_eficiente/lista_equipos/`

</aside>

consulta de recomendaciones completa:

<aside>
🔗

`../mi_casa_eficiente/lista_recomendaciones/`

</aside>


## Consideraciones

- El paso 2.1 y 3.1 son opcionales. Si no los utilizas, la API generará recomendaciones basadas en datos promedio.
- Asegúrate de enviar los IDs correctos para los energéticos, tipos de vivienda y años de construcción.
- Revisa la respuesta de la API para obtener información detallada sobre las recomendaciones y la puntuación de consumo de energía.
- Existe una url swagger de documentación en el siguiente enlace: `../api/v1/swagger/`

## Ejemplo de flujo completo

1. Obtener ID de la comuna: Realiza una solicitud GET a `/mi_casa_eficiente/aux/get_comunas/` y busca el ID de tu comuna en la respuesta.
2. Enviar datos de la vivienda: Realiza una solicitud POST a `/mi_casa_eficiente/comunas/` con los datos de tu vivienda (incluyendo el ID de la comuna obtenido en el paso anterior).
3. Indicar si conoces tus consumos: Realiza una solicitud POST a `/mi_casa_eficiente/demanda/<int:pk>` con `{"conoce_consumos": true}` o `{"conoce_consumos": false}`.
4. (Opcional) Editar consumos: Si indicaste que conoces tus consumos, realiza una solicitud PUT a `/mi_casa_eficiente/edita_consumo/&lt;int:pk&gt;` con los datos de consumo.
5. Indicar si deseas editar equipos: Realiza una solicitud POST a `/mi_casa_eficiente/equipos/<int:pk>` con `{"edita_equipos": true}` o `{"edita_equipos": false}`.
6. (Opcional) Editar equipos: Si indicaste que deseas editar los equipos, realiza una solicitud PUT a `/mi_casa_eficiente/edita_equipos/<int:pk>` con los datos de los equipos.
7. Obtener recomendaciones: Realiza una solicitud GET a `/mi_casa_eficiente/recomendaciones/<int:pk>` para recibir las recomendaciones de eficiencia energética.

