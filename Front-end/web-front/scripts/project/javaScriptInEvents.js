const scriptsInEvents = {

	async EventSheet7_Event3(runtime, localVars)
	{
const apiUrl = runtime.globalVars.url_end_point;


async function fetchData(url, method, _data) {
    try {
        
        var jsonData = null;
        
        if(_data != null){
            jsonData = JSON.stringify(_data);
        }
        
        const response = await fetch(apiUrl + url, {
            method: method,
            headers: {
                "Content-Type": "application/json", // Especifica que esperas un JSON como respuesta
            },
             body: jsonData
        });

        // Verifica si la respuesta fue exitosa
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }


        console.log(response); 
        
        
        // Convierte la respuesta a JSON
        const data = await response.json();
        //console.log("Datos recibidos:", data); // Imprime los datos en consola
        return data; // Devuelve los datos
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        return null; // En caso de error, devuelve null o maneja el error segГєn tu lГіgica
    }
}


var _data = {
        id_comuna: runtime.globalVars.a_comuna_id, 
        clima: runtime.globalVars.a_tipo_clima,
        tipo_vivienda: runtime.globalVars.a_tipo_vivienda,
        n_pisos: runtime.globalVars.a_casa_pisos,
        ultimo_piso: runtime.globalVars.a_ultimo_piso  == 1 ? true : false,
        conoce_superficie: runtime.globalVars.a_conoce_superficie  == 1 ? true : false,
        superficie: runtime.globalVars.a_superficie,
        anio_construccion: runtime.globalVars.a_anio_construccion,
        usa_elec: runtime.globalVars.a_usa_elec == 1 ? true : false,
        usa_gn: runtime.globalVars.a_usa_gn == 1 ? true : false,
        usa_glp: runtime.globalVars.a_usa_glp == 1 ? true : false,
        usa_ker: runtime.globalVars.a_usa_ker == 1 ? true : false,
        usa_len: runtime.globalVars.a_usa_len == 1 ? true : false,
        usa_pel: runtime.globalVars.a_usa_pel == 1 ? true : false
    };
    
    if(runtime.globalVars.a_conoce_superficie == 0 || runtime.globalVars.a_conoce_superficie == false){
		_data = {
			id_comuna: runtime.globalVars.a_comuna_id, 
			clima: runtime.globalVars.a_tipo_clima,
			tipo_vivienda: runtime.globalVars.a_tipo_vivienda,
			n_pisos: runtime.globalVars.a_casa_pisos,
			ultimo_piso: runtime.globalVars.a_ultimo_piso  == 1 ? true : false,
			conoce_superficie: runtime.globalVars.a_conoce_superficie  == 1 ? true : false,
			dormitorio: runtime.globalVars.a_dormitorios,
			anio_construccion: runtime.globalVars.a_anio_construccion,
			usa_elec: runtime.globalVars.a_usa_elec == 1 ? true : false,
			usa_gn: runtime.globalVars.a_usa_gn == 1 ? true : false,
			usa_glp: runtime.globalVars.a_usa_glp == 1 ? true : false,
			usa_ker: runtime.globalVars.a_usa_ker == 1 ? true : false,
			usa_len: runtime.globalVars.a_usa_len == 1 ? true : false,
			usa_pel: runtime.globalVars.a_usa_pel == 1 ? true : false
		};
	}
    
    
    fetchData("/comunas/?format=json", "POST", _data).then((data) => {
		if (data) {

			console.log(data);

			runtime.globalVars.a_consumo_id = data.id;
			runtime.globalVars.a_consumo_elec = data.consumo_elec;
			runtime.globalVars.a_consumo_gn = data.consumo_gn;
			runtime.globalVars.a_consumo_glp = data.consumo_glp;
			runtime.globalVars.a_consumo_ker = data.consumo_ker;
			runtime.globalVars.a_consumo_len = data.consumo_len;
			runtime.globalVars.a_consumo_pel = data.consumo_pel;

			if (Number.isNaN(runtime.globalVars.a_consumo_elec)) {
				runtime.globalVars.a_consumo_elec = 0;
			}
			if (Number.isNaN(runtime.globalVars.a_consumo_gn)) {
				runtime.globalVars.a_consumo_gn = 0;
			}
			if (Number.isNaN(runtime.globalVars.a_consumo_glp)) {
				runtime.globalVars.a_consumo_glp = 0;
			}
			if (Number.isNaN(runtime.globalVars.a_consumo_ker)) {
				runtime.globalVars.a_consumo_ker = 0;
			}
			if (Number.isNaN(runtime.globalVars.a_consumo_len)) {
				runtime.globalVars.a_consumo_len = 0;
			}
			if (Number.isNaN(runtime.globalVars.a_consumo_pel)) {
				runtime.globalVars.a_consumo_pel = 0;
			}
		}
		
		runtime.callFunction("FunctionUpdateConsumos");
		
		fetchData("/demanda/" + runtime.globalVars.a_consumo_id, "GET").then((data) => {
		if (data) {

			console.log(data);
		}
});

});
	},

	async EventSheet8_Event2(runtime, localVars)
	{
const apiUrl = runtime.globalVars.url_end_point;


async function fetchData(url, method, _data) {
    try {
        
        var jsonData = null;
        
        if(_data != null){
            jsonData = JSON.stringify(_data);
        }
        
        const response = await fetch(apiUrl + url, {
            method: method,
            headers: {
                "Content-Type": "application/json", // Especifica que esperas un JSON como respuesta
            },
             body: jsonData
        });

        // Verifica si la respuesta fue exitosa
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }


         console.log(response); 
        
        
        // Convierte la respuesta a JSON
        const data = await response.json();
        
        
        // Convierte la respuesta a JSON
       // const data = await response.json();
        //console.log("Datos recibidos:", data); // Imprime los datos en consola
        return response; // Devuelve los datos
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        return null; // En caso de error, devuelve null o maneja el error segГєn tu lГіgica
    }
}

