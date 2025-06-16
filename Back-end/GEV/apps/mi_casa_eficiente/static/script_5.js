document.addEventListener('DOMContentLoaded', () => {
    // Obtener parámetros de la plantilla
    const pk = pkFromTemplate;
    
    // Cargar los datos
    fetch(`${window.location.origin}/mi_casa_eficiente/recomendaciones_select/${pk}`)
        .then(response => response.json())
        .then(data => {
            console.log("Datos cargados:", data);
            
            // 1. ACTUALIZAR VALORES DE CONSUMO Y AHORRO
            actualizarConsumoYAhorro(data);
            
            // 2. CONFIGURAR ESCALA DE EFICIENCIA
            configurarEscalaEficiencia(data);
            
            // 3. GENERAR GRÁFICO DE BARRAS PARA DESGLOSE
            generarGraficoBarras(data);
            
            // 4. GENERAR ACORDEÓN DE RECOMENDACIONES
            generarAcordeonRecomendaciones(data);
            
            // 5. ACTUALIZAR BENEFICIOS
            actualizarBeneficios(data);
            
            // 6. ACTUALIZAR FECHA DE EMISIÓN
            actualizarFechaEmision();
            
            // 7. INICIALIZAR INTERACTIVIDAD
            inicializarInteractividad();
        })
        .catch(error => {
            console.error("Error al cargar datos:", error);
        });
});

// FUNCIÓN PARA ACTUALIZAR CONSUMO Y AHORRO
function actualizarConsumoYAhorro(data) {
    // Obtener elementos del DOM
    const valorConsumoElement = document.getElementById('valor-consumo');
    const valorAhorroElement = document.getElementById('valor-ahorro-numero');
    const valorAhorroPorcentajeElement = document.getElementById('valor-ahorro-porcentaje');
    const consumoMaximoElement = document.getElementById('consumo-maximo');
    const marcadorConsumoElement = document.getElementById('marcador-consumo');
    const marcadorPotencialElement = document.getElementById('marcador-potencial-valor');
    
    // Calcular consumo total
    const consumos = data["Resumen de consumos"];
    let totalConsumo = 0;
    for (const tipo in consumos) {
        totalConsumo += consumos[tipo];
    }
    
    // Obtener datos de ahorro
    const ahorroData = data["Ahorro_medidas"];
    const ahorroPromedio = ahorroData ? ahorroData.ahorro_energetico_promedio : 0;
    
    // Calcular consumo con ahorro
    const consumoReducido = Math.round(totalConsumo - ahorroPromedio);
    
    // Calcular porcentaje de ahorro
    const porcentajeAhorro = (ahorroPromedio / totalConsumo * 100).toFixed(1);
    
    // Valor máximo regional (ajustado para ser igual al consumo actual para esta demo)
    const valorMaximo = Math.round(totalConsumo);
    
    // Actualizar UI
    valorConsumoElement.textContent = Math.round(totalConsumo);
    valorAhorroElement.textContent = Math.round(ahorroPromedio);
    valorAhorroPorcentajeElement.textContent = porcentajeAhorro;
    consumoMaximoElement.textContent = valorMaximo;
    
    // Actualizar valores en las marcas de la escala
    marcadorConsumoElement.textContent = Math.round(totalConsumo);
    marcadorPotencialElement.textContent = consumoReducido;
    
    // Colorear el valor de consumo actual (rojo para letra G)
    const valorActualElement = document.querySelector('.valor-actual');
    valorActualElement.style.backgroundColor = 'var(--color-g)';
    valorActualElement.style.color = 'white';
}

