document.addEventListener('DOMContentLoaded', () => {

    // ---------------------------------------------------------------------------------------
    // --- CONSTANTES DE CONFIGURACIÓN (MEGA POLLA) ---
    // ---------------------------------------------------------------------------------------

    // --- CLAVES DE ACCESO VÁLIDAS ---
    const CLAVES_VALIDAS = ['29931335', '24175402'];
    // --- NOTA POR DEFECTO PARA JUGADAS SIN CORRECCIÓN ---
    const NOTA_SIN_CORRECCION = "Jugada sin correcciones automáticas.";
    // --- TAMAÑO DE LA JUGADA (CAMBIO CLAVE: DE 5 A 7) ---
    const JUGADA_SIZE = 7; 


    // Funciones de bloqueo y carga (mantenidas)
    function iniciarBloqueo() {
        let accesoConcedido = false;
        let intentos = 0;
        alert("¡Bienvenido al Panel de Administración! Debes ingresar una clave válida para acceder.");
        while (!accesoConcedido && intentos < 3) {
            const claveIngresada = prompt("🔒 Acceso Restringido.\nPor favor, ingresa la clave de administrador para continuar:");
            if (claveIngresada && CLAVES_VALIDAS.includes(claveIngresada.trim())) {
                accesoConcedido = true;
            } else {
                intentos++;
                if (intentos < 3) {
                    alert("Clave incorrecta. Inténtalo de nuevo.");
                } else {
                    document.body.innerHTML = '<h1>❌ ACCESO DENEGADO ❌</h1><p>Se ha superado el límite de intentos.</p>';
                }
            }
        }
        return accesoConcedido;
    }

    if (!iniciarBloqueo()) {
        return;
    }

    let resultados = JSON.parse(localStorage.getItem('pollaFenixResultados')) || [];
    let participantes = JSON.parse(localStorage.getItem('pollaFenixParticipantes')) || [];
    let finanzas = JSON.parse(localStorage.getItem('pollaFenixFinanzas')) || {
        ventas: 197,
        recaudado: 5000.00,
        acumulado1: 2274.00
    };

    const listaResultados = document.getElementById('lista-resultados');
    const listaParticipantes = document.getElementById('lista-participantes');
    const inputBuscarParticipante = document.getElementById('input-buscar-participante');
    
    // Funciones de Backup, Guardado, y Renderizado (Mantenidas)
    function crearBackup() {
        const backup = { participantes: participantes, resultados: resultados, finanzas: finanzas };
        localStorage.setItem('pollaFenixBackup', JSON.stringify(backup));
    }

    function restaurarBackup() {
        const backupString = localStorage.getItem('pollaFenixBackup');
        if (!backupString) {
            alert("No se encontró ninguna copia de seguridad (backup) reciente.");
            return;
        }

        const confirmar = confirm("¿Estás seguro de que quieres restaurar la última copia de seguridad? Esto deshará el último reinicio de datos.");
        if (confirmar) {
            const backup = JSON.parse(backupString);
            participantes = backup.participantes;
            resultados = backup.resultados;
            finanzas = backup.finanzas;
            localStorage.removeItem('pollaFenixBackup');
            guardarYRenderizar();
            alert("¡Copia de seguridad restaurada con éxito! Datos deshechos al estado anterior.");
        }
    }


    function guardarYRenderizar() {
        // Vuelve a numerar los participantes antes de guardar
        participantes.forEach((p, index) => {
            p.nro = index + 1;
        });

        // Actualizar TICKETS VENDIDOS con el conteo de participantes
        finanzas.ventas = participantes.length;

        localStorage.setItem('pollaFenixResultados', JSON.stringify(resultados));
        localStorage.setItem('pollaFenixParticipantes', JSON.stringify(participantes));
        localStorage.setItem('pollaFenixFinanzas', JSON.stringify(finanzas));

        renderFinanzas();
        renderResultados();
        renderParticipantes();
        actualizarBotonDeshacer();
    }

    function renderFinanzas() {
        const inputVentas = document.getElementById('input-ventas');
        const inputRecaudado = document.getElementById('input-recaudado');
        const inputAcumulado = document.getElementById('input-acumulado');

        if (inputVentas) inputVentas.value = finanzas.ventas;
        if (inputRecaudado) inputRecaudado.value = finanzas.recaudado;
        if (inputAcumulado) inputAcumulado.value = finanzas.acumulado1;
    }

    function actualizarBotonDeshacer() {
        const btnDeshacer = document.getElementById('btn-deshacer');
        if (btnDeshacer) {
            if (localStorage.getItem('pollaFenixBackup')) {
                btnDeshacer.style.display = 'inline-block';
            } else {
                btnDeshacer.style.display = 'none';
            }
        }
    }


    // --- A. GESTIÓN DE FINANZAS (mantenida) ---
    const formFinanzas = document.getElementById('form-finanzas');
    if (formFinanzas) {
        formFinanzas.addEventListener('submit', (e) => {
            e.preventDefault();
            // Permite la edición manual, pero se actualizará automáticamente si se agregan/eliminas participantes.
            finanzas.ventas = parseInt(document.getElementById('input-ventas').value);
            finanzas.recaudado = parseFloat(document.getElementById('input-recaudado').value);
            finanzas.acumulado1 = parseFloat(document.getElementById('input-acumulado').value);
            guardarYRenderizar();
            alert('Datos financieros y de ventas guardados.');
        });
    }


    // --- B. GESTIÓN DE RESULTADOS (mantenida) ---
    const formResultados = document.getElementById('form-resultados');
    if (formResultados) {
        formResultados.addEventListener('submit', (e) => {
            e.preventDefault();
            const sorteoHora = document.getElementById('sorteo-hora').value;
            let numero = document.getElementById('numero-ganador').value.trim();

            let numeroGuardado;

            if (numero === '0' || numero.toLowerCase() === 'o') {
                numeroGuardado = 'O';
            } else if (numero === '00') {
                numeroGuardado = '00';
            } else {
                const parsedNum = parseInt(numero);
                if (!isNaN(parsedNum) && parsedNum > 0 && parsedNum <= 99) {
                    numeroGuardado = String(parsedNum).padStart(2, '0');
                } else {
                    alert("Error: El número debe ser 0 (se guarda como O), 00, o un valor entre 1 y 99.");
                    return;
                }
            }

            const nuevoResultado = {
                id: Date.now(),
                sorteo: sorteoHora,
                numero: numeroGuardado
            };

            const index = resultados.findIndex(r => r.sorteo === sorteoHora);
            if (index > -1) {
                resultados[index].numero = numeroGuardado;
                resultados[index].id = Date.now();
            } else {
                resultados.push(nuevoResultado);
            }

            guardarYRenderizar();
            formResultados.reset();
            alert(`Resultado ${numeroGuardado} de ${sorteoHora} guardado.`);
        });
    }

    function habilitarEdicionResultado(liElement, resultadoId) {
        const rIndex = resultados.findIndex(r => r.id === resultadoId);
        if (rIndex === -1) return;
        const r = resultados[rIndex];

        let inputValue = r.numero;
        if (r.numero === 'O') {
            inputValue = '0';
        } else if (r.numero === '00') {
            inputValue = '00';
        }

        const inputsHTML = `
            <span>${r.sorteo}:</span>
            <input type="text" class="editable-input resultado-edit-num" id="edit-resultado-num-${r.id}"
                         value="${inputValue}" min="0" max="99" required style="width: 50px;">
            <button class="btn-guardar" data-id="${r.id}" data-type="resultado">Guardar</button>
        `;
        liElement.innerHTML = inputsHTML;
    }

    function guardarEdicionResultado(resultadoId) {
        const rIndex = resultados.findIndex(r => r.id === resultadoId);
        if (rIndex === -1) return;

        let nuevoNumero = document.getElementById(`edit-resultado-num-${resultadoId}`).value.trim();
        let numeroGuardado;

        if (nuevoNumero === '0' || nuevoNumero.toLowerCase() === 'o') {
            numeroGuardado = 'O';
        } else if (nuevoNumero === '00') {
            numeroGuardado = '00';
        } else {
            const parsedNum = parseInt(nuevoNumero);
            if (!isNaN(parsedNum) && parsedNum > 0 && parsedNum <= 99) {
                numeroGuardado = String(parsedNum).padStart(2, '0');
            } else {
                alert("Error: El número debe ser 0 (se guarda como O), 00, o un valor entre 1 y 99.");
                return;
            }
        }

        resultados[rIndex].numero = numeroGuardado;

        guardarYRenderizar();
        alert(`Resultado ${resultados[rIndex].sorteo} actualizado a ${resultados[rIndex].numero}.`);
    }

    function renderResultados() {
        if (!listaResultados) return;

        listaResultados.innerHTML = '';
        resultados.sort((a, b) => a.sorteo.localeCompare(b.sorteo));
        resultados.forEach(r => {
            const li = document.createElement('li');
            li.setAttribute('data-id', r.id);

            const content = document.createElement('span');
            content.textContent = `${r.sorteo}: ${r.numero}`;
            li.appendChild(content);

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Editar';
            editBtn.className = 'btn-editar';
            editBtn.setAttribute('data-id', r.id);
            editBtn.setAttribute('data-type', 'resultado');

            li.appendChild(editBtn);
            listaResultados.appendChild(li);
        });
    }

    if (listaResultados) {
        listaResultados.addEventListener('click', (e) => {
            const target = e.target;
            const resultadoId = parseInt(target.getAttribute('data-id'));
            const dataType = target.getAttribute('data-type');
            const liElement = target.closest('li');

            if (dataType !== 'resultado') return;

            if (target.classList.contains('btn-editar')) {
                habilitarEdicionResultado(liElement, resultadoId);
            } else if (target.classList.contains('btn-guardar')) {
                guardarEdicionResultado(resultadoId);
            }
        });
    }


    // --- C. GESTIÓN DE PARTICIPANTES ---

    /**
     * Procesa una cadena de jugadas. DEVUELVE UN ARRAY PLANO DE TODOS LOS NÚMEROS FORMATEADOS.
     */
    function getJugadasArray(jugadasString) {
        if (!jugadasString) return [];

        const allNumbers = jugadasString
            // Acepta CUALQUIER símbolo que no sea alfabético (A-Z) para separar números
            .split(/[^0-9A-Z]+/i) 
            .map(num => num.trim())
            .filter(num => num.length > 0)
            .map(num => {

                // ACEPTAR 'O' Y '00' LITERALMENTE PRIMERO
                if (num.toLowerCase() === 'o') {
                    return 'O';
                }
                if (num === '00') {
                    return '00';
                }

                const parsedNum = parseInt(num, 10);

                if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 99) {

                    // Si el número es 0 (y no fue detectado como '00' arriba)
                    if (parsedNum === 0) {
                        return 'O';
                    }
                    // Para el resto (1-9, 10-99)
                    return String(parsedNum).padStart(2, '0');
                }
                return null;
            })
            .filter(num => num !== null);

        return allNumbers;
    }

    /**
     * Agrupa un array plano de números en arrays de tamaño JUGADA_SIZE (7).
     * Devuelve un array de jugadas completas y un array de números restantes.
     * (MODIFICADO PARA USAR JUGADA_SIZE)
     */
    function agruparPorN(allNumbers) {
        const jugadas = [];
        let i = 0;
        while (i < allNumbers.length) {
            const jugada = allNumbers.slice(i, i + JUGADA_SIZE);
            if (jugada.length === JUGADA_SIZE) {
                jugadas.push(jugada);
            } else {
                // El resto son sobrantes/incompletos
                return { jugadas: jugadas, sobrantes: allNumbers.slice(i) };
            }
            i += JUGADA_SIZE;
        }
        return { jugadas: jugadas, sobrantes: [] };
    }


    /**
     * Filtra la lista de participantes en tiempo real usando el input de búsqueda.
     */
    function filtrarParticipantes() {
        if (!inputBuscarParticipante || !listaParticipantes) return;

        const query = inputBuscarParticipante.value.trim().toLowerCase();
        const items = listaParticipantes.querySelectorAll('li');

        items.forEach(li => {
            const id = li.getAttribute('data-id');
            // Busca el objeto participante en el array principal
            const participante = participantes.find(p => p.id === parseInt(id));

            if (participante) {
                // Combina nombre y refe para la búsqueda
                const nombreRefe = `${participante.nombre} ${participante.refe}`.toLowerCase();

                // Si la consulta está vacía O el nombre/refe incluye la consulta
                if (query === '' || nombreRefe.includes(query)) {
                    li.style.display = 'flex'; // Usar 'flex' para mantener el estilo
                } else {
                    li.style.display = 'none';
                }
            }
        });
    }


    /**
     * FUNCIÓN: ELIMINA UN PARTICIPANTE/REGISTRO
     */
    function eliminarParticipante(participanteId) {
        const confirmar = confirm("🚨 ¿Está seguro de que desea ELIMINAR este registro de participante?");

        if (confirmar) {
            // Busca el índice del participante por ID
            const pIndex = participantes.findIndex(p => p.id === participanteId);
            if (pIndex > -1) {
                // Elimina el participante del array
                participantes.splice(pIndex, 1);
                guardarYRenderizar(); // Esto actualizará el conteo de ventas automáticamente
                alert("Registro eliminado con éxito.");
            }
        }
    }


    function habilitarEdicionParticipante(liElement, participanteId) {
        const pIndex = participantes.findIndex(p => p.id === participanteId);
        if (pIndex === -1) return;
        const p = participantes[pIndex];

        const jugadasStr = p.jugadas.join(',');
        const nota = p.notaCorreccion || ''; // Obtener nota

        let inputsHTML = `
            ${p.nro}.
            <input type="text" class="editable-input" id="edit-nombre-${p.id}" value="${p.nombre}" style="width: 150px;">
             (REFE:
            <input type="number" class="editable-input" id="edit-refe-${p.id}" value="${p.refe}" style="width: 60px;">
             ) - **1 Jugada (${JUGADA_SIZE} Nums)**:
            <input type="text" class="editable-input" id="edit-jugadas-${p.id}" value="${jugadasStr}" style="width: 250px;">
            <button class="btn-guardar" data-id="${p.id}" data-type="participante">Guardar</button>
            <button class="btn-eliminar" data-id="${p.id}" data-type="participante" style="margin-left: 5px;">❌ Eliminar</button>
            <br><small>Nota: ${nota}</small>`;

        liElement.innerHTML = inputsHTML;
    }

    function guardarEdicionParticipante(participanteId) {
        const pIndex = participantes.findIndex(p => p.id === participanteId);
        if (pIndex === -1) return;

        const inputNombre = document.getElementById(`edit-nombre-${participanteId}`);
        const inputRefe = document.getElementById(`edit-refe-${participanteId}`);
        const inputJugadas = document.getElementById(`edit-jugadas-${participanteId}`);

        if (!inputNombre || !inputRefe || !inputJugadas) return;

        const nuevoNombre = inputNombre.value;
        const nuevoRefe = inputRefe.value;
        const jugadasStringEditadas = inputJugadas.value;

        const allJugadas = getJugadasArray(jugadasStringEditadas);

        // --- VALIDACIÓN DE TAMAÑO DE JUGADA (CAMBIO CLAVE: AHORA ES 7) ---
        if (allJugadas.length !== JUGADA_SIZE) {
            alert(`Error: Para editar un registro, debes ingresar exactamente ${JUGADA_SIZE} números (una jugada).`);
            return;
        }

        // --- VALIDACIÓN DE DUPLICADOS AL EDITAR ---
        const uniqueJugadas = new Set(allJugadas);
        if (uniqueJugadas.size !== allJugadas.length) {
             alert(`Error: La jugada editada contiene números duplicados (${allJugadas.filter((item, index) => allJugadas.indexOf(item) !== index).join(', ')}). Debe ser corregida.`);
            return;
        }

        participantes[pIndex].nombre = nuevoNombre;
        participantes[pIndex].refe = nuevoRefe;
        participantes[pIndex].jugadas = allJugadas;
        // La nota de corrección no se edita, se mantiene la original

        guardarYRenderizar();
        alert(`Registro ${participantes[pIndex].nro} de ${nuevoNombre} actualizado.`);
    }

    // --- C.1 ENLACE DE VARIABLES DEL FORMULARIO ---
    const formParticipante = document.getElementById('form-participante');
    const inputNombre = document.getElementById('nombre');
    const inputRefe = document.getElementById('refe');
    const inputJugadasProcesadas = document.getElementById('jugadas-procesadas');
    const inputNotas = document.getElementById('notas-correccion'); // Este elemento *DEBE* existir en el HTML

    if (formParticipante) {
        // console.log("✅ Formulario de registro detectado correctamente."); // Descomentar para depuración
        formParticipante.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Verificación crítica de existencia de campos
            if (!inputNombre || !inputRefe || !inputJugadasProcesadas || !inputNotas) {
                 console.error("❌ ERROR CRÍTICO: Faltan inputs del formulario. Verifica que existan #nombre, #refe, #jugadas-procesadas, y #notas-correccion en el HTML.");
                 alert("Error de registro: Faltan campos críticos en el formulario. Contacta al desarrollador.");
                 return;
            }

            const nombre = inputNombre.value;
            const refe = inputRefe.value;
            const jugadasString = inputJugadasProcesadas.value;
            // Se obtienen las notas de corrección serializadas (JSON)
            const notasJSON = inputNotas.value || '[]';
            let notasCorreccion;
            try {
                notasCorreccion = JSON.parse(notasJSON);
            } catch (error) {
                console.error("Error al parsear notas de corrección:", error);
                notasCorreccion = [];
            }


            // Se mantiene la validación de REFE obligatorio si se hace el registro manual.
            if (!refe) {
                alert("Error: El código REFE es obligatorio. Por favor, ingrésalo.");
                inputRefe.focus();
                return;
            }

            // Aquí el string de jugadas ya viene agrupado y separado por '|' por el procesador
            const jugadasAgrupadas = jugadasString.split('|').map(j => j.trim())
                                        .filter(j => j.length > 0)
                                        .map(j => getJugadasArray(j));

            let registrosCreados = 0;
            const participantesParaGuardar = [];

            for (let i = 0; i < jugadasAgrupadas.length; i++) {
                const grupo = jugadasAgrupadas[i];
                // Usa la constante para la nota por defecto
                const nota = notasCorreccion[i] || NOTA_SIN_CORRECCION;

                // --- VALIDACIÓN DE TAMAÑO DE JUGADA (CAMBIO CLAVE: AHORA ES 7) ---
                if (grupo.length === JUGADA_SIZE) {
                    const uniqueJugadas = new Set(grupo);

                    if (uniqueJugadas.size === grupo.length) {
                        const nuevoParticipante = {
                            id: Date.now() + registrosCreados,
                            nombre: nombre,
                            refe: refe,
                            jugadas: grupo,
                            // AQUI: Se añade la nota de corrección
                            notaCorreccion: nota
                        };
                        participantesParaGuardar.push(nuevoParticipante);
                        registrosCreados++;
                    } else {
                        // Si llega aquí, significa que la corrección automática falló al solucionar el duplicado
                        alert(`Error: Se detectó una jugada con duplicados no corregidos: ${grupo.join(', ')}. No se pudo registrar.`);
                        return;
                    }
                } else {
                     // Este caso solo debería ocurrir si el campo de jugadas procesadas fue manipulado manualmente
                     alert(`Error: Se detectó una jugada incompleta o con más de ${JUGADA_SIZE} números en el campo de jugadas procesadas: ${grupo.join(', ')}. Por favor, corrígelo antes de registrar.`);
                     return;
                }
            }

            if (registrosCreados === 0) {
                alert(`Error: No se detectaron jugadas completas (${JUGADA_SIZE} números) válidas en el campo de jugadas procesadas.`);
                return;
            }

            participantes.push(...participantesParaGuardar);
            guardarYRenderizar();
            formParticipante.reset();
            
            // Limpiar el campo oculto después de guardar 
            inputNotas.value = ''; 
            
            alert(`Participante ${nombre} registrado con éxito. Se crearon ${registrosCreados} registros individuales.`);
        });
    } else {
         console.error("❌ ERROR CRÍTICO: No se encontró el formulario principal con ID 'form-participante'.");
    }


    /**
     * FUNCIÓN: Renderiza la lista de participantes. (Mantenida)
     */
    function renderParticipantes() {
        if (!listaParticipantes) return;

        listaParticipantes.innerHTML = '';
        participantes.forEach(p => {
            const li = document.createElement('li');
            li.setAttribute('data-id', p.id);

            const jugadaText = p.jugadas.join(', ');
            // Obtener la nota de corrección (si existe)
            const nota = p.notaCorreccion || '';

            const content = document.createElement('span');
            content.textContent = `${p.nro}. ${p.nombre} (REFE: ${p.refe}) - Jugada: ${jugadaText}`;
            li.appendChild(content);

            // 🚨 INICIO DE LA CORRECCIÓN V4.19 🚨
            if (nota && nota !== NOTA_SIN_CORRECCION) {
                const noteSpan = document.createElement('small');
                
                // Aplicar estilo rojo y negrita si hay corrección
                noteSpan.innerHTML = `
                    <br>
                    <span style="color: red; font-weight: bold;">
                        📝 **Nota de Corrección:** ${nota}
                    </span>
                `;
                noteSpan.style.display = 'block';
                li.appendChild(noteSpan);
            }
            // 🚨 FIN DE LA CORRECCIÓN V4.19 🚨


            // BOTÓN EDITAR
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Editar';
            editBtn.className = 'btn-editar';
            editBtn.setAttribute('data-id', p.id);
            editBtn.setAttribute('data-type', 'participante');

            // BOTÓN ELIMINAR
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '❌ Eliminar';
            deleteBtn.className = 'btn-eliminar';
            deleteBtn.setAttribute('data-id', p.id);
            deleteBtn.setAttribute('data-type', 'participante');

            li.appendChild(editBtn);
            li.appendChild(deleteBtn);
            listaParticipantes.appendChild(li);
        });

        // Aplicar el filtro después de renderizar
        filtrarParticipantes();
    }

    if (listaParticipantes) {
        listaParticipantes.addEventListener('click', (e) => {
            const target = e.target;
            const participanteId = parseInt(target.getAttribute('data-id'));
            const dataType = target.getAttribute('data-type');
            const liElement = target.closest('li');

            if (dataType !== 'participante') return;

            if (target.classList.contains('btn-editar')) {
                habilitarEdicionParticipante(liElement, participanteId);
            } else if (target.classList.contains('btn-guardar')) {
                guardarEdicionParticipante(participanteId);
            } else if (target.classList.contains('btn-eliminar')) {
                eliminarParticipante(participanteId);
            }
        });
    }

    // Activar la búsqueda dinámicamente
    if (inputBuscarParticipante) {
        inputBuscarParticipante.addEventListener('input', renderParticipantes);
    }


    // ---------------------------------------------------------------------------------------
    // --- D. LÓGICA PARA PEGAR Y PROCESAR DATOS DE PARTICIPANTE (ACTUALIZADA A 7 NÚMEROS) ---
    // ---------------------------------------------------------------------------------------
    const inputPasteData = document.getElementById('input-paste-data');
    const btnProcesarPegado = document.getElementById('btn-procesar-pegado');

    function mostrarAlertaProcesamiento(errorMessages) {
        if (errorMessages.length > 0) {
            const fullMessage = "🚨 Se detectaron problemas y se realizaron correcciones/descartes:\n\n" + errorMessages.join('\n');
            alert(fullMessage);
        }
    }


    if (btnProcesarPegado) {
        btnProcesarPegado.addEventListener('click', () => {

            const pastedText = inputPasteData.value.trim();
            if (!pastedText) {
                alert('Por favor, pega los datos del participante en el cuadro de texto.');
                return;
            }

            const normalizedText = pastedText.replace(/\u00A0/g, ' ').replace(/\s{2,}/g, ' ').trim();
            let nombre = '';
            let refe = '';
            // Dividir por línea para la nueva lógica
            let lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const refeRegex = /(Identificación|ID|CI|Refe|C\.I\.|C.I:)\s*:\s*(\d+)/i;
            
            // --- Detección de Nombre y REFE (Mantenida) ---
            let jugadasLines = [...lines];
            const potentialNameLines = [];
            const linesWithJugadas = [];

            jugadasLines.forEach(line => {
                const numbersInLine = getJugadasArray(line);
                const alphaOnly = line.replace(/[^A-ZÁÉÍÓÚÜÑ]/gi, '').trim();
                if (numbersInLine.length === 0 && alphaOnly.length >= 2) {
                    potentialNameLines.push(line);
                } else {
                    linesWithJugadas.push(line);
                }
            });

            if (!nombre && potentialNameLines.length > 0) {
                nombre = potentialNameLines[potentialNameLines.length - 1].trim().toUpperCase();
            }

            for (let line of lines) {
                const refeMatch = line.match(refeRegex);
                if (refeMatch && refeMatch[2]) {
                    refe = refeMatch[2];
                    break;
                }
            }
            // --- Fin Extracción de Nombre y REFE ---

            // ------------------------------------------------------------------------
            // 3. PROCESAMIENTO Y CORRECCIÓN DE LONGITUD POR LÍNEA
            // ------------------------------------------------------------------------
            
            let allCorrectedNumbers = [];
            let currentErrors = [];
            let totalLinesProcessed = 0;

            // Paso 1: Corregir longitud de cada línea que contiene jugadas
            linesWithJugadas.forEach((line) => {
                let numbers = getJugadasArray(line);
                
                if (numbers.length === 0) return;

                totalLinesProcessed++;
                
                // --- CORRECCIÓN DE LONGITUD POR LÍNEA (MODIFICADO: AHORA ES JUGADA_SIZE=7) ---
                if (numbers.length > JUGADA_SIZE) {
                    const numExtra = numbers.length - JUGADA_SIZE;
                    // Los números sobrantes se descartan *de la línea* (el último número)
                    const eliminados = numbers.splice(JUGADA_SIZE); 

                    currentErrors.push(`[Línea ${totalLinesProcessed}] - **Original: ${line}**\n  ⚠️ CORREGIDO: Se eliminaron ${numExtra} números (ej: ${eliminados.join(', ')}) porque la jugada tenía de más.`);
                }
                
                // Si la línea tiene menos de JUGADA_SIZE, se descarta por incompleta y se notifica
                if (numbers.length < JUGADA_SIZE && numbers.length > 0) {
                     currentErrors.push(`[Línea ${totalLinesProcessed}] - **Original: ${line}**\n  ❌ ERROR: Longitud incorrecta. Tiene ${numbers.length} número(s). Se requieren ${JUGADA_SIZE}. (Jugada descartada).`);
                     return;
                }

                // Si tiene JUGADA_SIZE números, se agrega a la lista general
                if (numbers.length === JUGADA_SIZE) {
                    allCorrectedNumbers.push(...numbers);
                }
            });


            // 4. AGRUPACIÓN ESTRICTA Y CORRECCIÓN DE DUPLICADOS
            
            const numJugadasDetectadas = Math.floor(allCorrectedNumbers.length / JUGADA_SIZE);
            // --- USANDO LA FUNCIÓN MODIFICADA agruparPorN ---
            const { jugadas, sobrantes } = agruparPorN(allCorrectedNumbers); 
            
            let jugadasValidasCorregidas = [];
            let notasParaGuardar = []; 
            let jugadaIndexCounter = 0;

            jugadas.forEach((jugada) => {
                 jugadaIndexCounter++;
                 let notaCorreccion = "";
                 let originalJugada = [...jugada]; 

                 // B. VALIDACIÓN Y CORRECCIÓN DE DUPLICADOS INTERNOS
                 const uniqueJugadas = new Set(jugada);

                 if (uniqueJugadas.size !== jugada.length) {
                     const duplicated = jugada.find((num, i) => jugada.indexOf(num) !== i);
                     const duplicatedIndex = jugada.lastIndexOf(duplicated); 

                     const is36Present = jugada.includes('36'); // Mantenemos el número 36 como el de reemplazo
                     
                     // Se asume que el número de reemplazo sigue siendo 36 (o el número que tu sistema use para corrección)
                     const REPLACEMENT_NUMBER = '36';

                     if (jugada.includes(REPLACEMENT_NUMBER)) {
                          // REQUISITO: Si el número de reemplazo ya está, descartar la jugada
                          currentErrors.push(`[Jugada ${jugadaIndexCounter}] - **${originalJugada.join(' ')}**\n  ❌ ERROR: Duplicado de ${duplicated} detectado. No se puede reemplazar por ${REPLACEMENT_NUMBER} porque **${REPLACEMENT_NUMBER} ya está presente** (Jugada descartada).`);
                          return; 
                     } else {
                          // Reemplazar por el número de corrección
                          jugada[duplicatedIndex] = REPLACEMENT_NUMBER;

                          let errorMsg = `Duplicado de ${duplicated} reemplazado por ${REPLACEMENT_NUMBER}.`;
                          currentErrors.push(`[Jugada ${jugadaIndexCounter}] - **Original: ${originalJugada.join(' ')}**\n  ♻️ CORREGIDO: ${errorMsg}`);
                          
                          notaCorreccion += errorMsg;
                     }
                 }

                 // Si la jugada pasó o fue corregida, es válida
                 jugadasValidasCorregidas.push(jugada);
                 // Usa la constante de nota por defecto si no hubo corrección
                 notasParaGuardar.push(notaCorreccion || NOTA_SIN_CORRECCION); 
            });

            // 5. Alertar sobre sobrantes finales
            if (sobrantes.length > 0) {
                 currentErrors.push(`[Final] - **${sobrantes.join(' ')}**\n  ❌ ERROR: Números incompletos (sobrantes). Se detectaron ${sobrantes.length} números al final que **fueron descartados**. (Este error sólo debería ocurrir si se pegan números de más de ${JUGADA_SIZE} al final de la última jugada).`);
            }


            // --- PASO 6: MOSTRAR ALERTA Y ASIGNAR VALORES ---

            mostrarAlertaProcesamiento(currentErrors);

            const jugadasStringParaInput = jugadasValidasCorregidas.map(j => j.join(',')).join(' | ');
            const numJugadasCompletas = jugadasValidasCorregidas.length;

            inputNombre.value = nombre;
            inputRefe.value = refe;
            inputJugadasProcesadas.value = jugadasStringParaInput;
            inputNotas.value = JSON.stringify(notasParaGuardar);

            inputPasteData.value = '';

            alert(`✅ Procesamiento finalizado. Se intentaron detectar ${numJugadasDetectadas} jugadas y se obtuvieron ${numJugadasCompletas} jugadas válidas listas para registrar.`);

            if (!refe) {
                inputRefe.focus();
            }
        });
    }


    // --- E. FUNCIÓN PARA REINICIAR DATOS (mantenida) ---
    const btnReiniciar = document.getElementById('btn-reiniciar-datos');
    if (btnReiniciar) {
        btnReiniciar.addEventListener('click', () => {
            const confirmar = confirm("🚨 ¡ATENCIÓN! ¿Estás seguro de que quieres REINICIAR todos los PARTICIPANTES y RESULTADOS?");

            if (confirmar) {
                const claveReinicio = prompt("Ingresa la clave de administrador para confirmar el reinicio:");

                if (claveReinicio && CLAVES_VALIDAS.includes(claveReinicio.trim())) {
                    crearBackup();

                    participantes = [];
                    resultados = [];

                    finanzas = { ventas: 0, recaudado: 0.00, acumulado1: 0.00 };

                    guardarYRenderizar();
                    alert("✅ ¡Datos reiniciados! Se creó una copia de seguridad para Deshacer. Recuerda actualizar la página principal.");
                } else {
                    alert("❌ Clave incorrecta. El reinicio fue cancelado.");
                }
            }
        });
    }

    // --- F. IMPLEMENTACIÓN BOTÓN DESHACER (mantenida) ---
    if (btnReiniciar) {
        let btnDeshacer = document.getElementById('btn-deshacer');
        if (!btnDeshacer) {
            const reiniciarDiv = btnReiniciar.parentElement;
            btnDeshacer = document.createElement('button');
            btnDeshacer.id = 'btn-deshacer';
            btnDeshacer.textContent = '↩️ Deshacer Último Reinicio';
            btnDeshacer.style.cssText = 'background-color: #6c757d; color: white; margin-top: 10px; padding: 10px; border: none; border-radius: 4px; cursor: pointer; display: none;';
            reiniciarDiv.insertBefore(btnDeshacer, btnReiniciar.nextSibling);
        }
        btnDeshacer.addEventListener('click', restaurarBackup);
    }


    // --- INICIALIZACIÓN ---
    guardarYRenderizar();
});