//runtime.globalVars.a_consumo_id = 38;

var _data = {
        conoce_consumos: true,
    };
    
    
    fetchData("/demanda/" + runtime.globalVars.a_consumo_id, "PUT", _data).then((data) => {

});


	},

	async EventSheet9_Event3(runtime, localVars)
	{
const apiUrl = runtime.globalVars.url_end_point;


async function fetchData(url, method, _data) {
    try {
        
        var jsonData = null;
        
        if(_data != null){
            jsonData = JSON.stringify(_data);
        }
        
        const response = await fetch(apiUrl + url, {
            method: method,
            headers: {
                "Content-Type": "application/json", // Especifica que esperas un JSON como respuesta
            },
             body: jsonData
        });

        // Verifica si la respuesta fue exitosa
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }


        console.log(response); 
        
        
        // Convierte la respuesta a JSON
        const data = await response.json();
        //console.log("Datos recibidos:", data); // Imprime los datos en consola
        return data; // Devuelve los datos
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        return null; // En caso de error, devuelve null o maneja el error segГєn tu lГіgica
    }
}


var _data = {
        usa_elec: runtime.globalVars.a_usa_elec==1? true : false,
        usa_gn: runtime.globalVars.a_usa_gn==1? true : false,
        usa_glp: runtime.globalVars.a_usa_glp==1? true : false,
        usa_ker: runtime.globalVars.a_usa_ker==1? true : false,
        usa_len: runtime.globalVars.a_usa_len==1? true : false,
        usa_pel: runtime.globalVars.a_usa_pel==1? true : false,
		con_elec: [runtime.globalVars.a_consumo_mes1,runtime.globalVars.a_consumo_mes2,runtime.globalVars.a_consumo_mes3,runtime.globalVars.a_consumo_mes4,runtime.globalVars.a_consumo_mes5,runtime.globalVars.a_consumo_mes6,runtime.globalVars.a_consumo_mes7,runtime.globalVars.a_consumo_mes8,runtime.globalVars.a_consumo_mes9,runtime.globalVars.a_consumo_mes10,runtime.globalVars.a_consumo_mes11,runtime.globalVars.a_consumo_mes12]
    };
    
    
    fetchData("/edita_consumo/" + runtime.globalVars.a_consumo_id, "PUT", _data).then((data) => {
		if (data) {

			console.log(data);
			
			

		}
});


	},

	async EventSheet10_Event4(runtime, localVars)
	{
const apiUrl = runtime.globalVars.url_end_point;


async function fetchData(url, method, _data) {
    try {
        
        var jsonData = null;
        
        if(_data != null){
            jsonData = JSON.stringify(_data);
        }
        
        const response = await fetch(apiUrl + url, {
            method: method,
            headers: {
                "Content-Type": "application/json", // Especifica que esperas un JSON como respuesta
            },
             body: jsonData
        });

        // Verifica si la respuesta fue exitosa
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }


        console.log(response); 
        
        
        // Convierte la respuesta a JSON
        const data = await response.json();
        //console.log("Datos recibidos:", data); // Imprime los datos en consola
        return data; // Devuelve los datos
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        return null; // En caso de error, devuelve null o maneja el error segГєn tu lГіgica
    }
}

