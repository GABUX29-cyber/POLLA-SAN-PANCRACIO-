document.addEventListener('DOMContentLoaded', () => {

    // ---------------------------------------------------------------------------------------
    // --- NUEVO SISTEMA DE SEGURIDAD (REEMPLAZA AL PROMPT) ---
    // ---------------------------------------------------------------------------------------
    const loginOverlay = document.getElementById('login-overlay');
    const contenidoPrincipal = document.getElementById('contenido-principal');
    const btnEntrar = document.getElementById('btn-entrar');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

    // Función para Iniciar Sesión
    btnEntrar.addEventListener('click', async () => {
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        const { data, error } = await _supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            loginError.style.display = 'block';
            loginError.textContent = "Datos incorrectos: " + error.message;
        } else {
            // Login exitoso
            loginOverlay.style.display = 'none';
            contenidoPrincipal.style.display = 'block';
            cargarDatosDesdeNube();
        }
    });

    // Función para Cerrar Sesión
    btnCerrarSesion.addEventListener('click', async () => {
        await _supabase.auth.signOut();
        window.location.reload();
    });

    // Verificar si ya hay una sesión activa al cargar la página
    async function verificarSesion() {
        const { data: { session } } = await _supabase.auth.getSession();
        if (session) {
            loginOverlay.style.display = 'none';
            contenidoPrincipal.style.display = 'block';
            cargarDatosDesdeNube();
        }
    }
    verificarSesion();

    // --- VARIABLES GLOBALES ACTUALIZADAS ---
    const JUGADA_SIZE = 6; 

    let participantes = [];
    let resultados = [];
    let finanzas = { 
        ventas: 0, 
        recaudado: 0.00, 
        acumulado1: 0.00, 
        acumulado2: 0.00,
        modalidad: '1_premio' // Nueva propiedad para la modalidad
    };

    // ---------------------------------------------------------------------------------------
    // --- 1. FUNCIÓN DE PROCESAMIENTO (REGLAS DE NEGOCIO PARA 6 NÚMEROS) ---
    // ---------------------------------------------------------------------------------------
    function procesarYValidarJugada(numerosRaw, nombreParticipante) {
        let numeros = numerosRaw.map(n => {
            let num = n.trim().padStart(2, '0');
            if (num === "00") return "00";
            if (parseInt(num) === 0) return "O"; 
            return num;
        });

        let avisos = [];
        let avisosAlert = [];

        // Regla: Máximo 6 números (elimina el sobrante)
        if (numeros.length > JUGADA_SIZE) {
            let eliminados = [];
            while (numeros.length > JUGADA_SIZE) {
                eliminados.push(numeros.pop());
            }
            let msg = `Se eliminó el sobrante (${eliminados.join(', ')})`;
            avisos.push(msg);
            avisosAlert.push(`⚠️ ${msg}`);
        }

        // Validación: Mínimo 6 números
        if (numeros.length < JUGADA_SIZE) {
            alert(`❌ ERROR en ${nombreParticipante}: Solo tiene ${numeros.length} números.`);
            return null;
        }

        // Gestión de Duplicados
        let counts = {};
        let duplicadosEncontrados = [];
        numeros.forEach(n => counts[n] = (counts[n] || 0) + 1);
        
        for (let n in counts) {
            if (counts[n] > 1) {
                duplicadosEncontrados.push(n);
            }
        }

        if (duplicadosEncontrados.length > 0) {
            let sePudoCorregir = true;
            duplicadosEncontrados.forEach(dup => {
                if (!numeros.includes("36")) {
                    let index = numeros.lastIndexOf(dup);
                    numeros[index] = "36";
                    let msg = `Duplicado (${dup}) reemplazado por 36`;
                    avisos.push(msg);
                    avisosAlert.push(`🔄 ${msg}`);
                } else {
                    sePudoCorregir = false;
                }
            });

            if (!sePudoCorregir) {
                alert(`🚫 JUGADA NULA (${nombreParticipante}): Hay duplicados (${duplicadosEncontrados.join(', ')}) y el 36 ya existe.`);
                return null;
            }
        }

        if (avisosAlert.length > 0) {
            alert(`📝 CAMBIOS AUTOMÁTICOS EN ${nombreParticipante}:\n\n${avisosAlert.join('\n')}`);
        }

        return { 
            numeros: numeros, 
            nota: avisos.length > 0 ? `📝 Auto-corrección: ${avisos.join('. ')}` : "" 
        };
    }

    // ---------------------------------------------------------------------------------------
    // --- 2. CARGA Y ACTUALIZACIÓN EN SUPABASE ---
    // ---------------------------------------------------------------------------------------
    async function cargarDatosDesdeNube() {
        try {
            const { data: p } = await _supabase.from('participantes').select('*').order('nro', { ascending: true });
            const { data: r } = await _supabase.from('resultados').select('*').order('id', { ascending: false });
            const { data: f } = await _supabase.from('finanzas').select('*').single();

            if (p) participantes = p;
            if (r) resultados = r;
            if (f) finanzas = f;

            if (p && f && p.length !== f.ventas) {
                await _supabase.from('finanzas').update({ ventas: p.length }).eq('id', 1);
                finanzas.ventas = p.length;
            }

            renderizarTodo();
        } catch (error) {
            console.error("Error al cargar datos:", error);
        }
    }

    // ---------------------------------------------------------------------------------------
    // --- 3. FUNCIONES DE EDICIÓN ---
    // ---------------------------------------------------------------------------------------
    
    window.editarResultadoNube = async (id, sorteoActual, numeroActual) => {
        const nuevoNumeroRaw = prompt(`Editar resultado para ${sorteoActual}:`, numeroActual);
        if (nuevoNumeroRaw === null || nuevoNumeroRaw.trim() === "") return;

        let numFinal = (nuevoNumeroRaw === "0" || (parseInt(nuevoNumeroRaw) === 0 && nuevoNumeroRaw !== "00")) ? "O" : nuevoNumeroRaw.trim().padStart(2, '0');

        const { error } = await _supabase
            .from('resultados')
            .update({ numero: numFinal })
            .eq('id', id);

        if (error) alert("Error al editar resultado");
        else cargarDatosDesdeNube();
    };

    window.editarParticipanteNube = async (id, nombreAct, refeAct, jugadasAct) => {
        const nuevoNombre = prompt("Nombre:", nombreAct);
        if (nuevoNombre === null) return;
        const nuevasJugadasStr = prompt("Jugadas (separadas por coma):", jugadasAct);
        if (nuevasJugadasStr === null) return;
        const motivo = prompt("Motivo de la edición (ej: Error en REFE):", "Manual");

        const notaEdicion = `⚠️ Editado: ${motivo}`;

        const { error } = await _supabase
            .from('participantes')
            .update({ 
                nombre: nuevoNombre, 
                jugadas: nuevasJugadasStr.split(','),
                notas_correccion: notaEdicion 
            })
            .eq('id', id);

        if (error) alert("Error al editar participante");
        else cargarDatosDesdeNube();
    };

    window.eliminarParticipanteNube = async (id) => {
        if (confirm("¿Eliminar definitivamente a este participante?")) {
            await _supabase.from('participantes').delete().eq('id', id);
            cargarDatosDesdeNube();
        }
    };

    // ---------------------------------------------------------------------------------------
    // --- 4. GESTIÓN DE FORMULARIOS ---
    // ---------------------------------------------------------------------------------------

    document.getElementById('form-finanzas').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Captura de valores del formulario
        finanzas.ventas = parseInt(document.getElementById('input-ventas').value);
        finanzas.recaudado = parseFloat(document.getElementById('input-recaudado').value);
        finanzas.acumulado1 = parseFloat(document.getElementById('input-acumulado').value);
        
        // Capturar modalidad de reparto
        const selectModalidad = document.getElementById('modalidad-reparto');
        if (selectModalidad) {
            finanzas.modalidad = selectModalidad.value;
        }

        // Incluir acumulado2
        const inputAc2 = document.getElementById('input-acumulado2');
        if (inputAc2) {
            finanzas.acumulado2 = parseFloat(inputAc2.value);
        }
        
        // Actualización en Supabase
        const { error } = await _supabase.from('finanzas').update({
            ventas: finanzas.ventas,
            recaudado: finanzas.recaudado,
            acumulado1: finanzas.acumulado1,
            acumulado2: finanzas.acumulado2,
            modalidad: finanzas.modalidad
        }).eq('id', 1);

        if (error) alert("Error al actualizar finanzas");
        else { alert("✅ Finanzas actualizadas."); cargarDatosDesdeNube(); }
    });

    document.getElementById('form-resultados').addEventListener('submit', async (e) => {
        e.preventDefault();
        const sorteoHora = document.getElementById('sorteo-hora').value;
        let numRaw = document.getElementById('numero-ganador').value.trim();
        let numFinal = (numRaw === "0" || (parseInt(numRaw) === 0 && numRaw !== "00")) ? "O" : numRaw.padStart(2, '0');

        const { data: existente } = await _supabase
            .from('resultados')
            .select('sorteo')
            .eq('sorteo', sorteoHora)
            .maybeSingle();

        if (existente) {
            alert(`🚫 Ya ingresaste un resultado para ${sorteoHora}.\n\nPara cambiarlo, búscalo abajo y dale a Editar o Eliminar.`);
            return;
        }

        const nuevoRes = {
            sorteo: sorteoHora,
            numero: numFinal
        };
        const { error } = await _supabase.from('resultados').insert([nuevoRes]);
        if (!error) { 
            e.target.reset(); 
            cargarDatosDesdeNube(); 
        }
    });

    document.getElementById('btn-procesar-pegado').addEventListener('click', () => {
        const rawData = document.getElementById('input-paste-data').value;
        const lineas = rawData.split('\n').map(l => l.trim()).filter(l => l !== "");
        let jugadasFinales = [];
        let nombre = "Sin Nombre", refe = "";

        lineas.forEach(linea => {
            const matches = linea.match(/\b\d{1,2}\b/g);
            if (matches && matches.length >= 4) {
                for (let i = 0; i < matches.length; i += JUGADA_SIZE) {
                    let grupo = matches.slice(i, i + JUGADA_SIZE);
                    if (grupo.length >= 4) {
                        jugadasFinales.push(grupo.join(','));
                    }
                }
            } else if (linea.toLowerCase().includes("refe") || linea.toLowerCase().includes("identificación")) {
                refe = linea.replace(/\D/g, "");
            } else if (linea.length > 3 && !refe) {
                nombre = linea.toUpperCase();
            }
        });

        document.getElementById('nombre').value = nombre;
        document.getElementById('refe').value = refe;
        document.getElementById('jugadas-procesadas').value = jugadasFinales.join(' | ');

        alert("✅ DATOS PROCESADOS AL RECUADRO\n\nPor favor, revisa el Nombre, el REFE y las Jugadas antes de presionar el botón de Registrar.");
    });

    document.getElementById('form-participante').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombreBase = document.getElementById('nombre').value.trim();
        const refe = document.getElementById('refe').value.trim();
        const jugadasRaw = document.getElementById('jugadas-procesadas').value.split('|').map(s => s.trim()).filter(s => s !== "");

        if (!refe) return alert("El REFE es obligatorio");

        for (let jugadaStr of jugadasRaw) {
            let numSucios = jugadaStr.split(/[,/]/).map(n => n.trim()).filter(n => n !== "");
            let procesado = procesarYValidarJugada(numSucios, nombreBase);

            if (procesado) {
                const { count } = await _supabase.from('participantes').select('*', { count: 'exact', head: true });
                const proximoNro = (count || 0) + 1;

                const nuevaJugada = {
                    nro: proximoNro,
                    nombre: nombreBase,
                    refe: refe,
                    jugadas: procesado.numeros,
                    notas_correccion: procesado.nota
                };

                await _supabase.from('participantes').insert([nuevaJugada]);
            }
        }
        e.target.reset();
        document.getElementById('input-paste-data').value = ""; 
        cargarDatosDesdeNube(); 
    });

    // ---------------------------------------------------------------------------------------
    // --- 5. RENDERIZADO ---
    // ---------------------------------------------------------------------------------------
    function renderizarTodo() {
        // Actualizar campos del formulario con datos de la nube
        const inputVentas = document.getElementById('input-ventas');
        if (inputVentas) inputVentas.value = participantes.length;

        const inputRecaudado = document.getElementById('input-recaudado');
        if (inputRecaudado) inputRecaudado.value = finanzas.recaudado;

        const inputAcumulado = document.getElementById('input-acumulado');
        if (inputAcumulado) inputAcumulado.value = finanzas.acumulado1;

        const inputAcumulado2 = document.getElementById('input-acumulado2');
        if (inputAcumulado2) inputAcumulado2.value = finanzas.acumulado2 || 0;
        
        const selectModalidad = document.getElementById('modalidad-reparto');
        if (selectModalidad && finanzas.modalidad) {
            selectModalidad.value = finanzas.modalidad;
        }

        // Cálculos financieros (20% Casa y 5% Domingo)
        const montoCasa = (finanzas.recaudado * 0.20).toFixed(2);
        const montoDomingo = (finanzas.recaudado * 0.05).toFixed(2);
        
        const elCasa = document.getElementById('casa-valor');
        if (elCasa) elCasa.textContent = `${montoCasa} BS`;

        const elDomingo = document.getElementById('domingo-valor');
        if (elDomingo) elDomingo.textContent = `${montoDomingo} BS`;

        // Renderizar Resultados
        const listaRes = document.getElementById('lista-resultados');
        listaRes.innerHTML = '';
        resultados.forEach((res) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${res.sorteo}: <strong>${res.numero}</strong></span> 
                <div>
                    <button class="btn-editar" onclick="editarResultadoNube(${res.id}, '${res.sorteo}', '${res.numero}')">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarResultadoNube(${res.id})">Eliminar</button>
                </div>`;
            listaRes.appendChild(li);
        });

        // Renderizar Participantes
        const listaPart = document.getElementById('lista-participantes');
        listaPart.innerHTML = '';
        participantes.forEach(p => {
            const li = document.createElement('li');
            const aviso = p.notas_correccion ? `<div style="color:red; font-size:0.8em;">${p.notas_correccion}</div>` : "";
            li.innerHTML = `
                <div style="flex-grow:1;">
                    <strong>#${p.nro} - ${p.nombre}</strong> (Refe: ${p.refe}) <br>
                    <small>${p.jugadas.join(', ')}</small>
                    ${aviso}
                </div>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-editar" style="background-color: #ffc107; color: black; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold;" onclick="editarParticipanteNube(${p.id}, '${p.nombre}', '${p.refe}', '${p.jugadas}')">Editar</button>
                    <button class="btn-eliminar" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold;" onclick="eliminarParticipanteNube(${p.id})">Eliminar</button>
                </div>`;
            listaPart.appendChild(li);
        });
    }

    window.eliminarResultadoNube = async (id) => {
        if (confirm("¿Eliminar este resultado?")) {
            await _supabase.from('resultados').delete().eq('id', id);
            cargarDatosDesdeNube();
        }
    };

    // ---------------------------------------------------------------------------------------
    // --- 6. FUNCIÓN DE REINICIO CON DOBLE CANDADO ---
    // ---------------------------------------------------------------------------------------
    const btnReiniciar = document.getElementById('btn-reiniciar-datos');
    if (btnReiniciar) {
        btnReiniciar.addEventListener('click', async () => {
            const confirmar1 = confirm("⚠️ ATENCIÓN CRÍTICA:\n¿Estás totalmente seguro de borrar TODOS los participantes y resultados para iniciar una nueva semana?");
            
            if (confirmar1) {
                const confirmacionTexto = prompt("Para confirmar la eliminación permanente, escribe la palabra: BORRAR");

                if (confirmacionTexto === "BORRAR") {
                    try {
                        const { error: errP } = await _supabase.from('participantes').delete().gt('id', 0);
                        const { error: errR } = await _supabase.from('resultados').delete().gt('id', 0);

                        if (errP || errR) {
                            alert("❌ Error de permisos: Solo el Administrador puede realizar esta acción.");
                        } else {
                            alert("✅ SISTEMA REINICIADO:\nSe han borrado todos los registros con éxito.");
                            window.location.reload();
                        }
                    } catch (err) {
                        alert("❌ Error de conexión con el servidor.");
                    }
                } else {
                    alert("❌ Palabra incorrecta. Acción cancelada.");
                }
            }
        });
    }
});