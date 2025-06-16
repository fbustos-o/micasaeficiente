document.addEventListener('DOMContentLoaded', () => {
    // Obtener parámetros de la plantilla
    const pk = pkFromTemplate;
    
    // Cargar los datos
    fetch(`${window.location.origin}/mi_casa_eficiente/recomendaciones_select/${pk}`)
        .then(response => response.json())
        .then(data => {
            console.log("Datos cargados:", data);
            
            // 1. ACTUALIZAR VALORES DE CONSUMO Y AHORRO POTENCIAL
            actualizarConsumoYAhorro(data);
            
            // 2. CONFIGURAR ESCALA DE EFICIENCIA
            configurarEscalaEficiencia(data);
            
            // 3. GENERAR GRÁFICO DE DESEMPEÑO ENERGÉTICO
            generarGraficoDesempeno(data);
            
            // 4. GENERAR ACORDEÓN DE RECOMENDACIONES
            generarAcordeonRecomendaciones(data);
            
            // 5. ACTUALIZAR BENEFICIOS MONETARIOS Y AMBIENTALES
            actualizarBeneficios(data);
            
            // 6. ACTUALIZAR FECHA DE EMISIÓN
            actualizarFechaEmision();
            
            // 7. INICIALIZAR EVENTOS DE INTERACCIÓN
            inicializarEventosInteraccion();
        })
        .catch(error => {
            console.error("Error al cargar datos:", error);
        });
});

// ===== FUNCIONES PARA ACTUALIZAR LA UI =====

function actualizarConsumoYAhorro(data) {
    // Obtener elementos del DOM
    const valorConsumoElement = document.getElementById('valor-consumo');
    const valorAhorroElement = document.getElementById('valor-ahorro-numero');
    const valorAhorroPorcentajeElement = document.getElementById('valor-ahorro-porcentaje');
    
    // Calcular valores
    const consumos = data["Resumen de consumos"];
    let totalConsumo = 0;
    for (const tipo in consumos) {
        totalConsumo += consumos[tipo];
    }
    
    // Obtener datos de ahorro
    const ahorroData = data["Ahorro_medidas"];
    const ahorroPromedio = ahorroData ? ahorroData.ahorro_energetico_promedio : 0;
    const eficienciaPromedio = ahorroData ? 
        ((ahorroData.eficiencia_energetica[0] + ahorroData.eficiencia_energetica[1]) / 2).toFixed(1) : 
        "N/A";
    
    // Actualizar UI
    valorConsumoElement.textContent = Math.round(totalConsumo);
    valorAhorroElement.textContent = Math.round(ahorroPromedio);
    valorAhorroPorcentajeElement.textContent = eficienciaPromedio;
}

function configurarEscalaEficiencia(data) {
    // Obtener elementos
    const escala = document.querySelector('.escala');
    const marcadorActual = document.querySelector('.marcador-actual');
    const marcadorPotencial = document.querySelector('.marcador-potencial');
    
    // Calcular valores
    const consumos = data["Resumen de consumos"];
    let totalConsumo = 0;
    for (const tipo in consumos) {
        totalConsumo += consumos[tipo];
    }
    
    const valorMaximo = data.dda_maxima;
    
    // Obtener datos de ahorro
    const ahorroData = data["Ahorro_medidas"];
    const ahorroPromedio = ahorroData ? ahorroData.ahorro_energetico_promedio : 0;
    
    // Calcular consumo con ahorro
    const consumoReducido = totalConsumo - ahorroPromedio;
    
    // Calcular posiciones en porcentaje
    const porcentajeActual = (totalConsumo / valorMaximo) * 100;
    const porcentajePotencial = (consumoReducido / valorMaximo) * 100;
    
    // Colocar marcadores
    marcadorActual.style.left = `${Math.min(Math.max(porcentajeActual, 5), 95)}%`;
    marcadorPotencial.style.left = `${Math.min(Math.max(porcentajePotencial, 5), 95)}%`;
    
    // Asignar colores según la escala
    const secciones = document.querySelectorAll('.seccion');
    const numSecciones = secciones.length;
    
    // Determinar color para marcador actual
    let colorActual = obtenerColorPorPorcentaje(porcentajeActual, secciones);
    let colorPotencial = obtenerColorPorPorcentaje(porcentajePotencial, secciones);
    
    // Aplicar colores al elemento valor-actual
    const valorActualElement = document.querySelector('.valor-actual');
    valorActualElement.style.backgroundColor = colorActual;
    
    // Si el valor de consumo actual está en la parte roja o naranja, hacer el texto blanco
    if (porcentajeActual > 70) {
        valorActualElement.style.color = 'white';
    }
}