var suma_gn = runtime.globalVars.a_consumo_mes1GN + runtime.globalVars.a_consumo_mes2GN + runtime.globalVars.a_consumo_mes3GN + runtime.globalVars.a_consumo_mes4GN + runtime.globalVars.a_consumo_mes5GN + runtime.globalVars.a_consumo_mes6GN + runtime.globalVars.a_consumo_mes7GN + runtime.globalVars.a_consumo_mes8GN + runtime.globalVars.a_consumo_mes9GN + runtime.globalVars.a_consumo_mes10GN + runtime.globalVars.a_consumo_mes11GN + runtime.globalVars.a_consumo_mes12GN;

if(suma_gn < 1){
   // runtime.globalVars.a_usa_gn = 0;
}

if(runtime.globalVars.a_usa_gn == 1 && runtime.globalVars.a_consumo_gn < 1){
    runtime.globalVars.a_usa_gn = 0;
}

if(runtime.globalVars.a_usa_glp == 1 && runtime.globalVars.a_consumo_glp < 1){
    runtime.globalVars.a_usa_glp = 0;
}

if(runtime.globalVars.a_usa_ker == 1 && runtime.globalVars.a_consumo_ker < 1){
    runtime.globalVars.a_usa_ker = 0;
}

if(runtime.globalVars.a_usa_len == 1 && runtime.globalVars.a_consumo_len < 1){
    runtime.globalVars.a_usa_len = 0;
}

if(runtime.globalVars.a_usa_pel == 1 && runtime.globalVars.a_consumo_pel < 1){
    runtime.globalVars.a_usa_pel = 0;
}

var _data = {
        usa_elec: runtime.globalVars.a_usa_elec==1? true : false,
        usa_gn: runtime.globalVars.a_usa_gn==1? true : false,
        usa_glp: runtime.globalVars.a_usa_glp==1? true : false,
        usa_ker: runtime.globalVars.a_usa_ker==1? true : false,
        usa_len: runtime.globalVars.a_usa_len==1? true : false,
        usa_pel: runtime.globalVars.a_usa_pel==1? true : false
    };
	
	if(runtime.globalVars.a_usa_elec == 1){
		_data.con_elec = [runtime.globalVars.a_consumo_mes1Elec,runtime.globalVars.a_consumo_mes2Elec,runtime.globalVars.a_consumo_mes3Elec,runtime.globalVars.a_consumo_mes4Elec,runtime.globalVars.a_consumo_mes5Elec,runtime.globalVars.a_consumo_mes6Elec,runtime.globalVars.a_consumo_mes7Elec,runtime.globalVars.a_consumo_mes8Elec,runtime.globalVars.a_consumo_mes9Elec,runtime.globalVars.a_consumo_mes10Elec,runtime.globalVars.a_consumo_mes11Elec,runtime.globalVars.a_consumo_mes12Elec];
	}
	
	if(runtime.globalVars.a_usa_gn == 1){
		_data.con_gn = [runtime.globalVars.a_consumo_mes1GN,runtime.globalVars.a_consumo_mes2GN,runtime.globalVars.a_consumo_mes3GN,runtime.globalVars.a_consumo_mes4GN,runtime.globalVars.a_consumo_mes5GN,runtime.globalVars.a_consumo_mes6GN,runtime.globalVars.a_consumo_mes7GN,runtime.globalVars.a_consumo_mes8GN,runtime.globalVars.a_consumo_mes9GN,runtime.globalVars.a_consumo_mes10GN,runtime.globalVars.a_consumo_mes11GN,runtime.globalVars.a_consumo_mes12GN];
	}
	
	if(runtime.globalVars.a_usa_glp == 1){
		_data.con_glp = [runtime.globalVars.a_consumo_glp];
	}
	
	if(runtime.globalVars.a_usa_ker == 1){
		_data.con_ker = [runtime.globalVars.a_consumo_ker];
	}
	
	if(runtime.globalVars.a_usa_len == 1){
		_data.con_len = [runtime.globalVars.a_consumo_len];
	}
	
	if(runtime.globalVars.a_usa_pel == 1){
		_data.con_pel = [runtime.globalVars.a_consumo_pel];
	}
    
    
    fetchData("/edita_consumo/" + runtime.globalVars.a_consumo_id, "PUT", _data).then((data) => {
		if (data) {

			console.log(data);


var _data2 = {
        edita_equipos: true
    };
			
			fetchData("/equipos/" + runtime.globalVars.a_consumo_id, "PUT", _data2).then((data) => {
				if (data) {

					console.log(data);
				}
		});

			
		}
});


	},

	async EventSheet10_Event7(runtime, localVars)
	{
		const iframe = document.getElementById('miIframe').contentWindow;
		iframe.postMessage(".", "*");
		
	},

	async EventSheet12_Event6(runtime, localVars)
	{
const apiUrl = runtime.globalVars.url_end_point;


async function fetchData(url, method, _data) {
    try {
        
        var jsonData = null;
        
        if(_data != null){
            jsonData = JSON.stringify(_data);
        }
        
        const response = await fetch(apiUrl + url, {
            method: method,
            headers: {
                "Content-Type": "application/json", // Especifica que esperas un JSON como respuesta
            },
             body: jsonData
        });

        // Verifica si la respuesta fue exitosa
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }


        console.log(response); 
        
        
        // Convierte la respuesta a JSON
        const data = await response.json();
        //console.log("Datos recibidos:", data); // Imprime los datos en consola
        return data; // Devuelve los datos
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        return null; // En caso de error, devuelve null o maneja el error segГєn tu lГіgica
    }
}

