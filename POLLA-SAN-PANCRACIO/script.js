document.addEventListener('DOMContentLoaded', async () => {

    // ----------------------------------------------------------------
    // PARTE 1: Carga y Preparación de Datos desde SUPABASE
    // ----------------------------------------------------------------

    let resultadosAdmin = [];
    let participantesData = [];
    let finanzasData = {
        ventas: 0, 
        recaudado: 0.00,
        acumulado1: 0.00,
        acumulado2: 0.00 // Segundo acumulado para el 2do premio
    };
    
    let resultadosDelDia = [];
    const JUGADA_SIZE = 6; // Formato de 6 números
    let rankingCalculado = []; 

    // FUNCIÓN PARA FORMATEAR MONEDA (Estilo Alemán: Punto en miles, coma en decimales)
    const formatearBS = (monto) => {
        return new Intl.NumberFormat('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(monto) + " BS";
    };

    function establecerFechaReal() {
        const headerP = document.querySelector('header p');
        if (headerP) {
            const ahora = new Date();
            const opciones = { 
                weekday: 'long', 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            };
            const fechaFormateada = ahora.toLocaleDateString('es-ES', opciones);
            headerP.style.textTransform = 'capitalize';
            headerP.innerHTML = `<i class="fas fa-calendar-alt"></i> ${fechaFormateada}`;
        }
    }

    async function cargarDatosDesdeNube() {
        try {
            // Consulta paralela a Supabase
            const { data: p } = await _supabase.from('participantes').select('*').order('nro', { ascending: true });
            const { data: r } = await _supabase.from('resultados').select('*');
            const { data: f } = await _supabase.from('finanzas').select('*').single();

            if (p) participantesData = p;
            if (r) {
                resultadosAdmin = r;
                resultadosDelDia = r.map(res => String(res.numero));
            }
            if (f) {
                finanzasData = f;
            }

            inicializarSistema();
        } catch (error) {
            console.error("Error cargando datos de Supabase:", error);
        }
    }

    function inicializarSistema() {
        establecerFechaReal(); 
        actualizarFinanzasYEstadisticas(); 
        renderResultadosDia();
        renderRanking();
        configurarFiltro();
    }

    // ----------------------------------------------------------------
    // PARTE 2: Funciones Lógicas de Cálculo
    // ----------------------------------------------------------------

    function calcularAciertos(jugadorJugadas, ganadores) {
        let aciertos = 0;
        const ganadoresSet = new Set(ganadores.map(val => String(val))); 
        
        jugadorJugadas.forEach(num => {
            let numProcesado = String(num);
            if (ganadoresSet.has(numProcesado)) {
                aciertos++;
            }
        });
        return aciertos;
    }

    function actualizarFinanzasYEstadisticas() {
        // Enlaces con el DOM
        const ventasEl = document.getElementById('ventas');
        const recaudadoEl = document.getElementById('recaudado');
        const acumulado1El = document.getElementById('acumulado1');
        const acumulado2El = document.getElementById('acumulado2');
        
        const primerPremioEl = document.getElementById('primer-premio'); 
        const segundoPremioEl = document.getElementById('segundo-premio'); 
        const domingoEl = document.getElementById('monto-domingo');

        // Valores numéricos
        const montoRecaudadoHoy = parseFloat(finanzasData.recaudado) || 0;
        const montoAcumuladoAnterior = parseFloat(finanzasData.acumulado1) || 0;
        const montoAcumuladoDos = parseFloat(finanzasData.acumulado2) || 0;

        // --- LÓGICA DE REPARTO ---
        // 75% Premios, 5% Domingo, 20% Casa (No se muestra)
        const montoParaPremiosTotal = montoRecaudadoHoy * 0.75; 
        const montoParaDomingo = montoRecaudadoHoy * 0.05;      

        // Distribución de Premios: 80% al Primero, 20% al Segundo + sus acumulados
        const calculoPrimerPremio = (montoParaPremiosTotal * 0.80) + montoAcumuladoAnterior;
        const calculoSegundoPremio = (montoParaPremiosTotal * 0.20) + montoAcumuladoDos;

        // --- RENDERIZADO DE VALORES ---
        if (ventasEl) ventasEl.textContent = finanzasData.ventas;
        if (recaudadoEl) recaudadoEl.textContent = formatearBS(montoRecaudadoHoy);
        if (acumulado1El) acumulado1El.textContent = formatearBS(montoAcumuladoAnterior);
        if (acumulado2El) acumulado2El.textContent = formatearBS(montoAcumuladoDos);
        
        if (primerPremioEl) primerPremioEl.textContent = formatearBS(calculoPrimerPremio);
        if (segundoPremioEl) segundoPremioEl.textContent = formatearBS(calculoSegundoPremio);
        if (domingoEl) domingoEl.textContent = formatearBS(montoParaDomingo);
    }

    // ----------------------------------------------------------------
    // PARTE 3: Renderizado de Interfaz
    // ----------------------------------------------------------------

    function renderResultadosDia() {
        const container = document.getElementById('numeros-ganadores-display');
        if (!container) return;

        if (resultadosAdmin.length === 0) {
            container.innerHTML = '<p>Esperando resultados del sorteo...</p>';
            return;
        }

        const horas = ["8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM"];
        const nombresRuletas = ["LOTTO ACTIVO", "GRANJITA", "SELVA PLUS"];

        const mapaResultados = {};
        resultadosAdmin.forEach(res => {
            const partes = res.sorteo.split(' ');
            const hora = partes.pop(); 
            const nombreRuleta = partes.join(' ');

            if (!mapaResultados[nombreRuleta]) {
                mapaResultados[nombreRuleta] = {};
            }
            mapaResultados[nombreRuleta][hora] = res.numero;
        });

        let tablaHTML = `
            <div class="tabla-resultados-wrapper">
                <table class="tabla-horarios">
                    <thead>
                        <tr>
                            <th style="background:#333; border:none;"></th>
                            ${horas.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        nombresRuletas.forEach(ruleta => {
            tablaHTML += `<tr><td class="col-ruleta">${ruleta}</td>`;
            horas.forEach(h => {
                const num = (mapaResultados[ruleta] && mapaResultados[ruleta][h]) 
                            ? mapaResultados[ruleta][h] 
                            : "--";
                const claseNum = num === "--" ? "sin-resultado" : "celda-numero";
                tablaHTML += `<td class="${claseNum}">${num}</td>`;
            });
            tablaHTML += `</tr>`;
        });

        tablaHTML += `</tbody></table></div>`;
        container.innerHTML = tablaHTML;
    }

    function renderRanking(filtro = "") {
        const tbody = document.getElementById('ranking-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        // Cálculo y ordenación por aciertos
        rankingCalculado = participantesData.map(p => {
            const numAciertos = calcularAciertos(p.jugadas, resultadosDelDia);
            return { ...p, aciertos: numAciertos };
        });

        rankingCalculado.sort((a, b) => b.aciertos - a.aciertos);

        const term = filtro.toLowerCase();
        const dataFiltrada = rankingCalculado.filter(p => 
            p.nombre.toLowerCase().includes(term) || 
            p.refe.toString().includes(term)
        );

        let totalGanadores = 0;

        dataFiltrada.forEach(p => {
            if (p.aciertos >= 6) totalGanadores++;

            const tr = document.createElement('tr');
            
            // Construcción de las celdas de la jugada
            let jugadasHTML = '';
            for (let i = 0; i < JUGADA_SIZE; i++) {
                const num = p.jugadas[i] ? String(p.jugadas[i]) : '--';
                const esGanador = resultadosDelDia.includes(num);
                const claseGanador = esGanador ? 'hit' : '';
                jugadasHTML += `<td><span class="ranking-box ${claseGanador}">${num}</span></td>`;
            }

            tr.innerHTML = `
                <td>${p.nro}</td>
                <td class="nombre-participante">${p.nombre}</td>
                <td>${p.refe}</td>
                ${jugadasHTML}
                <td id="aciertos-${p.nro}"></td>
            `;
            
            tbody.appendChild(tr);

            // Celda de aciertos/ganador
            const aciertosCell = tr.querySelector(`#aciertos-${p.nro}`);
            if (p.aciertos >= 6) { 
                aciertosCell.innerHTML = '<span class="ganador-final">GANADOR 🏆</span>';
            } else {
                aciertosCell.innerHTML = `<span class="ranking-box aciertos-box">${p.aciertos}</span>`;
            }
        });

        // Actualizar contador de ganadores en la interfaz
        const totalGanadoresEl = document.getElementById('total-ganadores');
        if (totalGanadoresEl) totalGanadoresEl.textContent = totalGanadores;
    }

    function configurarFiltro() {
        const filtroInput = document.getElementById('filtroParticipantes');
        if (filtroInput) {
            filtroInput.addEventListener('keyup', (e) => {
                renderRanking(e.target.value.trim()); 
            });
        }
    }

    const btnDescargarPdf = document.getElementById('btn-descargar-pdf');
    if (btnDescargarPdf) {
        btnDescargarPdf.addEventListener('click', () => {
            window.print();
        });
    }

    // Ejecución inicial
    cargarDatosDesdeNube();
});