function obtenerColorPorPorcentaje(porcentaje, secciones) {
    const numSecciones = secciones.length;
    const anchoPorSeccion = 100 / numSecciones;
    
    for (let i = 0; i < numSecciones; i++) {
        let inicioSeccion = i * anchoPorSeccion;
        let finSeccion = (i + 1) * anchoPorSeccion;
        
        if (porcentaje >= inicioSeccion && porcentaje < finSeccion) {
            return window.getComputedStyle(secciones[i]).backgroundColor;
        }
    }
    
    // Si no cae en ninguna sección (debería ser imposible), devolver el último color
    return window.getComputedStyle(secciones[numSecciones - 1]).backgroundColor;
}

function generarGraficoDesempeno(data) {
    // Obtener el contenedor del gráfico
    const graficoContainer = document.getElementById('grafico-consumo');
    graficoContainer.innerHTML = ''; // Limpiar contenido previo
    
    // Obtener datos de desempeño
    const resumenDesempeno = data["Resumen_desempeno"];
    const totalEnergia = Object.values(resumenDesempeno).reduce((sum, item) => sum + item.suma_energia, 0);
    
    // Colores para cada categoría
    const coloresCategorias = {
        'Iluminación': '#FFC107',
        'Electrodomésticos': '#2196F3',
        'Cocina': '#FF5722',
        'Enfriamiento': '#00BCD4',
        'Calefacción': '#F44336',
        'Agua Caliente': '#4CAF50'
    };
    
    // Crear barras para cada categoría
    for (const categoria in resumenDesempeno) {
        const datos = resumenDesempeno[categoria];
        const energia = datos.suma_energia;
        const porcentaje = Math.round((energia / totalEnergia) * 100);
        
        // Crear elemento de barra
        const barraCategoria = document.createElement('div');
        barraCategoria.className = 'barra-categoria';
        
        // Crear elemento para mostrar el valor de la barra
        const barraValor = document.createElement('div');
        barraValor.className = 'barra-valor';
        
        // Establecer altura proporcional al porcentaje (máximo 90% de la altura del contenedor)
        const alturaMax = 90; // Altura máxima en porcentaje
        const altura = (porcentaje / 100) * alturaMax; // Proporción de la altura máxima
        barraValor.style.height = `${altura}%`;
        
        // Asignar color basado en la categoría
        barraValor.style.backgroundColor = coloresCategorias[categoria] || '#999';
        
        // Crear elemento para mostrar el porcentaje al pasar el mouse
        const barraPorcentaje = document.createElement('div');
        barraPorcentaje.className = 'barra-porcentaje';
        barraPorcentaje.textContent = `${porcentaje}%`;
        
        // Crear elemento para el nombre de la categoría
        const barraNombre = document.createElement('div');
        barraNombre.className = 'barra-nombre';
        barraNombre.textContent = categoria;
        
        // Añadir elementos a la estructura
        barraValor.appendChild(barraPorcentaje);
        barraCategoria.appendChild(barraValor);
        barraCategoria.appendChild(barraNombre);
        
        // Añadir barra al contenedor
        graficoContainer.appendChild(barraCategoria);
    }
}