//runtime.globalVars.IdSeleccionados = "1, 3, 20";
//runtime.globalVars.a_consumo_id = 141;


let idsArray = runtime.globalVars.IdSeleccionados
    .replace(/,$/, '') // Elimina la coma final si existe
    .split(',')        // Divide la cadena en un array
    .map(id => parseInt(id.trim())) // Convierte cada elemento en número
    .filter(Number.isInteger); // Filtra valores no numéricos

// Paso 2: Serializar el resultado en JSON
let _data = { recomendaciones_id: idsArray };
	
    
    fetchData("/recomendaciones/" + runtime.globalVars.a_consumo_id, "PUT", _data).then((data) => {
		if (data) {

			console.log(data);
			

            fetchData("/recomendaciones_select/" + runtime.globalVars.a_consumo_id, "GET").then((data2) => {
                if (data2) {

                    
                    recorrerJSONFinal(data2);
                }
        });


		}
});


function recorrerJSONFinal(data) {

    runtime.globalVars.ahorro_energetico_promedio = parseInt(data.Ahorro_medidas.ahorro_energetico_promedio);
    runtime.globalVars.KWhAnualMejora = runtime.globalVars.KWhAnual - runtime.globalVars.ahorro_energetico_promedio;

    runtime.globalVars.ahorro_porcentaje_consumo_calefaccion = parseInt((data["Resumen_desempeno"]["Calefacción"]["suma_energia"] / runtime.globalVars.KWhAnual) * 100);

    runtime.globalVars.ahorro_porcentaje_consumo_agua = parseInt((data["Resumen_desempeno"]["Agua Caliente"]["suma_energia"] / runtime.globalVars.KWhAnual) * 100);

    runtime.globalVars.ahorro_porcentaje_consumo_electrodomestico = parseInt((data["Resumen_desempeno"]["Electrodomésticos"]["suma_energia"] / runtime.globalVars.KWhAnual) * 100);

    runtime.globalVars.ahorro_porcentaje_consumo_enfriamiento = parseInt((data["Resumen_desempeno"]["Enfriamiento"]["suma_energia"] / runtime.globalVars.KWhAnual) * 100);

    runtime.globalVars.ahorro_porcentaje_consumo_cocina = parseInt((data["Resumen_desempeno"]["Cocina"]["suma_energia"] / runtime.globalVars.KWhAnual) * 100);

    runtime.globalVars.ahorro_porcentaje_consumo_iluminacion = parseInt((data["Resumen_desempeno"]["Iluminación"]["suma_energia"] / runtime.globalVars.KWhAnual) * 100);


    runtime.globalVars.ahorro_promedio_monetario = parseInt(data["Ahorro_medidas"]["ahorro_promedio_monetario"]);

    runtime.callFunction("ActualizarBarra");
}

	},

	async EventSheet11_Event24(runtime, localVars)
	{
const apiUrl = runtime.globalVars.url_end_point;


async function fetchData(url, method, _data) {
    try {
        
        var jsonData = null;
        
        if(_data != null){
            jsonData = JSON.stringify(_data);
        }
        
        const response = await fetch(apiUrl + url, {
            method: method,
            headers: {
                "Content-Type": "application/json", // Especifica que esperas un JSON como respuesta
            },
             body: jsonData
        });

        // Verifica si la respuesta fue exitosa
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }


        //console.log(response); 
        
        
        // Convierte la respuesta a JSON
        const data = await response.json();

		
		
        //console.log("Datos recibidos:", data); // Imprime los datos en consola
        return data; // Devuelve los datos
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        return null; // En caso de error, devuelve null o maneja el error segГєn tu lГіgica
    }
}


