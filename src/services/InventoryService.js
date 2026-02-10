import { supabase } from '../lib/supabaseClient';

/**
 * Genera el siguiente número de item disponible
 */
const generateItemNumber = (items) => {
    if (!items || items.length === 0) return 'ITEM-0001';
    const numbers = items.map(item => {
        const match = (item.item_number || '').match(/ITEM-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    });
    const max = Math.max(...numbers, 0);
    return `ITEM-${String(max + 1).padStart(4, '0')}`;
};

/**
 * Transforma datos de Supabase (snake_case) a formato React (camelCase)
 */
const transformSupabaseItem = (dbItem) => {
    if (!dbItem) return null;

    return {
        id: dbItem.id,
        itemNumber: dbItem.item_number,
        category: dbItem.category,
        quantity: parseInt(dbItem.quantity) || 0,
        unit_price: parseFloat(dbItem.unit_price) || 0,
        tipo: dbItem.tipo,
        material: dbItem.material,
        modelo: dbItem.modelo,
        diseno: dbItem.diseno,
        size: dbItem.size,
        color: dbItem.color,
        createdAt: new Date(dbItem.created_at).getTime(),
        updatedAt: new Date(dbItem.updated_at).getTime()
    };
};

export const InventoryService = {
    /**
     * Obtiene items del inventario con filtros, paginación y ordenamiento
     */
    getInventoryItems: async (filters = {}, pagination = { page: 1, limit: 20 }, sorting = { field: 'item_number', order: 'asc' }) => {
        try {
            let query = supabase.from('inventory_items').select('*', { count: 'exact' });

            // Aplicar filtros
            if (filters.search) {
                query = query.ilike('tipo', `%${filters.search}%`);
            }

            if (filters.category && filters.category !== '') {
                query = query.eq('category', filters.category);
            }

            // Aplicar ordenamiento
            const sortField = sorting.field === 'itemNumber' ? 'item_number' :
                sorting.field === 'unitPrice' ? 'unit_price' :
                    sorting.field;
            query = query.order(sortField, { ascending: sorting.order === 'asc' });

            // Aplicar paginación
            const from = (pagination.page - 1) * pagination.limit;
            const to = from + pagination.limit - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                items: (data || []).map(transformSupabaseItem),
                total: count || 0,
                page: pagination.page,
                limit: pagination.limit,
                totalPages: Math.ceil((count || 0) / pagination.limit)
            };
        } catch (error) {
            console.error('Error fetching inventory items:', error);
            return { items: [], total: 0, page: 1, limit: pagination.limit, totalPages: 0 };
        }
    },

    /**
     * Obtiene un item específico por ID
     */
    getInventoryItemById: async (id) => {
        try {
            const { data, error } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return transformSupabaseItem(data);
        } catch (error) {
            console.error('Error fetching inventory item by ID:', error);
            throw error;
        }
    },

    /**
     * Crea un nuevo item en el inventario
     */
    createInventoryItem: async (itemData) => {
        try {
            // Validaciones
            if (!itemData.category) {
                throw new Error('La categoría es requerida');
            }

            const quantity = parseInt(itemData.quantity) || 0;
            if (quantity < 0 || quantity > 1000) {
                throw new Error('La cantidad debe estar entre 0 y 1000');
            }

            // Obtener todos los items para generar el siguiente número
            const { data: currentItems } = await supabase
                .from('inventory_items')
                .select('item_number');

            const itemNumber = generateItemNumber(currentItems);

            // Insertar el nuevo item
            const { data: newItem, error } = await supabase
                .from('inventory_items')
                .insert([{
                    item_number: itemNumber,
                    category: itemData.category,
                    quantity: quantity,
                    unit_price: parseFloat(itemData.unit_price) || 0,
                    tipo: itemData.tipo || null,
                    material: itemData.material || null,
                    modelo: itemData.modelo || null,
                    diseno: itemData.diseno || null,
                    size: itemData.size || null,
                    color: itemData.color || null
                }])
                .select()
                .single();

            if (error) throw error;

            return transformSupabaseItem(newItem);
        } catch (error) {
            console.error('Error creating inventory item:', error);
            throw error;
        }
    },

    /**
     * Actualiza solo el stock de un item
     */
    updateInventoryStock: async (id, newQuantity) => {
        try {
            const quantity = parseInt(newQuantity);

            if (isNaN(quantity) || quantity < 0 || quantity > 1000) {
                throw new Error('La cantidad debe estar entre 0 y 1000');
            }

            const { data: updatedItem, error } = await supabase
                .from('inventory_items')
                .update({ quantity: quantity })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return transformSupabaseItem(updatedItem);
        } catch (error) {
            console.error('Error updating inventory stock:', error);
            throw error;
        }
    },

    /**
     * Actualiza un item completo del inventario
     */
    updateInventoryItem: async (id, updates) => {
        try {
            const updateData = {};

            if (updates.category !== undefined) updateData.category = updates.category;
            if (updates.quantity !== undefined) {
                const quantity = parseInt(updates.quantity);
                if (quantity < 0 || quantity > 1000) {
                    throw new Error('La cantidad debe estar entre 0 y 1000');
                }
                updateData.quantity = quantity;
            }
            if (updates.unit_price !== undefined) {
                const unit_price = parseFloat(updates.unit_price);
                if (isNaN(unit_price) || unit_price < 0) {
                    throw new Error('El precio debe ser mayor o igual a 0');
                }
                updateData.unit_price = unit_price;
            }
            if (updates.tipo !== undefined) updateData.tipo = updates.tipo;
            if (updates.material !== undefined) updateData.material = updates.material;
            if (updates.modelo !== undefined) updateData.modelo = updates.modelo;
            if (updates.diseno !== undefined) updateData.diseno = updates.diseno;
            if (updates.size !== undefined) updateData.size = updates.size;
            if (updates.color !== undefined) updateData.color = updates.color;

            const { data: updatedItem, error } = await supabase
                .from('inventory_items')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return transformSupabaseItem(updatedItem);
        } catch (error) {
            console.error('Error updating inventory item:', error);
            throw error;
        }
    },

    /**
     * Elimina un item del inventario
     */
    deleteInventoryItem: async (id) => {
        try {
            const { error } = await supabase
                .from('inventory_items')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting inventory item:', error);
            return false;
        }
    },

    /**
     * Obtiene items con stock bajo (cantidad < 5)
     */
    getLowStockItems: async () => {
        try {
            const { data, error } = await supabase
                .from('inventory_items')
                .select('*')
                .lt('quantity', 5)
                .order('quantity', { ascending: true });

            if (error) throw error;

            return (data || []).map(transformSupabaseItem);
        } catch (error) {
            console.error('Error fetching low stock items:', error);
            return [];
        }
    }
};
