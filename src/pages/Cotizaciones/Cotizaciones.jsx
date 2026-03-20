import React, { useState, useEffect } from 'react';
import { QuotationService } from '../../services/QuotationService';
import { Search, Plus, Eye, ChevronLeft, ChevronRight, Settings, Filter, Trash2, Edit, Send } from 'lucide-react';
import { QuotationDetailModal } from '../../components/Quotation/QuotationDetailModal';
import { NewQuotationModal } from '../../components/Quotation/NewQuotationModal';
import { RejectQuotationModal } from '../../components/Quotation/RejectQuotationModal';

export const Cotizaciones = () => {
    const [quotations, setQuotations] = useState([]);
    const [selectedQuotation, setSelectedQuotation] = useState(null);

    const [isNewQuotationModalOpen, setIsNewQuotationModalOpen] = useState(false);
    const [rejectModal, setRejectModal] = useState({ isOpen: false, quotation: null });
    const [isLoading, setIsLoading] = useState(true);
    const [isAutoSend, setIsAutoSend] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        status: 'TODOS'
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    const [sorting, setSorting] = useState({
        field: 'created_at',
        order: 'desc'
    });

    const [visibleColumns, setVisibleColumns] = useState({
        quotationNumber: true,
        customerName: true,
        phone: true,
        registrationDate: true,
        scheduledDeliveryDate: true,
        status: true,
        totalAmount: true
    });
    const [showColumnSettings, setShowColumnSettings] = useState(false);

    useEffect(() => {
        loadQuotations();
    }, [pagination.page, pagination.limit, sorting, filters]);

    const loadQuotations = async () => {
        setIsLoading(true);
        try {
            const result = await QuotationService.getQuotations(
                filters,
                { page: pagination.page, limit: pagination.limit },
                sorting
            );
            setQuotations(result.quotations);
            setPagination(prev => ({
                ...prev,
                total: result.total,
                totalPages: result.totalPages
            }));
        } catch (error) {
            console.error('Error loading quotations:', error);
            setQuotations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSort = (field) => {
        setSorting(prev => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleLimitChange = (e) => {
        setPagination(prev => ({
            ...prev,
            limit: parseInt(e.target.value),
            page: 1
        }));
    };

    const toggleColumn = (column) => {
        setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    const handleQuotationCreated = () => {
        loadQuotations();
    };

    const handleQuotationUpdated = (updatedQuotation) => {
        setQuotations(prev =>
            prev.map(q => q.id === updatedQuotation.id ? updatedQuotation : q)
        );
    };

    const handleRejectQuotation = (quotation) => {
        setRejectModal({ isOpen: true, quotation });
    };

    const handleSendQuotation = (quotation) => {
        setIsAutoSend(true);
        setSelectedQuotation(quotation);
    };

    const handleCloseDetail = () => {
        setSelectedQuotation(null);
        setIsAutoSend(false);
    };

    const confirmRejectQuotation = async (rejectionReason) => {
        try {
            await QuotationService.rejectQuotation(rejectModal.quotation.id, rejectionReason);
            loadQuotations(); // Reload to refresh status
            setRejectModal({ isOpen: false, quotation: null });
        } catch (error) {
            alert('Error al rechazar la cotización: ' + error.message);
            throw error; // Re-throw para que el modal maneje el error
        }
    };

    const getSortIcon = (field) => {
        if (sorting.field !== field) return '⇅';
        return sorting.order === 'asc' ? '↑' : '↓';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-PE');
    };

    const calculateTotal = (items) => {
        return items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice)) + (parseFloat(item.shippingCost) || 0), 0);
    };

    return (
        <div className="main-content">
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => setIsNewQuotationModalOpen(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} />
                    Ingresar Cotización
                </button>
            </header>

            {/* Filtros */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label className="input-label">
                            <Search size={16} style={{ marginRight: '0.5rem' }} />
                            Buscar
                        </label>
                        <input
                            type="text"
                            name="search"
                            placeholder="Nombre cliente o # cotización..."
                            className="input-field"
                            value={filters.search}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div>
                        <label className="input-label">
                            <Filter size={16} style={{ marginRight: '0.5rem' }} />
                            Estado
                        </label>
                        <select
                            name="status"
                            className="input-field"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="TODOS">Todos</option>
                            <option value="REGISTRADO">Registrado</option>
                            <option value="ACEPTADO">Aceptado</option>
                            <option value="RECHAZADO">Rechazado</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setFilters({ search: '', status: 'TODOS' })}
                        className="btn btn-secondary"
                        style={{ height: '48px' }}
                    >
                        Limpiar Filtros
                    </button>

                </div>
            </div>

            {/* Paginación Superior */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Items por página:</span>
                    <select
                        className="input-field"
                        value={pagination.limit}
                        onChange={handleLimitChange}
                        style={{ width: 'auto', padding: '0.5rem 1rem' }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="pagination-controls">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 1rem' }}
                        >
                            Anterior
                        </button>
                        <span style={{ padding: '0 1rem', color: 'var(--text-muted)' }}>
                            Página {pagination.page} de {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 1rem' }}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            {/* Tabla */}
            {/* Tabla / Cards */}
            <div className="quotations-table-container">
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    {/* Selector de columnas */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', position: 'relative' }}>
                        <button
                            onClick={() => setShowColumnSettings(!showColumnSettings)}
                            className="btn btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Settings size={18} />
                            <span className="hide-on-mobile">Columnas</span>
                        </button>

                        {showColumnSettings && (
                            <div className="glass-panel" style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '0.5rem',
                                padding: '1rem',
                                minWidth: '200px',
                                zIndex: 10,
                                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                            }}>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                    Columnas visibles
                                </p>
                                {Object.keys(visibleColumns).map((key) => (
                                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns[key]}
                                            onChange={() => toggleColumn(key)}
                                        />
                                        <span style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    {visibleColumns.quotationNumber && (
                                        <th onClick={() => handleSort('quotationNumber')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                # Cotización {getSortIcon('quotationNumber')}
                                            </div>
                                        </th>
                                    )}
                                    {visibleColumns.customerName && (
                                        <th onClick={() => handleSort('customerName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                Cliente {getSortIcon('customerName')}
                                            </div>
                                        </th>
                                    )}
                                    {visibleColumns.phone && <th>Teléfono</th>}
                                    {visibleColumns.registrationDate && (
                                        <th onClick={() => handleSort('registrationDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                Fecha Registro {getSortIcon('registrationDate')}
                                            </div>
                                        </th>
                                    )}
                                    {visibleColumns.scheduledDeliveryDate && <th>Fecha Entrega</th>}
                                    {visibleColumns.status && <th>Estado</th>}
                                    {visibleColumns.totalAmount && <th style={{ textAlign: 'right' }}>Total</th>}
                                    <th style={{ textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotations.map((q) => (
                                    <tr key={q.id}>
                                        {visibleColumns.quotationNumber && <td style={{ fontWeight: 'bold' }}>{q.quotationNumber}</td>}
                                        {visibleColumns.customerName && <td>{q.customerName}</td>}
                                        {visibleColumns.phone && <td>{q.phone}</td>}
                                        {visibleColumns.registrationDate && <td>{formatDate(q.registrationDate)}</td>}
                                        {visibleColumns.scheduledDeliveryDate && <td>{formatDate(q.scheduledDeliveryDate)}</td>}
                                        {visibleColumns.status && (
                                            <td>
                                                <span className={`status-badge status-${q.status.toLowerCase()}`}
                                                    style={{
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        backgroundColor: q.status === 'REGISTRADO' ? '#e3f2fd' :
                                                            q.status === 'ACEPTADO' ? '#e8f5e9' : '#ffebee',
                                                        color: q.status === 'REGISTRADO' ? '#1976d2' :
                                                            q.status === 'ACEPTADO' ? '#2e7d32' : '#c62828',
                                                        border: '1px solid transparent',
                                                        display: 'inline-block',
                                                        textAlign: 'center',
                                                        minWidth: '80px'
                                                    }}>
                                                    {q.status}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.totalAmount && (
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                                S/ {calculateTotal(q.items).toFixed(2)}
                                            </td>
                                        )}
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => setSelectedQuotation(q)}
                                                    className="btn-icon"
                                                    title={q.status === 'REGISTRADO' ? 'Editar' : 'Ver Detalle'}
                                                    style={{ color: 'var(--primary-color)' }}
                                                >
                                                    {q.status === 'REGISTRADO' ? <Edit size={18} /> : <Eye size={18} />}
                                                </button>

                                                {q.status === 'REGISTRADO' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleSendQuotation(q)}
                                                            className="btn-icon"
                                                            title="Enviar Cotización"
                                                            style={{ color: 'var(--success-color)' }}
                                                        >
                                                            <Send size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectQuotation(q)}
                                                            className="btn-icon"
                                                            title="Rechazar Cotización"
                                                            style={{ color: 'var(--danger-color)' }}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {quotations.length === 0 && !isLoading && (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                No se encontraron cotizaciones.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Vista Mobile - Cards */}
            <div className="quotations-cards-container">
                {quotations.map((q) => (
                    <div key={q.id} className="quotation-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                                    {q.quotationNumber}
                                </span>
                                <h3 style={{ margin: '0.25rem 0', fontSize: '1.1rem', fontWeight: '700' }}>{q.customerName}</h3>
                                <span className={`status-badge status-${q.status.toLowerCase()}`}
                                    style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        backgroundColor: q.status === 'REGISTRADO' ? '#e3f2fd' :
                                            q.status === 'ACEPTADO' ? '#e8f5e9' : '#ffebee',
                                        color: q.status === 'REGISTRADO' ? '#1976d2' :
                                            q.status === 'ACEPTADO' ? '#2e7d32' : '#c62828',
                                        marginTop: '0.5rem',
                                        display: 'inline-block'
                                    }}>
                                    {q.status}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setSelectedQuotation(q)}
                                    className="btn-icon"
                                    style={{ background: 'var(--primary-light)', color: 'var(--primary-color)' }}
                                >
                                    {q.status === 'REGISTRADO' ? <Edit size={16} /> : <Eye size={16} />}
                                </button>
                                {q.status === 'REGISTRADO' && (
                                    <>
                                        <button
                                            onClick={() => handleSendQuotation(q)}
                                            className="btn-icon"
                                            style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-color)' }}
                                            title="Enviar"
                                        >
                                            <Send size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleRejectQuotation(q)}
                                            className="btn-icon"
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                            <div>
                                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Teléfono</span>
                                <span style={{ fontWeight: '500' }}>{q.phone || '-'}</span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Total</span>
                                <span style={{ fontWeight: '800', color: 'var(--primary-color)', fontSize: '1.1rem' }}>
                                    S/ {calculateTotal(q.items).toFixed(2)}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Fecha Registro</span>
                                <span>{formatDate(q.registrationDate)}</span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Fecha Entrega</span>
                                <span>{formatDate(q.scheduledDeliveryDate)}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {quotations.length === 0 && !isLoading && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                        No se encontraron cotizaciones.
                    </div>
                )}
            </div>

            {/* Paginación Inferior */}
            {pagination.totalPages > 1 && (
                <div className="pagination-controls" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="btn btn-secondary"
                    >
                        Anterior
                    </button>
                    <span style={{ padding: '0 1rem', color: 'var(--text-muted)' }}>
                        Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="btn btn-secondary"
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {selectedQuotation && (
                <QuotationDetailModal
                    quotation={selectedQuotation}
                    onClose={handleCloseDetail}
                    onUpdate={handleQuotationUpdated}
                    autoSend={isAutoSend}
                />
            )}

            <NewQuotationModal
                isOpen={isNewQuotationModalOpen}
                onClose={() => setIsNewQuotationModalOpen(false)}
                onQuotationCreated={handleQuotationCreated}
            />

            <RejectQuotationModal
                isOpen={rejectModal.isOpen}
                onClose={() => setRejectModal({ isOpen: false, quotation: null })}
                onConfirm={confirmRejectQuotation}
                quotationNumber={rejectModal.quotation?.quotationNumber || ''}
            />

            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}
        </div>
    );
};