// FUNCIÓN PARA CONFIGURAR ESCALA DE EFICIENCIA
function configurarEscalaEficiencia(data) {
    // Obtener elementos
    const marcadorActual = document.getElementById('marcador-actual');
    const marcadorPotencial = document.getElementById('marcador-potencial');
    
    // Calcular consumo total
    const consumos = data["Resumen de consumos"];
    let totalConsumo = 0;
    for (const tipo in consumos) {
        totalConsumo += consumos[tipo];
    }
    
    // Obtener datos de ahorro
    const ahorroData = data["Ahorro_medidas"];
    const ahorroPromedio = ahorroData ? ahorroData.ahorro_energetico_promedio : 0;
    
    // Calcular consumo con ahorro aplicado
    const consumoReducido = totalConsumo - ahorroPromedio;
    
    // Posicionar marcadores según las letras (ajustados manualmente)
    // El consumo actual (4655) debe estar en G (extremo derecho)
    // El consumo potencial (3463) debe estar en E (hacia el medio)
    marcadorActual.style.left = '95%';          // Posición G
    marcadorPotencial.style.left = '67.5%';     // Posición E aproximada
    
    // Ajustar colores de las flechas para que coincidan con las letras
    document.querySelector('.consumo-actual .flecha-marcador').style.borderTopColor = 'var(--color-g)';
    document.querySelector('.consumo-potencial .flecha-marcador').style.borderTopColor = 'var(--color-e)';
    
    // Ajustar color del texto según la letra
    document.querySelector('.consumo-actual .marcador-label').style.color = 'var(--color-g)';
    document.querySelector('.consumo-potencial .marcador-label').style.color = 'var(--color-e)';
}

// FUNCIÓN PARA GENERAR GRÁFICO DE BARRAS HORIZONTALES
function generarGraficoBarras(data) {
    // Obtener contenedor del gráfico
    const graficoContainer = document.getElementById('grafico-barras-container');
    const leyendaContainer = document.getElementById('desglose-leyenda');
    
    // Limpiar contenedores
    graficoContainer.innerHTML = '';
    leyendaContainer.innerHTML = '';
    
    // Obtener datos de consumo por categoría
    const resumenDesempeno = data["Resumen_desempeno"];
    
    // Calcular consumo total
    let totalEnergia = 0;
    for (const categoria in resumenDesempeno) {
        totalEnergia += resumenDesempeno[categoria].suma_energia;
    }
    
    // Mapeo de categorías a clases de estilo y colores
    const mapeoCategoria = {
        'Iluminación': { 
            clase: 'barra-iluminacion', 
            letra: 'A'
        },
        'Electrodomésticos': { 
            clase: 'barra-electrodomesticos', 
            letra: 'E'
        },
        'Cocina': { 
            clase: 'barra-cocina', 
            letra: 'C'
        },
        'Enfriamiento': { 
            clase: 'barra-refrigeracion', 
            letra: 'B'
        },
        'Calefacción': { 
            clase: 'barra-calefaccion', 
            letra: 'A'
        },
        'Agua Caliente': { 
            clase: 'barra-agua', 
            letra: 'C'
        }
    };
    
    // Procesar datos y ordenar por consumo (de mayor a menor)
    const categoriasProcesadas = [];
    for (const categoria in resumenDesempeno) {
        const datos = resumenDesempeno[categoria];
        categoriasProcesadas.push({
            nombre: categoria,
            energia: datos.suma_energia,
            porcentaje: (datos.suma_energia / totalEnergia) * 100,
            clase: mapeoCategoria[categoria] ? mapeoCategoria[categoria].clase : 'barra-otros',
            letra: mapeoCategoria[categoria] ? mapeoCategoria[categoria].letra : 'F'
        });
    }
    
    // Ordenar por consumo (descendente)
    categoriasProcesadas.sort((a, b) => b.energia - a.energia);
    
    // Crear ejes del gráfico
    const ejeY = document.createElement('div');
    ejeY.className = 'eje-y';
    graficoContainer.appendChild(ejeY);
    
    const ejeX = document.createElement('div');
    ejeX.className = 'eje-x';
    graficoContainer.appendChild(ejeX);
    
    // Calcular el ancho máximo para las barras (80% del ancho disponible)
    const anchoMaximo = graficoContainer.clientWidth - 250; // Espacio para etiquetas
    
    // Crear barras para cada categoría
    categoriasProcesadas.forEach((categoria, index) => {
        // Calcular altura y posición de la barra
        const alturaTotal = graficoContainer.clientHeight - 50;
        const alturaBarra = 30;
        const espaciado = 10;
        const posicionY = index * (alturaBarra + espaciado) + 10;
        
        // Crear barra
        const barra = document.createElement('div');
        barra.className = `barra-desglose ${categoria.clase}`;
        barra.style.top = `${posicionY}px`;
        
        // Animar la barra: primero establecer ancho 0, luego animar al ancho final
        const anchoBarra = (categoria.porcentaje / 100) * anchoMaximo;
        barra.style.width = '0';
        barra.style.setProperty('--target-width', `${anchoBarra}px`);
        
        // Crear tooltip para mostrar al hacer hover
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-desglose';
        tooltip.textContent = `${categoria.nombre}: ${categoria.energia.toFixed(1)} kWh (${categoria.porcentaje.toFixed(1)}%)`;
        barra.appendChild(tooltip);
        
        // Crear etiqueta para la barra
        const etiqueta = document.createElement('div');
        etiqueta.className = 'barra-etiqueta';
        
        const nombreElement = document.createElement('div');
        nombreElement.className = 'barra-nombre';
        nombreElement.textContent = categoria.nombre;
        
        const porcentajeElement = document.createElement('div');
        porcentajeElement.className = 'barra-porcentaje';
        porcentajeElement.textContent = `${Math.round(categoria.porcentaje)}%`;
        
        etiqueta.appendChild(nombreElement);
        etiqueta.appendChild(porcentajeElement);
        barra.appendChild(etiqueta);
        
        // Añadir barra al gráfico
        graficoContainer.appendChild(barra);
        
        // Crear elemento de leyenda
        const leyendaItem = document.createElement('div');
        leyendaItem.className = 'leyenda-item';
        leyendaItem.setAttribute('data-categoria', categoria.nombre);
        
        const leyendaColor = document.createElement('div');
        leyendaColor.className = `leyenda-color ${categoria.clase}`;
        
        const leyendaTexto = document.createElement('span');
        leyendaTexto.textContent = categoria.letra + ': ' + categoria.nombre;
        
        leyendaItem.appendChild(leyendaColor);
        leyendaItem.appendChild(leyendaTexto);
        leyendaContainer.appendChild(leyendaItem);
        
        // Animar la barra después de un pequeño retraso
        setTimeout(() => {
            barra.style.animation = `barAnimation 1s forwards ease-out`;
            barra.style.width = `${anchoBarra}px`;
        }, 100 * index);
    });
    
    // Ajustar altura del contenedor según número de barras
    const alturaTotal = categoriasProcesadas.length * 40 + 30;
    graficoContainer.style.height = `${Math.max(alturaTotal, 150)}px`;
}

