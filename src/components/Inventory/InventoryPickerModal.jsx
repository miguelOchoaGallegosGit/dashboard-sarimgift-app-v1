import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Package, Check } from 'lucide-react';
import { InventoryService } from '../../services/InventoryService';

/**
 * Modal selector de items del inventario.
 * Permite buscar y seleccionar un item para vincularlo a una cotización/pedido.
 * Al seleccionar, retorna: { id, itemNumber, tipo, material, unit_price, imageUrl, ... }
 */
export const InventoryPickerModal = ({ onClose, onSelect }) => {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);

    const fetchItems = useCallback(async (searchTerm = '') => {
        setIsLoading(true);
        try {
            const result = await InventoryService.getInventoryItems(
                { search: searchTerm },
                { page: 1, limit: 50 },
                { field: 'item_number', order: 'asc' }
            );
            setItems(result.items || []);
        } catch (err) {
            console.error('Error fetching inventory for picker:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Debounce de búsqueda
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchItems(search);
        }, 350);
        return () => clearTimeout(timer);
    }, [search, fetchItems]);

    // Cerrar con ESC
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSelect = (item) => {
        setSelectedId(item.id);
        // Pequeño delay visual antes de cerrar
        setTimeout(() => {
            onSelect(item);
            onClose();
        }, 150);
    };

    // Construir descripción del item para el campo de texto
    const buildDescription = (item) => {
        const parts = [item.tipo, item.material, item.modelo, item.size, item.color]
            .filter(Boolean);
        return parts.length > 0 ? parts.join(' - ') : item.itemNumber;
    };

    return (
        <div
            className="modal-overlay inventory-picker-overlay"
            onClick={onClose}
            style={{ zIndex: 1100 }}
        >
            <div
                className="modal-content inventory-picker-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--primary-light)' }}>
                            <Package size={20} color="var(--primary-color)" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Seleccionar del Inventario</h2>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Elige un item para vincularlo al producto
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <X size={20} />
                    </button>
                </div>

                {/* Buscador */}
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search
                            size={16}
                            style={{
                                position: 'absolute', left: '0.75rem', top: '50%',
                                transform: 'translateY(-50%)', color: 'var(--text-muted)'
                            }}
                        />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Buscar por tipo, material..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                            style={{ paddingLeft: '2.25rem' }}
                        />
                    </div>
                </div>

                {/* Lista de items */}
                <div className="inventory-picker-list">
                    {isLoading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto 0.75rem' }} />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando inventario...</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Package size={36} strokeWidth={1.2} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                            <p style={{ margin: 0 }}>No se encontraron items</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <button
                                key={item.id}
                                className={`inventory-picker-item ${selectedId === item.id ? 'selected' : ''}`}
                                onClick={() => handleSelect(item)}
                                type="button"
                            >
                                {/* Imagen */}
                                <div className="picker-item-image">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.tipo || item.itemNumber} />
                                    ) : (
                                        <Package size={22} strokeWidth={1.2} color="var(--text-muted)" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="picker-item-info">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span className="picker-item-number">{item.itemNumber}</span>
                                        <span className="picker-item-category">{item.category}</span>
                                        {item.quantity < 5 && (
                                            <span className="picker-item-low-stock">
                                                Stock bajo: {item.quantity}
                                            </span>
                                        )}
                                    </div>
                                    <div className="picker-item-desc">{buildDescription(item)}</div>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            Stock: <strong style={{ color: item.quantity < 5 ? 'var(--danger-color)' : 'var(--success-color)' }}>{item.quantity}</strong>
                                        </span>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            Precio: <strong style={{ color: 'var(--primary-color)' }}>S/ {item.unit_price.toFixed(2)}</strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Check de selección */}
                                <div className="picker-item-check">
                                    {selectedId === item.id
                                        ? <Check size={18} color="var(--primary-color)" />
                                        : <div className="picker-item-check-circle" />
                                    }
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
