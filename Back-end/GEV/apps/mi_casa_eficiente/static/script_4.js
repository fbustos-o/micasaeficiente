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
            
            // 3. GENERAR GRÁFICO DE TORTA
            generarGraficoTorta(data);
            
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
    
    // Calcular consumo total
    const consumos = data["Resumen de consumos"];
    let totalConsumo = 0;
    for (const tipo in consumos) {
        totalConsumo += consumos[tipo];
    }
    
    // Obtener datos de ahorro
    const ahorroData = data["Ahorro_medidas"];
    const ahorroPromedio = ahorroData ? ahorroData.ahorro_energetico_promedio : 0;
    
    // Calcular porcentaje de ahorro
    const porcentajeAhorro = (ahorroPromedio / totalConsumo * 100).toFixed(1);
    
    // Valor máximo regional
    const valorMaximo = Math.round(data.dda_maxima);
    
    // Actualizar UI
    valorConsumoElement.textContent = Math.round(totalConsumo);
    valorAhorroElement.textContent = Math.round(ahorroPromedio);
    valorAhorroPorcentajeElement.textContent = porcentajeAhorro;
    consumoMaximoElement.textContent = valorMaximo;
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
    
    // Obtener valor máximo y ahorro
    const valorMaximo = data.dda_maxima;
    const ahorroData = data["Ahorro_medidas"];
    const ahorroPromedio = ahorroData ? ahorroData.ahorro_energetico_promedio : 0;
    
    // Calcular consumo con ahorro aplicado
    const consumoReducido = totalConsumo - ahorroPromedio;
    
    // Calcular posiciones porcentuales en la escala (invertido porque A+ está a la izquierda)
    const posicionActual = 100 - (totalConsumo / valorMaximo * 100);
    const posicionPotencial = 100 - (consumoReducido / valorMaximo * 100);
    
    // Colocar marcadores con límites para que no se salgan
    marcadorActual.style.left = `${Math.min(Math.max(posicionActual, 5), 95)}%`;
    marcadorPotencial.style.left = `${Math.min(Math.max(posicionPotencial, 5), 95)}%`;
    
    // Colorear el valor actual según su posición en la escala
    // Para esto dividimos la escala en 8 segmentos
    const valorActualElement = document.querySelector('.valor-actual');
    const segmentos = 8;
    const colorIndex = Math.floor((1 - (totalConsumo / valorMaximo)) * segmentos);
    
    // Asignar colores según el índice
    const colores = [
        'var(--color-g)',      // G - Rojo
        'var(--color-f)',      // F - Naranja rojizo
        'var(--color-e)',      // E - Naranja
        'var(--color-d)',      // D - Amarillo dorado
        'var(--color-c)',      // C - Amarillo
        'var(--color-b)',      // B - Verde claro
        'var(--color-a)',      // A - Verde
        'var(--color-a-plus)'  // A+ - Verde oscuro
    ];
    
    // Limitar el índice al rango válido
    const colorSeguro = Math.min(Math.max(colorIndex, 0), 7);
    valorActualElement.style.backgroundColor = colores[colorSeguro];
    
    // Ajustar el color del texto según el fondo
    if (colorSeguro <= 3) {
        valorActualElement.style.color = '#333';
    } else {
        valorActualElement.style.color = 'white';
    }
}