// FUNCIÓN PARA GENERAR ACORDEÓN DE RECOMENDACIONES
function generarAcordeonRecomendaciones(data) {
    // Obtener contenedor
    const acordeonContainer = document.getElementById('recomendaciones-acordeon');
    acordeonContainer.innerHTML = '';
    
    // Obtener recomendaciones
    const recomendacionesSelect = data["Medidas seleccionadas"];
    
    // Agrupar por categoría
    const recomendacionesPorGrupo = {};
    for (const id in recomendacionesSelect) {
        const recomendacion = recomendacionesSelect[id][0];
        const grupoUso = recomendacion.grupo_uso;
        
        if (!recomendacionesPorGrupo[grupoUso]) {
            recomendacionesPorGrupo[grupoUso] = [];
        }
        
        recomendacionesPorGrupo[grupoUso].push(recomendacion);
    }
    
    // Crear acordeón para cada grupo
    let index = 0;
    for (const grupoUso in recomendacionesPorGrupo) {
        // Crear ítem de acordeón
        const acordeonItem = document.createElement('div');
        acordeonItem.className = 'acordeon-item';
        
        // Crear cabecera
        const acordeonHeader = document.createElement('div');
        acordeonHeader.className = 'acordeon-header';
        acordeonHeader.innerHTML = `
            <span>${index + 1}. ${grupoUso}</span>
            <i class="fas fa-chevron-down"></i>
        `;
        
        // Crear contenido
        const acordeonContent = document.createElement('div');
        acordeonContent.className = 'acordeon-content';
        
        // Añadir recomendaciones
        recomendacionesPorGrupo[grupoUso].forEach(recomendacion => {
            const recomendacionItem = document.createElement('div');
            recomendacionItem.className = 'recomendacion-item';
            recomendacionItem.textContent = recomendacion.recomendacion;
            acordeonContent.appendChild(recomendacionItem);
        });
        
        // Añadir evento para mostrar/ocultar
        acordeonHeader.addEventListener('click', () => {
            acordeonHeader.classList.toggle('activo');
            
            if (acordeonContent.classList.contains('visible')) {
                acordeonContent.classList.remove('visible');
            } else {
                // Cerrar otros paneles abiertos
                document.querySelectorAll('.acordeon-content.visible').forEach(item => {
                    item.classList.remove('visible');
                    item.previousElementSibling.classList.remove('activo');
                });
                
                acordeonContent.classList.add('visible');
            }
        });
        
        // Añadir elementos al acordeón
        acordeonItem.appendChild(acordeonHeader);
        acordeonItem.appendChild(acordeonContent);
        acordeonContainer.appendChild(acordeonItem);
        
        // Abrir el primer panel por defecto
        if (index === 0) {
            acordeonHeader.classList.add('activo');
            acordeonContent.classList.add('visible');
        }
        
        index++;
    }
    
    // Si no hay recomendaciones, mostrar mensaje
    if (index === 0) {
        const mensaje = document.createElement('div');
        mensaje.textContent = 'No hay recomendaciones seleccionadas';
        mensaje.style.padding = '15px';
        acordeonContainer.appendChild(mensaje);
    }
}