// Función para recorrer y mostrar el JSON
function recorrerJSON(data) {
    console.log("Lista de consumos ordenada:");

    runtime.globalVars.KWhAnual = 0;
    data.lista_consumos_ordenada.forEach((consumo, index) => {
        //console.log(`Consumo ${index + 1}: Grupo ${consumo[0]}, Consumo: ${consumo[1]}`);

        runtime.globalVars.KWhAnual += consumo[1];
        runtime.callFunction("OnFunctionOrdenConsumo", index, consumo[0], consumo[1]);

    });

    runtime.globalVars.KWhAnual = parseInt(runtime.globalVars.KWhAnual);
    console.log("Lista de recomendaciones:");

    runtime.globalVars.dda_energia_max =  parseInt(data.dda_energia_max);
    runtime.callFunction("ActualizarBarra", 0);

   /*
    * Tarea 1: Corregir la visualización inicial del "Consumo actual".
    * -------------------------------------------------------------
    * Se realiza una segunda llamada a `ActualizarBarra` con el valor del consumo
    * actual (`runtime.globalVars.dda_energia_max`) para posicionar el marcador
    * correctamente en la primera carga de la página de recomendaciones.
    * Anteriormente, el marcador solo aparecía después de navegar a la pantalla
    * final y volver atrás.
    */
   runtime.callFunction("ActualizarBarra", runtime.globalVars.dda_energia_max);

   /*
    * Tarea 2: Ajustar el rango de la escala de eficiencia para "A+".
    * --------------------------------------------------------------
    * Para que la escala de eficiencia comience en 2000 kWh/año en lugar de 0,
    * es necesario modificar la lógica interna de la función `ActualizarBarra`
    * en el editor de Construct. No es posible realizar este cambio directamente
    * desde aquí, ya que la función es parte de la lógica visual del motor.
    *
    * Modificación sugerida en el Event Sheet de Construct:
    * La fórmula que calcula la posición del marcador debe ajustarse.
    * Por ejemplo, si la fórmula actual es:
    *   (valor / max_valor) * ancho_escala
    * Debería cambiarse a algo similar a:
    *   ((valor - 2000) / (max_valor - 2000)) * ancho_escala
    *
    * Es importante asegurarse de que los valores de consumo inferiores a 2000
    * se traten como 2000 para evitar posiciones negativas en la barra (clamp).
    */


    data.lista_recomendaciones.forEach((grupo, index) => {
        console.log(`
Grupo de uso ${index + 1}: ${grupo.grupo_uso} (ID: ${grupo.grupo_uso_id})`);

        var index2 = 0;

        grupo.recomendaciones.forEach((recomendacion) => {
            // Guardando los valores en variables

            
            var id = recomendacion.id;   // usar este id en vez del número
            var grupoUsoId = recomendacion.grupo_uso_id;
            var grupoUso = recomendacion.grupo_uso;
            var grupoUsoCorto = recomendacion.grupo_uso_corto; // columna 2  (nuevos valores)
            var imagenTarjeta = recomendacion.imagen_tarjeta;  // columna 5 (nuevos valores)
            var textoRecomendacion = recomendacion.recomendacion;  // columna 0
            var inversionId = recomendacion.inversion_id;  // columna 3
            var inversion = recomendacion.inversion;
            var ahorroEeId = recomendacion.ahorro_ee_id;
            var ahorroEe = recomendacion.ahorro_ee;  // columna 1
			
			
			runtime.callFunction("FunctionAddRecomendacion", index2, grupo.grupo_uso_id, id, grupoUsoId, grupoUso, grupoUsoCorto, imagenTarjeta, textoRecomendacion, inversionId, inversion, ahorroEeId, ahorroEe);

            // Mostrando los valores en la consola
            /*console.log(`- ID: ${id}`);
            console.log(`  Grupo Uso ID: ${grupoUsoId}`);
            console.log(`  Grupo Uso: ${grupoUso}`);
            console.log(`  Uso corto: ${grupoUsoCorto}`);
            console.log(`  Imagen Tarjeta: ${imagenTarjeta}`);
            console.log(`  Recomendación: ${textoRecomendacion}`);
            console.log(`  Inversión ID: ${inversionId}`);
            console.log(`  Inversión: ${inversion}`);
            console.log(`  Ahorro EE ID: ${ahorroEeId}`);
            console.log(`  Ahorro estimado: ${ahorroEe}
`);*/

            index2++;
        });
    });
}


    //runtime.globalVars.a_consumo_id = 333;
	
    
    fetchData("/recomendaciones/" + runtime.globalVars.a_consumo_id, "GET").then((data) => {
		if (data) {

            runtime.callFunction("TerminarCarga");

			recorrerJSON(data);
		}
});


	},

	async EventSheet11_Event73(runtime, localVars)
	{
const apiUrl = runtime.globalVars.url_end_point;


async function fetchData(url, method, _data) {
    try {
        
        var jsonData = null;
        
        if(_data != null){
            jsonData = JSON.stringify(_data);
        }
        
        const response = await fetch(apiUrl + url, {
            method: method,
            headers: {
                "Content-Type": "application/json", // Especifica que esperas un JSON como respuesta
            },
             body: jsonData
        });

        // Verifica si la respuesta fue exitosa
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }


        console.log(response); 
        
        
        // Convierte la respuesta a JSON
        const data = await response.json();
        //console.log("Datos recibidos:", data); // Imprime los datos en consola
        return data; // Devuelve los datos
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        return null; // En caso de error, devuelve null o maneja el error segГєn tu lГіgica
    }
}