// FUNCIÓN PARA GENERAR GRÁFICO DE TORTA
function generarGraficoTorta(data) {
    // Obtener contenedores
    const graficoTorta = document.getElementById('grafico-torta');
    const graficoLeyenda = document.getElementById('grafico-leyenda');
    
    // Limpiar contenedores
    graficoTorta.innerHTML = '';
    graficoLeyenda.innerHTML = '';
    
    // Obtener datos de consumo por categoría
    const resumenDesempeno = data["Resumen_desempeno"];
    
    // Calcular consumo total
    let totalEnergia = 0;
    for (const categoria in resumenDesempeno) {
        totalEnergia += resumenDesempeno[categoria].suma_energia;
    }
    
    // Colores para cada categoría
    const coloresCategorias = {
        'Iluminación': '#FFC107',
        'Electrodomésticos': '#2196F3',
        'Cocina': '#FF5722',
        'Enfriamiento': '#00BCD4',
        'Calefacción': '#F44336',
        'Agua Caliente': '#4CAF50'
    };
    
    // Variables para crear el gráfico
    let anguloInicial = -90; // Comenzar desde arriba (en grados)
    let categorias = [];
    
    // Procesar datos y ordenar por consumo (de mayor a menor)
    for (const categoria in resumenDesempeno) {
        const energia = resumenDesempeno[categoria].suma_energia;
        const porcentaje = (energia / totalEnergia * 100);
        
        categorias.push({
            nombre: categoria,
            energia: energia,
            porcentaje: porcentaje,
            color: coloresCategorias[categoria] || '#999'
        });
    }
    
    // Ordenar por consumo (descendente)
    categorias.sort((a, b) => b.energia - a.energia);
    
    // Crear sectores de la torta y leyenda
    categorias.forEach(categoria => {
        // Calcular ángulo para este sector
        const angulo = (categoria.porcentaje / 100) * 360;
        const anguloFinal = anguloInicial + angulo;
        
        // Crear elemento para el sector
        const sector = document.createElement('div');
        sector.className = 'sector-torta';
        sector.style.backgroundColor = categoria.color;
        
        // Aplicar transformación para crear el sector circular
        sector.style.transform = `rotate(${anguloInicial}deg)`;
        
        // Crear un pseudo-elemento para completar el sector
        const pseudoStyle = document.createElement('style');
        pseudoStyle.textContent = `
            #grafico-torta .sector-torta:nth-child(${graficoTorta.children.length + 1})::before {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                background-color: ${categoria.color};
                transform-origin: center;
                transform: rotate(${angulo}deg);
                clip-path: polygon(50% 50%, 50% 0%, 0% 0%, 0% 100%, 50% 100%);
            }
        `;
        document.head.appendChild(pseudoStyle);
        
        // Añadir sector al gráfico
        graficoTorta.appendChild(sector);
        
        // Crear elemento de leyenda
        const leyendaItem = document.createElement('div');
        leyendaItem.className = 'leyenda-item';
        
        const leyendaColor = document.createElement('div');
        leyendaColor.className = 'leyenda-color';
        leyendaColor.style.backgroundColor = categoria.color;
        
        const leyendaTexto = document.createElement('div');
        leyendaTexto.className = 'leyenda-texto';
        leyendaTexto.textContent = categoria.nombre;
        
        const leyendaPorcentaje = document.createElement('div');
        leyendaPorcentaje.className = 'leyenda-porcentaje';
        leyendaPorcentaje.textContent = `${categoria.porcentaje.toFixed(1)}%`;
        
        // Añadir elementos a la leyenda
        leyendaItem.appendChild(leyendaColor);
        leyendaItem.appendChild(leyendaTexto);
        leyendaItem.appendChild(leyendaPorcentaje);
        graficoLeyenda.appendChild(leyendaItem);
        
        // Actualizar ángulo inicial para el siguiente sector
        anguloInicial = anguloFinal;
    });
    
    // Si no hay datos, mostrar mensaje
    if (categorias.length === 0) {
        const mensaje = document.createElement('div');
        mensaje.textContent = 'No hay datos de consumo disponibles';
        mensaje.style.textAlign = 'center';
        mensaje.style.padding = '20px';
        graficoTorta.appendChild(mensaje);
    }
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
    // Efecto hover en tarjetas de beneficios
    const beneficioCards = document.querySelectorAll('.beneficio-card');
    beneficioCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('highlight');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('highlight');
        });
    });
    
    // Interactividad en leyenda de gráfico
    const leyendaItems = document.querySelectorAll('.leyenda-item');
    leyendaItems.forEach((item, index) => {
        item.addEventListener('mouseenter', () => {
            // Destacar sector correspondiente
            const sector = document.querySelector(`.sector-torta:nth-child(${index + 1})`);
            if (sector) {
                sector.style.transform = `${sector.style.transform.split(' ')[0]} scale(1.05)`;
                sector.style.zIndex = '10';
                sector.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
            }
            
            // Destacar texto de leyenda
            item.style.fontWeight = 'bold';
        });
        
        item.addEventListener('mouseleave', () => {
            // Restaurar sector
            const sector = document.querySelector(`.sector-torta:nth-child(${index + 1})`);
            if (sector) {
                sector.style.transform = sector.style.transform.split(' ')[0];
                sector.style.zIndex = '1';
                sector.style.boxShadow = 'none';
            }
            
            // Restaurar texto
            item.style.fontWeight = 'normal';
        });
    });
}