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
    PieChart
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/activos';

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

    // Cálculo de Totales Generales
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

                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg border border-slate-600"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        {loading ? "Cargando..." : "Resetear"}
                    </button>
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
                            <thead className="bg-gradient-to-b from-slate-100 to-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b-2 border-gray-300 sticky top-0 z-20">
                            <tr>
                                <th className="p-4 sticky left-0 bg-gradient-to-b from-slate-100 to-slate-50 z-20 border-r-2 border-gray-300 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.1)]">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-800 text-sm font-black">Código</span>
                                        <span className="text-[11px] text-slate-600 font-semibold">CeCo / Descripción</span>
                                    </div>
                                </th>
                                <th className="p-4 text-right bg-blue-100/60 text-blue-900 border-r-2 border-blue-200 text-sm font-bold">Depre %</th>
                                <th className="p-4 text-right bg-orange-100/60 text-orange-900 border-r-2 border-orange-200 text-sm font-bold">Acum. Inicio</th>

                                {mesesCols.map(m => {
                                    const esActivo = mesSeleccionado === m.num;
                                    return (
                                        <th key={m.key} className={`p-3 min-w-[100px] text-center transition-all border-r-2 ${esActivo ? 'bg-emerald-200 border-emerald-400 shadow-md shadow-emerald-200' : 'bg-white border-gray-200 hover:bg-slate-50'}`}>
                                            <button
                                                onClick={() => calcularMes(m.num)}
                                                disabled={calculando}
                                                className={`w-full h-full flex flex-col items-center justify-center py-2 gap-1.5 rounded transition-all ${esActivo ? 'text-emerald-900 font-black scale-105' : 'text-slate-500 hover:text-emerald-700 font-semibold'}`}
                                                title={`Calcular hasta ${m.label}`}
                                            >
                                                <span className="text-sm">{m.label}</span>
                                                {calculando && esActivo ? (
                                                    <RefreshCw size={14} className="animate-spin text-emerald-700" />
                                                ) : (
                                                    <Play size={12} className={`transition-colors ${esActivo ? "fill-emerald-900 text-emerald-900" : "fill-current"}`} />
                                                )}
                                            </button>
                                        </th>
                                    );
                                })}

                                <th className="p-4 text-right bg-emerald-100/60 text-emerald-900 border-l-2 border-emerald-200 text-sm font-bold">Total 2025</th>
                                <th className="p-4 text-right bg-purple-100/60 text-purple-900 border-l-2 border-purple-200 text-sm font-bold">Total Acum.</th>
                                <th className="p-4 text-right bg-gray-200 text-gray-900 border-l-2 border-gray-400 text-sm font-black">Costo Neto</th>
                                <th className="p-4 text-right bg-gray-100 text-gray-700 border-l-2 border-gray-300 text-sm font-bold">Valor Histórico</th>
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
                                    <tr key={idx} className="hover:bg-emerald-50 transition-colors group border-b border-gray-100">
                                        <td className="p-3 sticky left-0 bg-white group-hover:bg-emerald-50 border-r-2 border-gray-300 min-w-[220px] max-w-[250px] overflow-hidden shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)]">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <span className="font-bold text-slate-800 truncate font-mono text-sm" title={activo.codigo}>{activo.codigo}</span>
                                                <span className="text-xs px-2 py-1 bg-slate-100 rounded-md text-slate-600 font-bold flex-shrink-0" title="Centro de Costo">{activo.ceco || '-'}</span>
                                            </div>
                                            <div className="text-xs text-slate-600 line-clamp-2" title={activo.descripcion}>{activo.descripcion || "Sin descripción"}</div>
                                        </td>

                                        <td className="p-3 text-right font-bold text-blue-700 bg-blue-50/30 border-r-2 border-blue-200 text-sm">
                                            {activo.porcentajeDepreciacion ? `${(activo.porcentajeDepreciacion * 100).toFixed(0)}%` : '0%'}
                                        </td>

                                        <td className="p-3 text-right text-slate-700 bg-orange-50/30 font-semibold border-r-2 border-orange-200 text-sm font-mono">
                                            {formatearDinero(activo.depAcumuladaInicio)}
                                        </td>

                                        {mesesCols.map(m => (
                                            <td key={m.key} className={`p-3 text-right font-mono text-slate-700 border-r border-dotted border-gray-200 text-sm transition-colors ${mesSeleccionado === m.num ? 'bg-emerald-100/50 text-emerald-900 font-bold border-r-2 border-emerald-300' : 'bg-white hover:bg-slate-50'}`}>
                           <span className={activo[m.key] > 0 ? "text-slate-900 font-bold" : "text-gray-400 font-medium"}>
                             {activo[m.key] ? formatearDinero(activo[m.key]) : '-'}
                           </span>
                                            </td>
                                        ))}

                                        <td className="p-3 text-right font-bold text-emerald-800 bg-emerald-50/40 border-l-2 border-emerald-200 text-sm">
                                            {formatearDinero(activo.totalDepreciacion2025)}
                                        </td>
                                        <td className="p-3 text-right font-bold text-purple-800 bg-purple-50/40 border-l-2 border-purple-200 text-sm">
                                            {formatearDinero(activo.totalDepreciacionAcumulada)}
                                        </td>
                                        <td className="p-3 text-right font-black text-slate-900 bg-gray-200/50 border-l-2 border-gray-400 text-sm">
                                            {formatearDinero(activo.costoNeto)}
                                        </td>
                                        <td className="p-3 text-right text-slate-700 border-l-2 border-gray-300 text-sm font-semibold">
                                            {formatearDinero(activo.valorHistorico)}
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