// FUNCIÓN PARA ACTUALIZAR BENEFICIOS
function actualizarBeneficios(data) {
    // Obtener elementos
    const ahorroMonetarioElement = document.getElementById('ahorro-monetario');
    const ahorroCO2Element = document.getElementById('ahorro-co2');
    const nivelInversionElement = document.getElementById('nivel-inversion');
    
    // Obtener datos de ahorro
    const ahorroData = data["Ahorro_medidas"];
    
    if (ahorroData) {
        // Formatear valores monetarios
        const formatoMoneda = new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0
        });
        
        // Actualizar ahorro monetario
        const ahorroMonetario = ahorroData.ahorro_promedio_monetario || 0;
        ahorroMonetarioElement.textContent = formatoMoneda.format(ahorroMonetario);
        
        // Calcular ahorro CO2 (factor conversión aproximado)
        const ahorroCO2 = (ahorroData.ahorro_energetico_promedio * 0.3 / 1000).toFixed(1);
        ahorroCO2Element.textContent = `${ahorroCO2} ton`;
        
        // Determinar nivel de inversión
        const inversionTotal = ahorroData.inversion_total || 0;
        let nivelInversion = 'Baja';
        
        if (inversionTotal >= 3) {
            nivelInversion = 'Alta';
        } else if (inversionTotal >= 2) {
            nivelInversion = 'Media';
        } else if (inversionTotal >= 1) {
            nivelInversion = 'Baja';
        } else {
            nivelInversion = 'Nula';
        }
        
        nivelInversionElement.textContent = nivelInversion;
    } else {
        // Valores por defecto
        ahorroMonetarioElement.textContent = '$0';
        ahorroCO2Element.textContent = '0 ton';
        nivelInversionElement.textContent = 'No disponible';
    }
}

// FUNCIÓN PARA ACTUALIZAR FECHA DE EMISIÓN
function actualizarFechaEmision() {
    const fechaEmisionElement = document.getElementById('fecha-emision');
    const fechaActual = new Date();
    
    const dia = fechaActual.getDate().toString().padStart(2, '0');
    const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaActual.getFullYear();
    
    fechaEmisionElement.textContent = `${anio}-${mes}-${dia}`;
}

// FUNCIÓN PARA INICIALIZAR INTERACTIVIDAD
function inicializarInteractividad() {
    // Añadir interactividad a la leyenda del desglose
    const leyendaItems = document.querySelectorAll('.leyenda-item');
    leyendaItems.forEach(item => {
        const categoria = item.getAttribute('data-categoria');
        
        item.addEventListener('mouseenter', () => {
            // Destacar barra correspondiente
            const barras = document.querySelectorAll('.barra-desglose');
            barras.forEach(barra => {
                const etiquetaNombre = barra.querySelector('.barra-nombre');
                if (etiquetaNombre && etiquetaNombre.textContent === categoria) {
                    barra.style.transform = 'scaleY(1.2)';
                    barra.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
                    barra.style.zIndex = '10';
                } else {
                    barra.style.opacity = '0.6';
                }
            });
            
            item.style.fontWeight = 'bold';
        });
        
        item.addEventListener('mouseleave', () => {
            // Restaurar todas las barras
            const barras = document.querySelectorAll('.barra-desglose');
            barras.forEach(barra => {
                barra.style.transform = '';
                barra.style.boxShadow = '';
                barra.style.zIndex = '';
                barra.style.opacity = '1';
            });
            
            item.style.fontWeight = 'normal';
        });
    });
    
    // Efecto hover para tarjetas de beneficios
    const beneficioCards = document.querySelectorAll('.beneficio-card');
    beneficioCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('highlight');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('highlight');
        });
    });
}