//runtime.globalVars.IdSeleccionados = "1, 3, 20";
//runtime.globalVars.a_consumo_id = 141;


let idsArray = runtime.globalVars.IdSeleccionados
    .replace(/,$/, '') // Elimina la coma final si existe
    .split(',')        // Divide la cadena en un array
    .map(id => parseInt(id.trim())) // Convierte cada elemento en número
    .filter(Number.isInteger); // Filtra valores no numéricos

// Paso 2: Serializar el resultado en JSON
let _data = { recomendaciones_id: idsArray };
	
    
    fetchData("/recomendaciones/" + runtime.globalVars.a_consumo_id, "PUT", _data).then((data) => {
		if (data) {

			console.log(data);
			

            fetchData("/recomendaciones_select/" + runtime.globalVars.a_consumo_id, "GET").then((data2) => {
                if (data2) {

                    
                    recorrerJSONFinal(data2);
                }
        });


		}
});


function recorrerJSONFinal(data) {

    runtime.globalVars.ahorro_energetico_promedio = parseInt(data.Ahorro_medidas.ahorro_energetico_promedio);
    runtime.globalVars.KWhAnualMejora = runtime.globalVars.KWhAnual - runtime.globalVars.ahorro_energetico_promedio;

    runtime.globalVars.ahorro_porcentaje_consumo_calefaccion = parseInt((data["Resumen_desempeno"]["Calefacción"]["suma_energia"] / runtime.globalVars.KWhAnual) * 100);

    runtime.globalVars.ahorro_porcentaje_consumo_agua = parseInt((data["Resumen_desempeno"]["Agua Caliente"]["suma_energia"] / runtime.globalVars.KWhAnual) * 100);

    runtime.globalVars.ahorro_porcentaje_consumo_electrodomestico = parseInt((data["Resumen_desempeno"]["Electrodomésticos"]["suma_energia"] / runtime.globalVars.KWhAnual) * 100);

    runtime.globalVars.ahorro_porcentaje_consumo_enfriamiento = parseInt((data["Resumen_desempeno"]["Enfriamiento"]["suma_energia"] / runtime.globalVars.KWhAnual) * 100);

    runtime.globalVars.ahorro_porcentaje_consumo_cocina = parseInt((data["Resumen_desempeno"]["Cocina"]["suma_energia"] / runtime.globalVars.KWhAnual) * 100);

    runtime.globalVars.ahorro_porcentaje_consumo_iluminacion = parseInt((data["Resumen_desempeno"]["Iluminación"]["suma_energia"] / runtime.globalVars.KWhAnual) * 100);


    runtime.globalVars.ahorro_promedio_monetario = parseInt(data["Ahorro_medidas"]["ahorro_promedio_monetario"]);

    runtime.callFunction("ActualizarBarra", 1);
}

	},

	async EventSheetConsumos_Event4(runtime, localVars)
	{
const apiUrl = runtime.globalVars.url_end_point;


async function fetchData(url, method, _data) {
    try {
        
        var jsonData = null;
        
        if(_data != null){
            jsonData = JSON.stringify(_data);
        }
        
        const response = await fetch(apiUrl + url, {
            method: method,
            headers: {
                "Content-Type": "application/json", // Especifica que esperas un JSON como respuesta
            },
             body: jsonData
        });

        // Verifica si la respuesta fue exitosa
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }


        console.log(response); 
        
        
        // Convierte la respuesta a JSON
        const data = await response.json();
        //console.log("Datos recibidos:", data); // Imprime los datos en consola
        return data; // Devuelve los datos
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        return null; // En caso de error, devuelve null o maneja el error segГєn tu lГіgica
    }
}