function generarAcordeonRecomendaciones(data) {
    // Obtener el contenedor del acordeón
    const acordeonContainer = document.getElementById('recomendaciones-acordeon');
    acordeonContainer.innerHTML = ''; // Limpiar contenido previo
    
    // Obtener recomendaciones seleccionadas
    const recomendacionesSelect = data["Medidas seleccionadas"];
    
    // Agrupar recomendaciones por grupo de uso
    const recomendacionesPorGrupo = {};
    for (const id in recomendacionesSelect) {
        const recomendacion = recomendacionesSelect[id][0];
        const grupoUso = recomendacion.grupo_uso;
        
        if (!recomendacionesPorGrupo[grupoUso]) {
            recomendacionesPorGrupo[grupoUso] = [];
        }
        
        recomendacionesPorGrupo[grupoUso].push(recomendacion);
    }
    
    // Crear ítem de acordeón para cada grupo
    let index = 0;
    for (const grupoUso in recomendacionesPorGrupo) {
        // Crear elemento del acordeón
        const acordeonItem = document.createElement('div');
        acordeonItem.className = 'acordeon-item';
        
        // Crear cabecera del acordeón
        const acordeonHeader = document.createElement('div');
        acordeonHeader.className = 'acordeon-header';
        acordeonHeader.innerHTML = `
            <span>${index + 1}. ${grupoUso}</span>
            <i class="fas fa-chevron-down"></i>
        `;
        
        // Crear contenido del acordeón
        const acordeonContent = document.createElement('div');
        acordeonContent.className = 'acordeon-content';
        
        // Añadir recomendaciones al contenido
        recomendacionesPorGrupo[grupoUso].forEach(recomendacion => {
            const recomendacionItem = document.createElement('div');
            recomendacionItem.className = 'recomendacion-item';
            recomendacionItem.textContent = recomendacion.recomendacion;
            acordeonContent.appendChild(recomendacionItem);
        });
        
        // Añadir evento para mostrar/ocultar contenido
        acordeonHeader.addEventListener('click', () => {
            // Toggle clase activa en el header
            acordeonHeader.classList.toggle('activo');
            
            // Toggle visibilidad del contenido
            if (acordeonContent.classList.contains('visible')) {
                acordeonContent.classList.remove('visible');
            } else {
                // Cerrar otros acordeones abiertos
                document.querySelectorAll('.acordeon-content.visible').forEach(item => {
                    item.classList.remove('visible');
                    item.previousElementSibling.classList.remove('activo');
                });
                
                // Abrir este acordeón
                acordeonContent.classList.add('visible');
            }
        });
        
        // Añadir elementos a la estructura
        acordeonItem.appendChild(acordeonHeader);
        acordeonItem.appendChild(acordeonContent);
        
        // Añadir ítem al contenedor
        acordeonContainer.appendChild(acordeonItem);
        
        // Abrir el primer acordeón por defecto
        if (index === 0) {
            acordeonHeader.classList.add('activo');
            acordeonContent.classList.add('visible');
        }
        
        index++;
    }
}

function actualizarBeneficios(data) {
    // Obtener elementos del DOM
    const ahorroMonetarioElement = document.getElementById('ahorro-monetario');
    const ahorroCO2Element = document.getElementById('ahorro-co2');
    const nivelInversionElement = document.getElementById('nivel-inversion');
    
    // Obtener datos de ahorro
    const ahorroData = data["Ahorro_medidas"];
    
    if (ahorroData) {
        // Formato para valores monetarios
        const formatoMoneda = new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0
        });
        
        // Actualizar ahorro monetario
        const ahorroMonetario = ahorroData.ahorro_promedio_monetario || 0;
        ahorroMonetarioElement.textContent = formatoMoneda.format(ahorroMonetario);
        
        // Calcular ahorro en CO2 (valor estimado basado en el consumo energético)
        // Factor de conversión estimado: 0.3 kg CO2 por kWh
        const ahorroCO2 = (ahorroData.ahorro_energetico_promedio * 0.3 / 1000).toFixed(1);
        ahorroCO2Element.textContent = `${ahorroCO2} ton`;
        
        // Evaluar nivel de inversión
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
        // Valores por defecto si no hay datos
        ahorroMonetarioElement.textContent = '$0';
        ahorroCO2Element.textContent = '0 ton';
        nivelInversionElement.textContent = 'No disponible';
    }
}

function actualizarFechaEmision() {
    const fechaEmisionElement = document.getElementById('fecha-emision');
    const fechaActual = new Date();
    
    const dia = fechaActual.getDate().toString().padStart(2, '0');
    const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaActual.getFullYear();
    
    fechaEmisionElement.textContent = `${anio}-${mes}-${dia}`;
}

function inicializarEventosInteraccion() {
    // Añadir efectos de hover a elementos específicos
    const beneficioCards = document.querySelectorAll('.beneficio-card');
    beneficioCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('highlight-pulse');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('highlight-pulse');
        });
    });
    
    // Añadir eventos a barras del gráfico de consumo
    const barrasCategorias = document.querySelectorAll('.barra-categoria');
    barrasCategorias.forEach(barra => {
        barra.addEventListener('mouseenter', () => {
            const porcentaje = barra.querySelector('.barra-porcentaje');
            porcentaje.style.opacity = '1';
        });
        
        barra.addEventListener('mouseleave', () => {
            const porcentaje = barra.querySelector('.barra-porcentaje');
            porcentaje.style.opacity = '0';
        });
    });
}