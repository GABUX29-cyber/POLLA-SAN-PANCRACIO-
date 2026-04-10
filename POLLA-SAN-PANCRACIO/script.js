document.addEventListener('DOMContentLoaded', async () => {

    // ----------------------------------------------------------------
    // PARTE 1: Carga y Preparación de Datos desde SUPABASE
    // ----------------------------------------------------------------

    let resultadosAdmin = [];
    let participantesData = [];
    let finanzasData = {
        ventas: 0, 
        recaudado: 0.00,
        acumulado1: 0.00
    };
    
    let resultadosDelDia = [];
    const JUGADA_SIZE = 7; 
    let rankingCalculado = []; 

    // Función principal para obtener datos de la nube
    async function cargarDatosDesdeNube() {
        try {
            // 1. Obtener Participantes
            const { data: p, error: ep } = await _supabase
                .from('participantes')
                .select('*')
                .order('nro', { ascending: true });
            
            // 2. Obtener Resultados
            const { data: r, error: er } = await _supabase
                .from('resultados')
                .select('*');
            
            // 3. Obtener Finanzas
            const { data: f, error: ef } = await _supabase
                .from('finanzas')
                .select('*')
                .single();

            if (p) participantesData = p;
            if (r) {
                resultadosAdmin = r;
                resultadosDelDia = r.map(res => res.numero);
            }
            if (f) finanzasData = f;

            // Una vez cargados, procesamos la lógica original
            inicializarSistema();

        } catch (error) {
            console.error("Error cargando datos de Supabase:", error);
        }
    }

    function inicializarSistema() {
        actualizarFinanzasYEstadisticas(); 
        renderResultadosDia();
        renderRanking();
        configurarFiltro();
    }

    // ----------------------------------------------------------------
    // PARTE 2: Funciones Lógicas y de Cálculo (Tu lógica original)
    // ----------------------------------------------------------------

    function calcularAciertos(jugadorJugadas, ganadores) {
        let aciertos = 0;
        const ganadoresSet = new Set(ganadores.map(String)); 
        
        jugadorJugadas.forEach(num => {
            if (ganadoresSet.has(String(num).padStart(2, '0')) || ganadoresSet.has(String(num))) {
                aciertos++;
            }
        });
        return aciertos;
    }

    function actualizarFinanzasYEstadisticas() {
        const ventasEl = document.getElementById('ventas');
        const recaudadoEl = document.getElementById('recaudado');
        const acumuladoEl = document.getElementById('acumulado1');
        const repartirEl = document.getElementById('repartir75');

        if (ventasEl) ventasEl.textContent = finanzasData.ventas;
        if (recaudadoEl) recaudadoEl.textContent = `${finanzasData.recaudado.toFixed(2)} BS`;
        if (acumuladoEl) acumuladoEl.textContent = `${finanzasData.acumulado1.toFixed(2)} BS`;
        
        if (repartirEl) {
            const premio75 = finanzasData.recaudado * 0.75;
            repartirEl.textContent = `${premio75.toFixed(2)} BS`;
        }
    }

    function renderResultadosDia() {
        const container = document.getElementById('numeros-ganadores-display');
        if (!container) return;

        if (resultadosAdmin.length === 0) {
            container.innerHTML = '<p>Esperando resultados del sorteo...</p>';
            return;
        }

        container.innerHTML = ''; 
        resultadosAdmin.forEach(res => {
            const ball = document.createElement('div');
            ball.className = 'resultado-item';
            ball.innerHTML = `
                <span class="sorteo-name">${res.sorteo}</span>
                <span class="numero-ball">${res.numero.toString().padStart(2, '0')}</span>
            `;
            container.appendChild(ball);
        });
    }

    function renderRanking(filtro = "") {
        const tbody = document.getElementById('ranking-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        rankingCalculado = participantesData.map(p => {
            const numAciertos = calcularAciertos(p.jugadas, resultadosDelDia);
            return { ...p, aciertos: numAciertos };
        });

        const term = filtro.toLowerCase();
        const dataFiltrada = rankingCalculado.filter(p => 
            p.nombre.toLowerCase().includes(term) || 
            p.refe.toString().includes(term)
        );

        let totalGanadores = 0;

        dataFiltrada.forEach(p => {
            if (p.aciertos >= 7) totalGanadores++;

            const tr = document.createElement('tr');
            
            let jugadasHTML = '';
            for (let i = 0; i < JUGADA_SIZE; i++) {
                const num = p.jugadas[i] ? p.jugadas[i].toString().padStart(2, '0') : '--';
                const esGanador = resultadosDelDia.includes(num) || resultadosDelDia.includes(p.jugadas[i]);
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

            const aciertosCell = tr.querySelector(`#aciertos-${p.nro}`);
            if (p.aciertos >= 7) { 
                aciertosCell.innerHTML = '<span class="ganador-final">GANADOR 🏆</span>';
            } else {
                aciertosCell.innerHTML = `<span class="ranking-box aciertos-box">${p.aciertos}</span>`;
            }
        });

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

    // ----------------------------------------------------------------
    // LÓGICA PARA DESCARGAR PDF
    // ----------------------------------------------------------------
    
    const btnDescargarPdf = document.getElementById('btn-descargar-pdf');
    if (btnDescargarPdf) {
        btnDescargarPdf.addEventListener('click', () => {
            const originalTitle = document.title;
            document.title = "Resultados_Mega_Polla";
            window.print();
            document.title = originalTitle;
        });
    }

    // INICIO DE CARGA
    cargarDatosDesdeNube();
});