var _data = {
        id_comuna: parseInt(runtime.globalVars.a_comuna_id), 
        clima: runtime.globalVars.a_tipo_clima,
        tipo_vivienda: runtime.globalVars.a_tipo_vivienda,
        n_pisos: runtime.globalVars.a_casa_pisos,
        ultimo_piso: runtime.globalVars.a_ultimo_piso  == 1 ? true : false,
        conoce_superficie: runtime.globalVars.a_conoce_superficie  == 1 ? true : false,
        superficie: runtime.globalVars.a_superficie,
        anio_construccion: runtime.globalVars.a_anio_construccion,
        usa_elec: runtime.globalVars.a_usa_elec == 1 ? true : false,
        usa_gn: runtime.globalVars.a_usa_gn == 1 ? true : false,
        usa_glp: runtime.globalVars.a_usa_glp == 1 ? true : false,
        usa_ker: runtime.globalVars.a_usa_ker == 1 ? true : false,
        usa_len: runtime.globalVars.a_usa_len == 1 ? true : false,
        usa_pel: runtime.globalVars.a_usa_pel == 1 ? true : false
    };
    
    if(runtime.globalVars.a_conoce_superficie == 0 || runtime.globalVars.a_conoce_superficie == false){
		_data = {
			id_comuna: parseInt(runtime.globalVars.a_comuna_id), 
			clima: runtime.globalVars.a_tipo_clima,
			tipo_vivienda: runtime.globalVars.a_tipo_vivienda,
			n_pisos: runtime.globalVars.a_casa_pisos,
			ultimo_piso: runtime.globalVars.a_ultimo_piso  == 1 ? true : false,
			conoce_superficie: runtime.globalVars.a_conoce_superficie  == 1 ? true : false,
			dormitorio: runtime.globalVars.a_dormitorios,
			anio_construccion: runtime.globalVars.a_anio_construccion,
			usa_elec: runtime.globalVars.a_usa_elec == 1 ? true : false,
			usa_gn: runtime.globalVars.a_usa_gn == 1 ? true : false,
			usa_glp: runtime.globalVars.a_usa_glp == 1 ? true : false,
			usa_ker: runtime.globalVars.a_usa_ker == 1 ? true : false,
			usa_len: runtime.globalVars.a_usa_len == 1 ? true : false,
			usa_pel: runtime.globalVars.a_usa_pel == 1 ? true : false
		};
	}
    
    
    fetchData("/comunas/?format=json", "POST", _data).then((data) => {
		if (data) {

			console.log(data);

			runtime.globalVars.a_consumo_id = data.id;
			runtime.globalVars.a_consumo_elec = data.consumo_elec;
			runtime.globalVars.a_consumo_gn = data.consumo_gn;
			runtime.globalVars.a_consumo_glp = data.consumo_glp;
			runtime.globalVars.a_consumo_ker = data.consumo_ker;
			runtime.globalVars.a_consumo_len = data.consumo_len;
			runtime.globalVars.a_consumo_pel = data.consumo_pel;

			if (Number.isNaN(runtime.globalVars.a_consumo_elec)) {
				runtime.globalVars.a_consumo_elec = 0;
			}
			if (Number.isNaN(runtime.globalVars.a_consumo_gn)) {
				runtime.globalVars.a_consumo_gn = 0;
			}
			if (Number.isNaN(runtime.globalVars.a_consumo_glp)) {
				runtime.globalVars.a_consumo_glp = 0;
			}
			if (Number.isNaN(runtime.globalVars.a_consumo_ker)) {
				runtime.globalVars.a_consumo_ker = 0;
			}
			if (Number.isNaN(runtime.globalVars.a_consumo_len)) {
				runtime.globalVars.a_consumo_len = 0;
			}
			if (Number.isNaN(runtime.globalVars.a_consumo_pel)) {
				runtime.globalVars.a_consumo_pel = 0;
			}
		}
		
		runtime.callFunction("FunctionUpdateConsumos");
        runtime.callFunction("TerminarCarga");
		
		
		fetchData("/demanda/" + runtime.globalVars.a_consumo_id, "GET").then((data) => {
		if (data) {

			console.log(data);
		}
});

});
	},

	async EventSheetFinal_Event2(runtime, localVars)
	{
const apiUrl = runtime.globalVars.url_end_point;


async function fetchData(url, method, _data) {
    try {
        
        var jsonData = null;
        
        if(_data != null){
            jsonData = JSON.stringify(_data);
        }
        
        const response = await fetch(apiUrl + url, {
            method: method,
            headers: {
                "Content-Type": "application/json", // Especifica que esperas un JSON como respuesta
            },
             body: jsonData
        });

        // Verifica si la respuesta fue exitosa
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }


        console.log(response); 
        
        
        // Convierte la respuesta a JSON
        const data = await response.json();
        //console.log("Datos recibidos:", data); // Imprime los datos en consola
        return data; // Devuelve los datos
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        return null; // En caso de error, devuelve null o maneja el error segГєn tu lГіgica
    }
}


