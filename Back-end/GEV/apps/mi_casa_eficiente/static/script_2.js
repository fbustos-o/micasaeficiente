document.addEventListener('DOMContentLoaded', () => {
    // 0. parametros de la tarjeta
    const pk = pkFromTemplate
    const escala = document.querySelector('.escala');
    const barra = document.querySelector('.barra');
    const valorActualElement = document.querySelector('.valor-actual');
    const valorMaximoElement = document.querySelector('.maximo');
    const valorActualContainer = document.querySelector('.valor-actual-container');

    // 1. sección de valores de consumo y franja de colores

    fetch(`${window.location.origin}/mi_casa_eficiente/recomendaciones_select/${pk}`)
        .then(response => response.json())
        .then(data => {
            const consumos = data["Resumen de consumos"]
            let totalConsumo = 0;
            for (const tipo in consumos) {
                totalConsumo += consumos[tipo];
            }
            //redondeo de valores
            const totalConsumoRounded = totalConsumo.toFixed(0);

            const valorActual = totalConsumoRounded;
            const valorMaximo = parseInt(data["dda_maxima"]).toFixed(0);

            valorMaximoElement.textContent = valorMaximo + " kWh";
            valorActualElement.textContent = valorActual + " kWh/año";

            // Calcula el porcentaje utilizando el valor máximo en lugar del valor actual
            const porcentaje = (valorMaximo / valorMaximo) * 100;

            const secciones = barra.querySelectorAll('.seccion');
            const numSecciones = secciones.length;
            const anchoPorSeccion = 100 / numSecciones;

            secciones.forEach((seccion, index) => {
                let inicioSeccion = index * anchoPorSeccion;
                let finSeccion = (index + 1) * anchoPorSeccion;
                let anchoRealSeccion = 0;
                if (porcentaje > inicioSeccion) {
                    anchoRealSeccion = Math.min(finSeccion, porcentaje) - inicioSeccion;
                }
                seccion.style.width = anchoRealSeccion + "%";
            });

            if (porcentaje < 5) {
                valorActualContainer.style.left = '5px';
            } else if (porcentaje > 95) {
                valorActualContainer.style.right = '5px';
                valorActualContainer.style.left = 'auto';
            } else {
                // Usa el valor actual para posicionar el indicador del consumo
                const porcentajeActual = (valorActual / valorMaximo) * 100;
                valorActualContainer.style.left = `calc(${porcentajeActual}% - 25px)`;
            }
            // Posicionar la flecha
            const flecha = document.querySelector('.escala .flecha');
            const porcentajeActual = (valorActual / valorMaximo) * 100;
            flecha.style.left = `calc(${porcentajeActual}% - 5px)`; // Ajustar posición horizontal

            let colorFondo = '';
            for (let i = 0; i < numSecciones; i++) {
            let inicioSeccion = i * anchoPorSeccion;
            let finSeccion = (i + 1) * anchoPorSeccion;
            if (porcentajeActual >= inicioSeccion && porcentajeActual < finSeccion) {
                colorFondo = getComputedStyle(secciones[i]).backgroundColor;
                break;
            }
            }

            // Aplicar el color de fondo al valor de consumo
            valorActualElement.style.backgroundColor = colorFondo;
            // 2. sección de detalles de desempeño por sección
            const resumen_desempeno = data["Resumen_desempeno"];
            const tablaDesempeno = document.querySelector('.descripcion table'); 

            // Clear existing table rows
            tablaDesempeno.innerHTML = '';

            for (const grupo in resumen_desempeno) {
                const puntaje = resumen_desempeno[grupo].puntaje;
                let estrellas = '';
                for (let i = 0; i < 5; i++) {
                    if (i < puntaje) {
                        estrellas += '<span style="font-size: 1.2em; color: gold;">★</span>'; // Larger, gold star
                    } else {
                        estrellas += '<span style="font-size: 1em; color: lightgray;">☆</span>'; // Smaller, gray star
                    }
                }
                const fila = document.createElement('tr');
                fila.innerHTML = `<td>${grupo}:</td><td class="estrellas">${estrellas}</td>`; // Create table row HTML
                tablaDesempeno.appendChild(fila); // Append row to table
            }

            // 3. Mejoras recomendadas seleccionadas
            const recomendacionesSelect = data["Medidas seleccionadas"];
            const recomendacionesPorGrupo = {};
            for (const id in recomendacionesSelect) {
                const recomendacion = recomendacionesSelect[id][0]; // Access the first element
                const grupoUso = recomendacion.grupo_uso;
                const recomendacionText = recomendacion.recomendacion;
                if (!recomendacionesPorGrupo[grupoUso]) {
                    recomendacionesPorGrupo[grupoUso] = [];
                }
                recomendacionesPorGrupo[grupoUso].push(recomendacionText);
            }

            const recomendacionesList = document.getElementById('recomendaciones-list');  // Assuming you have an element with this ID in your HTML
            if (!recomendacionesList){ // check if exists
                console.error("Error displaying 'Medidas seleccionadas'")
                return
            }
            recomendacionesList.innerHTML = '' // Clean previous added elements. 
            const ol = document.createElement('ol');

            for (const grupoUso in recomendacionesPorGrupo) {
                const liGrupo = document.createElement('li');
                liGrupo.textContent = grupoUso;
                const ulRecomendaciones = document.createElement('ul');

                recomendacionesPorGrupo[grupoUso].forEach(recomendacion => {
                    const liRecomendacion = document.createElement('li');
                    liRecomendacion.textContent = recomendacion;
                    ulRecomendaciones.appendChild(liRecomendacion);
                });

                liGrupo.appendChild(ulRecomendaciones);
                ol.appendChild(liGrupo);
            }

            recomendacionesList.appendChild(ol);

            // 4. codigo qr de recomendación

            // 5. fecha de emisión

            const fechaEmisionDiv = document.querySelector('.pie'); // Select the div
            const fechaActual = new Date();
            const dia = fechaActual.getDate();
            const mes = fechaActual.getMonth() + 1; // Month is 0-indexed
            const año = fechaActual.getFullYear();
            fechaEmisionDiv.textContent = `Fecha de Emisión: ${año}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;

        }).catch(error => {
            console.error("Error fetching data:", error)
        });
});



        

        

        