import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Edit3, Eye, EyeOff, Settings } from 'lucide-react';

export const InventoryGrid = ({ items, onUpdateStock, sorting, onSortChange }) => {
    const [visibleColumns, setVisibleColumns] = useState({
        itemNumber: true,
        name: true,
        category: true,
        quantity: true,
        cost: true,
        tipo: true,
        material: true,
        modelo: false,
        diseno: false
    });

    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const columns = [
        { key: 'itemNumber', label: 'Item #', alwaysVisible: true },
        { key: 'name', label: 'Nombre', alwaysVisible: false },
        { key: 'category', label: 'Categoría', alwaysVisible: false },
        { key: 'quantity', label: 'Cantidad', alwaysVisible: false },
        { key: 'cost', label: 'Costo', alwaysVisible: false },
        { key: 'tipo', label: 'Tipo', alwaysVisible: false },
        { key: 'material', label: 'Material', alwaysVisible: false },
        { key: 'modelo', label: 'Modelo', alwaysVisible: false },
        { key: 'diseno', label: 'Diseño', alwaysVisible: false }
    ];

    const toggleColumn = (columnKey) => {
        setVisibleColumns(prev => ({ ...prev, [columnKey]: !prev[columnKey] }));
    };

    const handleSort = (field) => {
        if (sorting.field === field) {
            onSortChange({ field, order: sorting.order === 'asc' ? 'desc' : 'asc' });
        } else {
            onSortChange({ field, order: 'asc' });
        }
    };

    const getSortIcon = (field) => {
        if (sorting.field !== field) return <ArrowUpDown size={14} />;
        return sorting.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
    };

    const getStockBadgeColor = (quantity) => {
        if (quantity === 0) return { bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger-color)', border: 'var(--danger-color)' };
        if (quantity < 5) return { bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger-color)', border: 'var(--danger-color)' };
        if (quantity <= 20) return { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning-color)', border: 'var(--warning-color)' };
        return { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-color)', border: 'var(--success-color)' };
    };

    return (
        <>
            {/* Selector de columnas */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', position: 'relative' }}>
                <button
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Settings size={18} />
                    <span className="hide-on-mobile">Columnas</span>
                </button>

                {showColumnSelector && (
                    <div className="column-selector glass-panel" style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.5rem',
                        padding: '1rem',
                        zIndex: 10,
                        minWidth: '200px'
                    }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Columnas Visibles</h4>
                        {columns.map(col => (
                            <label
                                key={col.key}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem',
                                    cursor: col.alwaysVisible ? 'not-allowed' : 'pointer',
                                    opacity: col.alwaysVisible ? 0.5 : 1
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={visibleColumns[col.key]}
                                    onChange={() => !col.alwaysVisible && toggleColumn(col.key)}
                                    disabled={col.alwaysVisible}
                                    style={{ cursor: col.alwaysVisible ? 'not-allowed' : 'pointer' }}
                                />
                                <span style={{ fontSize: '0.9rem' }}>{col.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Vista Desktop - Tabla */}
            <div className="inventory-table-container">
                <table className="inventory-table">
                    <thead>
                        <tr>
                            {columns.map(col => (
                                visibleColumns[col.key] && (
                                    <th key={col.key} onClick={() => handleSort(col.key)} style={{ cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {col.label}
                                            {getSortIcon(col.key)}
                                        </div>
                                    </th>
                                )
                            ))}
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => {
                            const stockColors = getStockBadgeColor(item.quantity);
                            const isLowStock = item.quantity < 5;

                            return (
                                <tr key={item.id} className={isLowStock ? 'low-stock-row' : ''}>
                                    {visibleColumns.itemNumber && (
                                        <td>
                                            <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {item.itemNumber}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.name && (
                                        <td>
                                            <strong>{item.name}</strong>
                                        </td>
                                    )}
                                    {visibleColumns.category && (
                                        <td>
                                            <span className="category-badge">{item.category}</span>
                                        </td>
                                    )}
                                    {visibleColumns.quantity && (
                                        <td>
                                            <span className="stock-badge" style={{
                                                background: stockColors.bg,
                                                color: stockColors.color,
                                                border: `1px solid ${stockColors.border}30`,
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontWeight: '700',
                                                fontSize: '0.85rem'
                                            }}>
                                                {item.quantity}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.cost && (
                                        <td>
                                            <span style={{ fontWeight: '600', color: 'var(--success-color)' }}>
                                                S/ {item.cost.toFixed(2)}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.tipo && (
                                        <td>{item.tipo || '-'}</td>
                                    )}
                                    {visibleColumns.material && (
                                        <td>{item.material || '-'}</td>
                                    )}
                                    {visibleColumns.modelo && (
                                        <td>{item.modelo || '-'}</td>
                                    )}
                                    {visibleColumns.diseno && (
                                        <td>{item.diseno || '-'}</td>
                                    )}
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => onUpdateStock(item)}
                                            className="btn-icon"
                                            style={{ background: 'rgba(99, 102, 241, 0.2)' }}
                                            title="Actualizar Stock"
                                        >
                                            <Edit3 size={16} color="var(--primary-color)" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Vista Mobile - Cards */}
            <div className="inventory-cards-container">
                {items.map(item => {
                    const stockColors = getStockBadgeColor(item.quantity);
                    const isLowStock = item.quantity < 5;

                    return (
                        <div key={item.id} className={`inventory-card glass-panel ${isLowStock ? 'low-stock-card' : ''}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        {item.itemNumber}
                                    </span>
                                    <h3 style={{ margin: '0.25rem 0', fontSize: '1.1rem' }}>{item.name}</h3>
                                    <span className="category-badge" style={{ fontSize: '0.75rem' }}>{item.category}</span>
                                </div>
                                <button
                                    onClick={() => onUpdateStock(item)}
                                    className="btn-icon"
                                    style={{ background: 'rgba(99, 102, 241, 0.2)' }}
                                >
                                    <Edit3 size={16} color="var(--primary-color)" />
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Cantidad</span>
                                    <span className="stock-badge" style={{
                                        background: stockColors.bg,
                                        color: stockColors.color,
                                        border: `1px solid ${stockColors.border}30`,
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontWeight: '700',
                                        display: 'inline-block',
                                        marginTop: '0.25rem'
                                    }}>
                                        {item.quantity}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Costo</span>
                                    <strong style={{ fontSize: '1rem', color: 'var(--success-color)' }}>S/ {item.cost.toFixed(2)}</strong>
                                </div>
                                {item.tipo && (
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Tipo</span>
                                        <span>{item.tipo}</span>
                                    </div>
                                )}
                                {item.material && (
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Material</span>
                                        <span>{item.material}</span>
                                    </div>
                                )}
                                {item.modelo && (
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Modelo</span>
                                        <span>{item.modelo}</span>
                                    </div>
                                )}
                                {item.diseno && (
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Diseño</span>
                                        <span>{item.diseno}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1.1rem' }}>No hay items en el inventario.</p>
                </div>
            )}
        </>
    );
};