//runtime.globalVars.a_consumo_id = 333;
	
    
fetchData("/recomendaciones_select/" + runtime.globalVars.a_consumo_id, "GET").then((data2) => {
                if (data2) {

                    
                    recorrerJSONFinal(data2);
                }
        });


function recorrerJSONFinal(data) {

    const medidas = data["Medidas seleccionadas"];

    var grupo_uso_id = 0;
    var index = 0;
    var index2 = 0;
    var linea_inicio = 0;
    var lineas = 0;

    for (const clave in medidas) {
        if (medidas.hasOwnProperty(clave)) {
            const lista = medidas[clave];

            lista.forEach(item => {

                if(grupo_uso_id != item.grupo_uso_id){

                    if(index != 0){
                        console.log(index + " ");
                        runtime.callFunction("ActualizarRecomendacion", index, "", false, true);
                        index++;


                        if(linea_inicio < 14 && linea_inicio + lineas > 14){

                            var diff = linea_inicio + lineas - 14;

                            runtime.callFunction("ActualizarMarco", index2, grupo_uso_id, linea_inicio, lineas - diff);
                            index2++;
                            runtime.callFunction("ActualizarMarco", index2, grupo_uso_id, linea_inicio + lineas - diff, diff);
                            index2++;
                        }
                        else{
                            runtime.callFunction("ActualizarMarco", index2, grupo_uso_id, linea_inicio, lineas);
                            index2++;
                        }
                        

                        
                        linea_inicio = index;
                    }

                    runtime.callFunction("ActualizarMedidaSeleccionada", grupo_uso_id, item.grupo_uso);

                    grupo_uso_id = item.grupo_uso_id;

                    console.log(index + " " + item.grupo_uso_corto);
                    runtime.callFunction("ActualizarRecomendacion", index, item.grupo_uso_corto, true, false);
                    index++;
                    lineas = 1;
                }

                console.log(index + " " + item.recomendacion);
                runtime.callFunction("ActualizarRecomendacion", index, item.recomendacion, false, false);
                index++;
                lineas++;
            });
        }
    }

    runtime.callFunction("ActualizarMarco", index2, grupo_uso_id, linea_inicio, lineas);

    
}

	}
};

globalThis.C3.JavaScriptInEvents = scriptsInEvents;