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
Allow: POST, OPTIONS, GET
Content-Type: application/json
Vary: Accept

{
    "regiones": [
        {
            "nombre": "De Arica y Parinacota",
            "id_region": 15,
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

Agregamos otros consumos diferentes:

{
  "usa_elec": true,
  "usa_gn": true,
  "usa_glp": false,
  "usa_ker": true,
  "usa_len": false,
  "usa_pel": true,
  "con_elec": [100, 150, 100, 200, 220, 180, 260, 240, 200, 180, 130, 110],
  "con_gn": [5, 4, 5, 6, 6, 7, 8, 9, 8, 6, 5, 5],
  "con_ker": [20],
  "con_pel": [100]
}


```
Importante destacar que el ingreso de consumos de energéticos serán en función de sus unidades, esdecir, para cada energético se tienen las siguientes caracteristicas: 

1. GLP: kg/año
2. GN: m3/mes
3. Kerosene: L/año
4. Pellet: kg/año
5. Leña: m3st/año
6. Electricidad: kWh/mes

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
            "nombre_equipo": "Ampolleta LED",
            "grupo_uso_corto": "Iluminación",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": true,
            "espacio_dormitorio": true,
            "espacio_living": true,
            "subtitulo": "16% del consumo eléctrico en los hogares corresponde a iluminación.Una vivienda en el país posee en promedio. 13.2 luminarias y se utilizan en promedio por 15.8 horas diarias. con al menos una ampolleta encendida",
            "descripcion": "1.- Reemplazar luminarias existentes por tecnología LED. Las luminarias LED se caracterizan por un menor consumo energético y una vida útil significativamente más prolongada en comparación con las lámparas fluorescentes tradicionales. En este sentido. se recomienda la conversión a tecnología LED para optimizar el rendimiento lumínico y reducir el impacto ambiental.\r\n\r\nDATO: Las ampolletas LED pueden tener 15000 horas de vida útil y el menor consumo comparado. pudiendo ahorrar hasta un 87% respecto a la incandescentes.\r\n\r\n2.- Instalar sensores de luz natural para control de iluminación interior. Instalar controladores de iluminación mediante fotoceldas (automatizan el encendido y apagado en función de la iluminación natural con la que cuente el recinto). Este control permite reducir el tiempo de encendido de la luz artificial. cuando la luz natural es capaz de iluminar adecuadamente el espacio. Las metodologías de control se pueden aplicar a cualquier espacio de un edificio con luz natural. Las luces pueden ser ajustadas de forma gradual o bien encendido o apagado.\r\n\r\n3.- Instalar sistemas de sensor de detección de movimientos. Estos sensores detectan movimiento. con el cual automáticamente encienden las luces. mantienen encendida la iluminación mientras se encuentra el espacio ocupado. y las apagan cuando el recinto queda sin ocupantes.",
            "etiqueta": true,
            "energia_base_id": 6,
            "grupo_uso_id": 1,
            "cantidad_promedio": 10,
            "horas_uso_tipo": 15.8,
            "potencia_equipo": 13.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 38.020760294862086,
            "fuente": null
        },
        "4": {
            "id": 4,
            "nombre_equipo": "Hervidor de agua",
            "grupo_uso_corto": "Electrodomésticos",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": false,
            "espacio_dormitorio": false,
            "espacio_living": false,
            "subtitulo": "El 4% del consumo eléctrico de los hogares es atribuible al uso de hervidores de agua",
            "descripcion": "1.- Usar termo para almacenar el agua caliente. De esta formase evita usar el hervidor de aguas varias veces al dia.\r\n2.- Desenchufar aparatos usando por ejemplo alargadores de tipo corta corriente o enchufe inteligente (certificados por la SEC). ",
            "etiqueta": false,
            "energia_base_id": 6,
            "grupo_uso_id": 4,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 0.145205479,
            "potencia_equipo": 2000.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 27.56758658650836,
            "fuente": null
        },
        "5": {
            "id": 5,
            "nombre_equipo": "Microondas",
            "grupo_uso_corto": "Cocina",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": false,
            "espacio_dormitorio": false,
            "espacio_living": false,
            "subtitulo": "El 1% del consumo eléctrico de los hogares es atribuible al uso de microondas",
            "descripcion": "1.- Preferir artefactos con etiqueta de eficiencia energética. ​\r\n2.- Elimine o desenchufe el artefacto no utilizado y reemplace el equipo antiguo por una versión más eficiente energéticamente. con el fin de reducir la densidad de potencia de carga por enchufe\r\n3.- Elija la capacidad en función de su situación: uno de 20L es perfecto para parejas o solteros. mientras que uno de 40L es más cómodo para un uso familiar: un microondas de gran capacidad permite calentar varios alimentos simultáneamente.\r\n4.- Es mucho más económico calentar un plato en el microondas que en el horno o en tu placa eléctrica. Si quieres calentar algo más grande. ocurre lo contrario: a un microondas le costará mucho más penetrar hasta el corazón del alimento para calentarlo. mientras que el calor de un horno lo alcanzará más fácilmente.\r\n5.- Limpia el microondas con regularidad para eliminar los restos de comida",
            "etiqueta": true,
            "energia_base_id": 6,
            "grupo_uso_id": 4,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 0.060273973,
            "potencia_equipo": 1500.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 8.582361861837509,
            "fuente": null
        },
        "6": {
            "id": 6,
            "nombre_equipo": "Secador de Pelo",
            "grupo_uso_corto": "Electrodomésticos",
            "espacio_exterior": false,
            "espacio_cocina": false,
            "espacio_bahno": true,
            "espacio_dormitorio": false,
            "espacio_living": false,
            "subtitulo": null,
            "descripcion": "Desenchufar aparatos usando por ejemplo alargadores de tipo corta corriente o enchufe inteligente (certificados por la SEC). ",
            "etiqueta": true,
            "energia_base_id": 6,
            "grupo_uso_id": 5,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 0.054794521,
            "potencia_equipo": 1500.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 7.802147147125007,
            "fuente": null
        },
        "7": {
            "id": 7,
            "nombre_equipo": "Plancha",
            "grupo_uso_corto": "Electrodomésticos",
            "espacio_exterior": false,
            "espacio_cocina": false,
            "espacio_bahno": false,
            "espacio_dormitorio": true,
            "espacio_living": true,
            "subtitulo": "La plancha es uno de los electrodomésticos con mayor potencia.",
            "descripcion": "1.- Preferir planchar cuando se acumulen varias prendas.\r\n2.- Desenchufar aparatos usando por ejemplo alargadores de tipo corta corriente o enchufe inteligente (certificados por la SEC). ",
            "etiqueta": false,
            "energia_base_id": 6,
            "grupo_uso_id": 5,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 0.175342466,
            "potencia_equipo": 1000.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 16.644580580533347,
            "fuente": null
        },
        "8": {
            "id": 8,
            "nombre_equipo": "Lavadora",
            "grupo_uso_corto": "Electrodomésticos",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": true,
            "espacio_dormitorio": false,
            "espacio_living": false,
            "subtitulo": "El 1.6% del consumo eléctrico de los hogares es atribuible al uso delavadoras de ropa",
            "descripcion": "1.- Use su máquina sólo cuando esté llena. \r\n2.- Lavar a baja temperatura si es posible (20-30°C). De esta forma proteges tanto el medio ambiente como tu ropa. \r\n3.- No es necesario el prelavado.\r\n4.- Selecciona el programa económico. aunque dure más. El programa rápido consume mucha más electricidad y agua.\r\n5.- No aumente la dosis de detergente para ropa a bajas temperaturas. la ropa no quedará más limpia.\r\n6.- Limpia periódicamente el cajón de la lavadora. así como los filtros y la junta del tambor. Esto extiende la vida útil de su máquina.",
            "etiqueta": true,
            "energia_base_id": 6,
            "grupo_uso_id": 5,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 0.365296804,
            "potencia_equipo": 330.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 11.443149149116678,
            "fuente": null
        },
        "9": {
            "id": 9,
            "nombre_equipo": "Televisor",
            "grupo_uso_corto": "Electrodomésticos",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": false,
            "espacio_dormitorio": true,
            "espacio_living": true,
            "subtitulo": "El 16.3% del consumo eléctrico de los hogares es atribuible al uso de televisores. Apague completamente los dispositivos conectados a Internet o a la red WLAN. como módems. enrutadores. decodificadores de TV. televisores. impresoras y otros dispositivos inteligentes. Incluso en modo de espera. consumen mucha más energía que los dispositivos desconectados.",
            "descripcion": "1.- Apague siempre su televisor por completo. La forma más sencilla es utilizar un interruptor de apagado o una regleta.\r\n2.- Atenúe las luces de la habitación y reduzca el brillo de la pantalla.  Si se activa la función de ajuste automático del brillo de la pantalla a la luz ambiental. este equilibrio se realizará de forma automática.\r\n3.- Desactive la función HDR (alto rango dinámico). Esta función acentúa los colores y los contrastes. Puede aumentar el consumo de electricidad en un 70% (CH).\r\n4.- Apague la pantalla cuando escuche música a través de su televisor.",
            "etiqueta": true,
            "energia_base_id": 6,
            "grupo_uso_id": 5,
            "cantidad_promedio": 2,
            "horas_uso_tipo": 9.506849315,
            "potencia_equipo": 100.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 90.24483533507924,
            "fuente": null
        },
        "13": {
            "id": 13,
            "nombre_equipo": "Termoventilador",
            "grupo_uso_corto": "Calefacción",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": true,
            "espacio_dormitorio": true,
            "espacio_living": true,
            "subtitulo": "El 4.4% del consumo de electricidad de los hogares es atribuible calefacción. Los termoventiladores son efectivos para usos cortos y en espacios muy pequeños (no mas de 9 metros cuadrados).",
            "descripcion": "1.- En invierno. ajuste el termostato del equipo entre 18-22 grados. Cuanto más calefaccionado estes estés. más aumentará el consumo de energía. Cada grado de aumento sube aproximadamente un 7% la cuenta de energía electrica. \r\n2.- Cierre todas las ventanas cuando el aire acondicionado esté funcionando.\r\n3.- No climatizar espacios no utilizados de la casa.\r\n4.- Asegúrese de que el aire pueda circular libremente por los espacios que se quiere climatizar.",
            "etiqueta": false,
            "energia_base_id": 6,
            "grupo_uso_id": 3,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 0.52,
            "potencia_equipo": 2000.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 98.72316856828843,
            "fuente": null
        },
        "18": {
            "id": 18,
            "nombre_equipo": "Cocina a gas natural",
            "grupo_uso_corto": "Cocina",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": false,
            "espacio_dormitorio": false,
            "espacio_living": false,
            "subtitulo": "El 12% del consumo de GN/GLP de los hogares es atribuible a la cocción de los alimentos (horno y cocina).",
            "descripcion": "1.- Tapar las cacerolas cuando se cocina: esto ayuda a que los alimentos se cocinen más rápidamente.\r\n2.- Un buen mantenimiento de sus equipos es una forma eficaz de mejorar su rendimiento y prolongar su vida útil\r\n3.- Una de las formas más sencillas de reducir el consumo de energía en la cocina es utilizar una cacerola del tamaño adecuado. Cuando se utiliza una cacerola demasiado grande para la cantidad de alimentos que se van a cocinar. gran parte del calor se disipa en el aire en lugar de transferirse eficazmente a los alimentos.",
            "etiqueta": false,
            "energia_base_id": 2,
            "grupo_uso_id": 4,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 0.078386606,
            "potencia_equipo": 12000.0,
            "eficiencia_equipo": 0.6,
            "promedio_energia_anual": 67.55061535786986,
            "fuente": null
        },
        "19": {
            "id": 19,
            "nombre_equipo": "Horno a gas natural",
            "grupo_uso_corto": "Cocina",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": false,
            "espacio_dormitorio": false,
            "espacio_living": false,
            "subtitulo": "El 12% del consumo de GN/GLP de los hogares es atribuible a la cocción de los alimentos (horno y cocina).",
            "descripcion": "1.- Prepare varios platos simultáneamente para utilizar todo el volumen del horno. Los aromas no se mezclan.\r\n2.- Olvídese del precalentamiento para ahorrar un 20% de energía. Sólo unos pocos platos. como los soufflés. funcionan mejor en un horno precalentado. Ahorre aún más energía utilizando la función de calor del ventilador en lugar del calor superior o inferior.\r\n3.- Abra la puerta del horno sólo cuando sea absolutamente necesario.\r\n4.- Apagar el horno cinco minutos antes de finalizar la cocción para aprovechar el calor residual.",
            "etiqueta": false,
            "energia_base_id": 2,
            "grupo_uso_id": 4,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 0.182648402,
            "potencia_equipo": 2500.0,
            "eficiencia_equipo": 0.6,
            "promedio_energia_anual": 32.79156085333488,
            "fuente": null
        },
        "20": {
            "id": 20,
            "nombre_equipo": "Refrigerador",
            "grupo_uso_corto": "Electrodomésticos",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": false,
            "espacio_dormitorio": false,
            "espacio_living": false,
            "subtitulo": "Los refrigeradores y congeladores están presentes en todos los hogares y consumen energía las 24 horas del día. por lo que es necesario asegurar su eficiencia energética a la hora de adquirirlos. 5% del consumo energético en los hogares corresponde a refrigeración de alimentos (refrigerador y freezer). ",
            "descripcion": "1.- Coloque su congelador en la habitación más fresca porque el consumo de electricidad depende principalmente de la temperatura ambiente. Deje suficiente espacio en la parte posterior del dispositivo para garantizar la disipación de calor del compresor y las aletas de refrigeración.\r\n2.- Deje que los alimentos calientes se enfríen antes de colocarlos en el refrigerador o congelador.\r\n3.- Ajusta la temperatura de tu frigorífico a 7°C. Para un congelador. -15°C es suficiente.\r\n4.- Coloque los alimentos a descongelar en su frigorífico. Esto ayuda a enfriar el interior del dispositivo.\r\n5.- Limpie los sellos de las puertas con regularidad. Las puertas con goteras provocan pérdida de energía.\r\n6.- No coloque el refrigerador (ni ningún otro aparato de refrigeración) cerca de fuentes de calor en su cocina. ",
            "etiqueta": true,
            "energia_base_id": 6,
            "grupo_uso_id": 4,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 24.0,
            "potencia_equipo": 50.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 104.80884334304594,
            "fuente": null
        },
        "23": {
            "id": 23,
            "nombre_equipo": "Estufa Parafina",
            "grupo_uso_corto": "Calefacción",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": false,
            "espacio_dormitorio": true,
            "espacio_living": true,
            "subtitulo": "53% del consumo total de energía en los hogares corresonden a calefacción y climatización. \r\nDATO: Una mayor aislación mejora considerablemente el confort térmico interior y y el gasto en climatización",
            "descripcion": "1.- En invierno. ajuste el termostato del equipo entre 18-22 grados. Cuanto más calefaccionado estes estés. más aumentará el consumo de energía. Cada grado de aumento sube aproximadamente un 7% la cuenta de energía electrica. \r\n2.- Mantenga ventilado para equipos de combustión.\r\n3.- No climatizar espacios no utilizados de la casa.\r\n4.- Asegúrese de que el aire pueda circular libremente por los espacios que se quiere climatizar.\r\n5.-Recuerda limpiar periódicamente las regillas",
            "etiqueta": false,
            "energia_base_id": 3,
            "grupo_uso_id": 3,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 0.52,
            "potencia_equipo": 3000.0,
            "eficiencia_equipo": 0.85,
            "promedio_energia_anual": 257.9999999999852,
            "fuente": null
        },
        "26": {
            "id": 26,
            "nombre_equipo": "Aspiradora",
            "grupo_uso_corto": "Electrodomésticos",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": true,
            "espacio_dormitorio": true,
            "espacio_living": true,
            "subtitulo": "El 1% del consumo eléctrico de los hogares es atribuible al uso de la aspiradora.",
            "descripcion": "Desenchufar aparatos usando por ejemplo alargadores de tipo corta corriente o enchufe inteligente (certificados por la SEC).",
            "etiqueta": false,
            "energia_base_id": 6,
            "grupo_uso_id": 5,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 0.269863014,
            "potencia_equipo": 2000.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 51.23409959945422,
            "fuente": null
        },
        "28": {
            "id": 28,
            "nombre_equipo": "Cargador Celular",
            "grupo_uso_corto": "Electrodomésticos",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": true,
            "espacio_dormitorio": true,
            "espacio_living": true,
            "subtitulo": null,
            "descripcion": "Desenchufar aparatos usando por ejemplo alargadores de tipo corta corriente o enchufe inteligente (certificados por la SEC). \r\nElimine o desenchufe el artefacto no utilizado y reemplace el equipo antiguo por una versión más eficiente energéticamente. con el fin de reducir la densidad de potencia de carga por enchufe (reducir un 25% desde la línea de base).\r\nDesconexión de equipos que no se estén usando. y reducir la cantidad de equipos privilegiando compartirlos.",
            "etiqueta": false,
            "energia_base_id": 6,
            "grupo_uso_id": 5,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 3.0,
            "potencia_equipo": 5.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 1.4238918543503138,
            "fuente": null
        },
        "29": {
            "id": 29,
            "nombre_equipo": "Ventilador",
            "grupo_uso_corto": "Enfriamiento",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": false,
            "espacio_dormitorio": true,
            "espacio_living": true,
            "subtitulo": "DATO: Una mayor aislación mejora considerablemente el confort térmico interior y y el gasto en climatización",
            "descripcion": "1.- En verano. baje la temperatura ambiente a 22-24 grados. Cuanto más frío estés. más aumentará el consumo de energía. Bastará con bajar 2 a 4 ghrados de la temperatura ambiente para setir confortable el ambiente. \r\n2.- Cierre todas las ventanas cuando el aire acondicionado esté funcionando.\r\n3.- No climatizar habitaciones no utilizadas.\r\n4.- Asegúrese de que el aire pueda circular libremente.\r\n5.- Limpiar periódicamente los filtros y evaporadores y drenar el agua de condensación.\r\n6.- Enfríe su hogar con acciones simples en lugar de un aire acondicionado: desenchufe todos los electrodomésticos que no utilice y apague las lámparas. \r\n7.- Tapa el acceso del sol con cortinas tipo Blackoutcuando el sol calienta la fachada. \r\n8.- No abra la ventana cuando ya haga calor y. idealmente. ventile sólo temprano en la mañana. antes del amanecer.",
            "etiqueta": false,
            "energia_base_id": 6,
            "grupo_uso_id": 6,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 0.52,
            "potencia_equipo": 55.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 2.7148871356279316,
            "fuente": null
        },
        "30": {
            "id": 30,
            "nombre_equipo": "Equipo Musical",
            "grupo_uso_corto": "Electrodomésticos",
            "espacio_exterior": false,
            "espacio_cocina": true,
            "espacio_bahno": false,
            "espacio_dormitorio": true,
            "espacio_living": true,
            "subtitulo": "Apague completamente los dispositivos conectados a Internet o a la red WLAN. como módems. enrutadores. decodificadores de TV. televisores. impresoras y otros dispositivos inteligentes. Incluso en modo de espera. consumen mucha más energía que los dispositivos desconectados.",
            "descripcion": "1.- Tómese el tiempo para familiarizarse con las funciones de sus dispositivos y habilite la configuración de ahorro de energía.\r\n2.- Conecte todos sus dispositivos electrónicos de ocio (televisión. decodificador. DVD. sistema HiFi. videoconsola) en el mismo alargador equipado con un interruptor. Cuando no los estés usando. puedes apagarlos todos a la vez. Por ejemplo durante la noche o de vacaciones.\r\n3.- Instale un alargador inteligente que pueda controlar y programar de forma remota a través de una aplicación. ",
            "etiqueta": false,
            "energia_base_id": 6,
            "grupo_uso_id": 5,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 8.5,
            "potencia_equipo": 50.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 40.343602539925556,
            "fuente": null
        },
        "39": {
            "id": 39,
            "nombre_equipo": "Frazada eléctrica",
            "grupo_uso_corto": "Electrodomésticos",
            "espacio_exterior": false,
            "espacio_cocina": false,
            "espacio_bahno": false,
            "espacio_dormitorio": true,
            "espacio_living": false,
            "subtitulo": null,
            "descripcion": "Desenchufar aparatos usando por ejemplo alargadores de tipo corta corriente o enchufe inteligente (certificados por la SEC). ",
            "etiqueta": false,
            "energia_base_id": 6,
            "grupo_uso_id": 5,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 0.5,
            "potencia_equipo": 100.0,
            "eficiencia_equipo": 1.0,
            "promedio_energia_anual": 4.746306181167713,
            "fuente": null
        },
        "43": {
            "id": 43,
            "nombre_equipo": "Calefont GN",
            "grupo_uso_corto": "Agua Caliente",
            "espacio_exterior": true,
            "espacio_cocina": true,
            "espacio_bahno": false,
            "espacio_dormitorio": false,
            "espacio_living": false,
            "subtitulo": "El 58.9% del consumo de GN+GLP de los hogares es atribuible a ACS\r\nEl sello verde es un sello de seguridadde instalaciones interiores de gas. este certifica que las instalaciones son seguras. La aprobacion debe renovarse cada 2 años. ",
            "descripcion": "1.- Instalar en lugares ventilados para un buen funcionamiento\r\n2.- La instalación y mantencióndebe ser realizada por inistaladores autorizados SEC\r\n3.- La Temperatura del agua se regula desde el calefon y no desde la llave",
            "etiqueta": true,
            "energia_base_id": 2,
            "grupo_uso_id": 2,
            "cantidad_promedio": 1,
            "horas_uso_tipo": 0.309352438,
            "potencia_equipo": 17700.0,
            "eficiencia_equipo": 0.7,
            "promedio_energia_anual": 458.753936338155,
            "fuente": null
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

2do Ejemplo (con mas consejos seleccionados):

{
	"recomendaciones_id": [1, 5, 3, 6, 22, 23, 9, 12, 16, 19, 27]
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


# Creación de Etiqueta tipo

<aside>
🔗

`../mi_casa_eficiente/resultados/<int:pk>`

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

