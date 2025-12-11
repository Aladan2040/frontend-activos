import React, { useState, useEffect, useMemo } from 'react';
import {
    Play,
    RefreshCw,
    DollarSign,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Filter,
    Database,
    TrendingUp,
    Wallet,
    PieChart,
    Download
} from 'lucide-react';

// URL dinámica
let apiUrl = 'http://localhost:8080/api/activos';
try {
    if (import.meta && import.meta.env && import.meta.env.VITE_API_URL) {
        apiUrl = import.meta.env.VITE_API_URL;
    }
} catch (e) {
    console.warn("Usando localhost por defecto.");
}
const API_URL = apiUrl;

function App() {
    const [activos, setActivos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesSeleccionado, setMesSeleccionado] = useState(null);
    const [calculando, setCalculando] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [busqueda, setBusqueda] = useState("");

    // Paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const [filasPorPagina, setFilasPorPagina] = useState(50);
    const [inputPagina, setInputPagina] = useState(1);

    // Estado para controlar la carga de la librería de Excel
    const [libreriaExcelCargada, setLibreriaExcelCargada] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    useEffect(() => {
        setInputPagina(paginaActual);
    }, [paginaActual]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                cache: 'no-store'
            });

            if (!response.ok) throw new Error("Error en servidor");
            const data = await response.json();
            setActivos(data);
            setMesSeleccionado(null);

            console.log(`Datos recibidos: ${data.length} registros`);
        } catch (error) {
            console.error(error);
            mostrarMensaje("error", "Error conectando con Backend.");
        } finally {
            setLoading(false);
        }
    };

    const calcularMes = async (numeroMes) => {
        if (calculando) return;
        setCalculando(true);
        setMesSeleccionado(numeroMes);

        try {
            const response = await fetch(`${API_URL}/calcular/${numeroMes}`, { method: 'POST' });

            if (response.ok) {
                const datosCalculados = await response.json();
                setActivos(datosCalculados);
                mostrarMensaje("success", `Vista preliminar de ${obtenerNombreMes(numeroMes)} generada.`);
            } else {
                mostrarMensaje("error", "Error al calcular.");
            }
        } catch (error) {
            mostrarMensaje("error", "Error de conexión.");
        } finally {
            setCalculando(false);
        }
    };

    // --- FUNCIÓN EXPORTAR A .XLSX (REAL) USANDO CDN ---
    const exportarExcel = () => {
        if (activosFiltrados.length === 0) {
            mostrarMensaje("error", "No hay datos para exportar.");
            return;
        }

        const generarArchivo = () => {
            // 1. Preparar los datos en formato JSON plano (Orden modificado)
            const datosExcel = activosFiltrados.map(a => ({
                "Código": a.codigo,
                "CeCo": a.ceco || "",
                "Descripción": a.descripcion,
                "Valor Histórico": a.valorHistorico, // MOVIDO AQUÍ (Después de Descripción)
                "% Depre": a.porcentajeDepreciacion ? (a.porcentajeDepreciacion * 100).toFixed(0) + '%' : '0%',
                "Acum. Inicio": a.depAcumuladaInicio,

                "Ene-25": a.ene || 0,
                "Feb-25": a.feb || 0,
                "Mar-25": a.mar || 0,
                "Abr-25": a.abr || 0,
                "May-25": a.may || 0,
                "Jun-25": a.jun || 0,
                "Jul-25": a.jul || 0,
                "Ago-25": a.ago || 0,
                "Set-25": a.set || 0,
                "Oct-25": a.oct || 0,
                "Nov-25": a.nov || 0,
                "Dic-25": a.dic || 0,

                "Total 2025": a.totalDepreciacion2025,
                "Total Acumulado": a.totalDepreciacionAcumulada,
                "Costo Neto": a.costoNeto
            }));

            // 2. Usar la librería XLSX (SheetJS) cargada globalmente
            const ws = window.XLSX.utils.json_to_sheet(datosExcel);

            // Ajustar ancho de columnas automáticamente (opcional pero estético)
            const wscols = [
                {wch: 15}, {wch: 10}, {wch: 40}, {wch: 12}, {wch: 8}, {wch: 12}, // Ajustado para nuevo orden
                {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10},
                {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10},
                {wch: 12}, {wch: 15}, {wch: 12}
            ];
            ws['!cols'] = wscols;

            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, ws, "Depreciación 2025");

            // 3. Descargar archivo .xlsx
            const fecha = new Date().toISOString().split('T')[0];
            window.XLSX.writeFile(wb, `Reporte_Depreciacion_${fecha}.xlsx`);

            mostrarMensaje("success", "Archivo .xlsx generado correctamente.");
        };

        // Lógica de carga dinámica de la librería
        if (window.XLSX) {
            generarArchivo();
        } else {
            mostrarMensaje("success", "Preparando motor de Excel...");
            const script = document.createElement('script');
            script.src = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
            script.async = true;
            script.onload = () => {
                setLibreriaExcelCargada(true);
                generarArchivo();
            };
            script.onerror = () => {
                mostrarMensaje("error", "No se pudo cargar la librería de Excel. Verifica tu conexión.");
            };
            document.body.appendChild(script);
        }
    };

    const mostrarMensaje = (tipo, texto) => {
        setMensaje({ tipo, texto });
        setTimeout(() => setMensaje(null), 5000);
    };

    const formatearDinero = (monto) => {
        if (monto === null || monto === undefined) return "-";
        return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto);
    };

    const obtenerNombreMes = (num) => {
        const meses = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];
        return meses[num];
    };

    const mesesCols = [
        { key: 'ene', label: 'Ene-25', num: 1 },
        { key: 'feb', label: 'Feb-25', num: 2 },
        { key: 'mar', label: 'Mar-25', num: 3 },
        { key: 'abr', label: 'Abr-25', num: 4 },
        { key: 'may', label: 'May-25', num: 5 },
        { key: 'jun', label: 'Jun-25', num: 6 },
        { key: 'jul', label: 'Jul-25', num: 7 },
        { key: 'ago', label: 'Ago-25', num: 8 },
        { key: 'set', label: 'Set-25', num: 9 },
        { key: 'oct', label: 'Oct-25', num: 10 },
        { key: 'nov', label: 'Nov-25', num: 11 },
        { key: 'dic', label: 'Dic-25', num: 12 },
    ];

    const activosFiltrados = useMemo(() => {
        if (!busqueda) return activos;

        return activos.filter(a =>
            (a.ceco && a.ceco.toLowerCase().includes(busqueda.toLowerCase())) ||
            (a.codigo && a.codigo.toLowerCase().includes(busqueda.toLowerCase()))
        );
    }, [activos, busqueda]);

    const totales = useMemo(() => {
        return activosFiltrados.reduce((acc, curr) => ({
            depAcumuladaInicio: acc.depAcumuladaInicio + (curr.depAcumuladaInicio || 0),
            totalDepreciacion2025: acc.totalDepreciacion2025 + (curr.totalDepreciacion2025 || 0),
            totalDepreciacionAcumulada: acc.totalDepreciacionAcumulada + (curr.totalDepreciacionAcumulada || 0),
            valorHistorico: acc.valorHistorico + (curr.valorHistorico || 0),
            costoNeto: acc.costoNeto + (curr.costoNeto || 0)
        }), {
            depAcumuladaInicio: 0,
            totalDepreciacion2025: 0,
            totalDepreciacionAcumulada: 0,
            valorHistorico: 0,
            costoNeto: 0
        });
    }, [activosFiltrados]);

    const indiceUltimoActivo = paginaActual * filasPorPagina;
    const indicePrimerActivo = indiceUltimoActivo - filasPorPagina;
    const activosActuales = activosFiltrados.slice(indicePrimerActivo, indiceUltimoActivo);
    const totalPaginas = Math.ceil(activosFiltrados.length / filasPorPagina);

    const siguientePagina = () => setPaginaActual(prev => Math.min(prev + 1, totalPaginas));
    const anteriorPagina = () => setPaginaActual(prev => Math.max(prev - 1, 1));

    const manejarSaltoPagina = (e) => {
        e.preventDefault();
        const valor = Math.max(1, Math.min(Number(inputPagina), totalPaginas));
        setPaginaActual(valor);
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col">
            {/* --- HEADER --- */}
            <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-40">
                <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
                            <DollarSign className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Sistema de Activos Fijos</h1>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Database size={10} className="text-emerald-400"/>
                                Base de Datos: {activos.length > 0 ? activos.length.toLocaleString() : '...'} registros
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center gap-1 group-focus-within:text-emerald-400 transition-colors">
                            <Filter size={14} />
                            <span className="text-[10px] font-bold uppercase">CeCo</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por CeCo o Código..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-full py-2 pl-16 pr-4 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none placeholder-slate-500 transition-all shadow-inner"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        {/* BOTÓN DE EXPORTAR EXCEL (.XLSX) */}
                        <button
                            onClick={exportarExcel}
                            disabled={loading || activosFiltrados.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg border border-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Descargar tabla actual en formato Excel real (.xlsx)"
                        >
                            <Download size={16} />
                            <span className="hidden sm:inline">Exportar .xlsx</span>
                        </button>

                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg border border-slate-600"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            {loading ? "Cargando..." : "Resetear"}
                        </button>
                    </div>
                </div>
            </header>

            {/* --- DASHBOARD DE TOTALES (KPIs) --- */}
            <div className="bg-white border-b border-gray-200 shadow-sm p-4 sticky top-[72px] z-30">
                <div className="max-w-[1920px] mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

                        {/* Tarjeta 1: Valor Histórico */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-slate-200 rounded-md text-slate-600"><Wallet size={14}/></div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Histórico</p>
                            </div>
                            <p className="text-lg md:text-xl font-bold text-slate-700 truncate" title={formatearDinero(totales.valorHistorico)}>
                                {formatearDinero(totales.valorHistorico)}
                            </p>
                        </div>

                        {/* Tarjeta 2: Acumulado Inicio (Naranja) */}
                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-orange-200 rounded-md text-orange-700"><TrendingUp size={14}/></div>
                                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Acum. Inicio</p>
                            </div>
                            <p className="text-lg md:text-xl font-bold text-orange-800 truncate" title={formatearDinero(totales.depAcumuladaInicio)}>
                                {formatearDinero(totales.depAcumuladaInicio)}
                            </p>
                        </div>

                        {/* Tarjeta 3: Depreciación 2025 (Esmeralda - Principal) */}
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow ring-1 ring-emerald-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                            <div className="flex items-center gap-2 mb-1 relative z-10">
                                <div className="p-1.5 bg-emerald-200 rounded-md text-emerald-700"><Calendar size={14}/></div>
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total 2025</p>
                            </div>
                            <p className="text-lg md:text-xl font-black text-emerald-800 truncate relative z-10" title={formatearDinero(totales.totalDepreciacion2025)}>
                                {formatearDinero(totales.totalDepreciacion2025)}
                            </p>
                        </div>

                        {/* Tarjeta 4: Total Acumulado (Morado) */}
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-purple-200 rounded-md text-purple-700"><PieChart size={14}/></div>
                                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Total Acumulado</p>
                            </div>
                            <p className="text-lg md:text-xl font-bold text-purple-800 truncate" title={formatearDinero(totales.totalDepreciacionAcumulada)}>
                                {formatearDinero(totales.totalDepreciacionAcumulada)}
                            </p>
                        </div>

                        {/* Tarjeta 5: Costo Neto (Gris Oscuro) */}
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm hover:shadow-md transition-shadow text-white">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-slate-600 rounded-md text-slate-200"><DollarSign size={14}/></div>
                                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Costo Neto</p>
                            </div>
                            <p className="text-lg md:text-xl font-bold text-white truncate" title={formatearDinero(totales.costoNeto)}>
                                {formatearDinero(totales.costoNeto)}
                            </p>
                        </div>

                    </div>
                </div>
            </div>

            {/* --- TABLA DE DATOS --- */}
            <div className="p-4 max-w-[1920px] mx-auto flex-1 overflow-hidden flex flex-col">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        <table className="w-full text-xs text-left whitespace-nowrap relative">
                            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-gray-200 sticky top-0 z-20">
                            <tr>
                                <th className="p-3 sticky left-0 bg-slate-50 z-20 border-r border-gray-200 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)]">
                                    <div className="flex flex-col">
                                        <span className="text-slate-700">Código / CeCo</span>
                                        {/* --- Eliminado Valor Histórico de aquí --- */}
                                    </div>
                                </th>

                                <th className="p-3 bg-white border-r border-gray-200 min-w-[200px]">Detalle del Activo</th>

                                {/* --- VALOR HISTÓRICO MOVIDO AQUÍ --- */}
                                <th className="p-3 text-right bg-slate-100 text-slate-700 border-r border-slate-200">Valor Hist.</th>

                                <th className="p-3 text-right bg-blue-50/50 text-blue-800 border-r border-blue-50">% Depre</th>
                                <th className="p-3 text-right bg-orange-50/50 text-orange-800 border-r border-orange-50">Acum. Inicio</th>

                                {mesesCols.map(m => {
                                    const esActivo = mesSeleccionado === m.num;
                                    return (
                                        <th key={m.key} className={`p-1 min-w-[80px] text-center transition-all border-r border-gray-100 ${esActivo ? 'bg-emerald-100 border-emerald-200' : 'bg-white hover:bg-slate-50'}`}>
                                            <button
                                                onClick={() => calcularMes(m.num)}
                                                disabled={calculando}
                                                className={`w-full h-full flex flex-col items-center justify-center py-2 gap-1 rounded ${esActivo ? 'text-emerald-800' : 'text-slate-400 hover:text-emerald-600'}`}
                                                title={`Calcular hasta ${m.label}`}
                                            >
                                                <span className={`text-[10px] ${esActivo ? 'font-black' : ''}`}>{m.label}</span>
                                                {calculando && esActivo ? (
                                                    <RefreshCw size={12} className="animate-spin text-emerald-600" />
                                                ) : (
                                                    <Play size={10} className={`transition-colors ${esActivo ? "fill-emerald-700 text-emerald-700" : "fill-current"}`} />
                                                )}
                                            </button>
                                        </th>
                                    );
                                })}

                                <th className="p-3 text-right bg-emerald-50 text-emerald-900 border-l border-emerald-100">Total 2025</th>
                                <th className="p-3 text-right bg-purple-50 text-purple-900 border-l border-purple-100">Total Acum.</th>
                                <th className="p-3 text-right bg-gray-100 text-gray-900 font-black border-l border-gray-200">Costo Neto</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-50">
                            {loading && activos.length === 0 ? (
                                <tr>
                                    <td colSpan={20} className="p-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                                            </div>
                                            <span className="text-lg font-medium text-slate-500">Cargando base de datos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                activosActuales.map((activo, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="p-2 sticky left-0 bg-white group-hover:bg-blue-50/50 border-r border-gray-100 max-w-xs overflow-hidden shadow-[4px_0_10px_-2px_rgba(0,0,0,0.02)]">
                                            <div className="flex justify-between items-baseline gap-2">
                                                <span className="font-bold text-slate-700 truncate font-mono text-[11px]" title={activo.codigo}>{activo.codigo}</span>
                                                <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-medium" title="Centro de Costo">{activo.ceco || '-'}</span>
                                            </div>
                                        </td>

                                        <td className="p-2 border-r border-gray-100 max-w-md">
                                            <div className="text-[10px] text-slate-500 truncate" title={activo.descripcion}>{activo.descripcion || "Sin descripción"}</div>
                                        </td>

                                        {/* --- VALOR HISTÓRICO MOVIDO AQUÍ --- */}
                                        <td className="p-2 text-right text-slate-600 bg-slate-50/50 font-mono border-r border-slate-100">
                                            {formatearDinero(activo.valorHistorico)}
                                        </td>

                                        <td className="p-2 text-right font-medium text-blue-600 bg-blue-50/20 border-r border-blue-50/50">
                                            {activo.porcentajeDepreciacion ? `${(activo.porcentajeDepreciacion * 100).toFixed(0)}%` : '0%'}
                                        </td>

                                        <td className="p-2 text-right text-slate-600 bg-orange-50/20 font-mono border-r border-orange-50/50">
                                            {formatearDinero(activo.depAcumuladaInicio)}
                                        </td>

                                        {mesesCols.map(m => (
                                            <td key={m.key} className={`p-2 text-right font-mono text-slate-500 border-r border-dotted border-gray-100 ${mesSeleccionado === m.num ? 'bg-emerald-50/20 text-emerald-800 font-semibold' : ''}`}>
                           <span className={activo[m.key] > 0 ? "text-slate-800 font-medium" : "text-gray-300"}>
                             {activo[m.key] ? formatearDinero(activo[m.key]) : '-'}
                           </span>
                                            </td>
                                        ))}

                                        <td className="p-2 text-right font-bold text-emerald-700 bg-emerald-50/30 border-l border-emerald-100">
                                            {formatearDinero(activo.totalDepreciacion2025)}
                                        </td>
                                        <td className="p-2 text-right font-medium text-purple-700 bg-purple-50/30 border-l border-purple-100">
                                            {formatearDinero(activo.totalDepreciacionAcumulada)}
                                        </td>
                                        <td className="p-2 text-right font-black text-slate-900 bg-gray-100 border-l border-gray-200">
                                            {/* --- CORRECCIÓN CRÍTICA: USAR activo.costoNeto EN LUGAR DE totales.costoNeto --- */}
                                            {formatearDinero(activo.costoNeto)}
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
                        <div className="hidden md:block">
                            Mostrando <span className="font-semibold">{indicePrimerActivo + 1} - {Math.min(indiceUltimoActivo, activosFiltrados.length)}</span> de <span className="font-bold text-slate-900">{activosFiltrados.length.toLocaleString()}</span> registros
                            {busqueda && <span className="ml-1 text-emerald-600">(Filtrado)</span>}
                        </div>

                        <div className="flex items-center gap-2 mx-auto md:mx-0">
                            <button onClick={() => setPaginaActual(1)} disabled={paginaActual === 1} className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"><ChevronsLeft size={16} /></button>
                            <button onClick={anteriorPagina} disabled={paginaActual === 1} className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>

                            <div className="flex items-center gap-2 mx-2 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                                <span className="font-medium">Página</span>
                                <form onSubmit={manejarSaltoPagina}>
                                    <input
                                        type="number"
                                        min={1}
                                        max={totalPaginas}
                                        value={inputPagina}
                                        onChange={(e) => setInputPagina(e.target.value)}
                                        className="w-12 text-center bg-transparent focus:outline-none font-bold text-slate-800"
                                    />
                                </form>
                                <span className="text-slate-400">/ {totalPaginas.toLocaleString()}</span>
                            </div>

                            <button onClick={siguientePagina} disabled={paginaActual === totalPaginas || totalPaginas === 0} className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
                            <button onClick={() => setPaginaActual(totalPaginas)} disabled={paginaActual === totalPaginas || totalPaginas === 0} className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"><ChevronsRight size={16} /></button>

                            <div className="ml-4 flex items-center gap-2 border-l border-gray-300 pl-4">
                                <span>Filas:</span>
                                <select
                                    value={filasPorPagina}
                                    onChange={(e) => { setFilasPorPagina(Number(e.target.value)); setPaginaActual(1); }}
                                    className="bg-transparent font-bold focus:outline-none cursor-pointer"
                                >
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={500}>500</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {mensaje && (
                <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl text-white flex items-center gap-3 animate-bounce z-50 ${mensaje.tipo === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    {mensaje.tipo === 'success' ? <CheckCircle2 /> : <AlertCircle />}
                    <span className="font-medium">{mensaje.texto}</span>
                </div>
            )}
        </div>
    );
}

export default App;