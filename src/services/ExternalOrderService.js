import { supabase } from '../lib/supabaseClient';

/**
 * Transforma datos de Supabase a formato React
 */
const transformExternalOrder = (dbOrder) => {
    if (!dbOrder) return null;

    return {
        id: dbOrder.id,
        orderNumber: dbOrder.order_number,
        customerName: dbOrder.customer_name,
        phone: dbOrder.phone,
        deliveryAddress: dbOrder.delivery_address,
        district: dbOrder.district,
        additionalDetails: dbOrder.additional_details,
        scheduledDeliveryDate: dbOrder.scheduled_delivery_date,
        orderDate: dbOrder.order_date,
        items: dbOrder.items || [],
        createdAt: new Date(dbOrder.created_at).getTime(),
        updatedAt: new Date(dbOrder.updated_at).getTime()
    };
};

/**
 * Transforma item de pedido externo
 */
const transformOrderItem = (dbItem) => {
    if (!dbItem) return null;

    return {
        id: dbItem.id,
        orderId: dbItem.order_id,
        product: dbItem.product,
        quantity: parseInt(dbItem.quantity) || 1,
        unitPrice: parseFloat(dbItem.unit_price) || 0,
        shippingCost: parseFloat(dbItem.shipping_cost) || 0,
        advancePayment: parseFloat(dbItem.advance_payment) || 0,
        totalPrice: (parseInt(dbItem.quantity) || 1) * (parseFloat(dbItem.unit_price) || 0)
    };
};

/**
 * Genera el siguiente número de pedido
 */
const generateOrderNumber = (orders) => {
    if (!orders || orders.length === 0) return 'ORD-EXT-0001';
    const numbers = orders.map(order => {
        const match = (order.order_number || '').match(/ORD-EXT-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    });
    const max = Math.max(...numbers, 0);
    return `ORD-EXT-${String(max + 1).padStart(4, '0')}`;
};

export const ExternalOrderService = {
    /**
     * Obtiene pedidos externos con filtros, paginación y ordenamiento
     */
    getExternalOrders: async (filters = {}, pagination = { page: 1, limit: 20 }, sorting = { field: 'created_at', order: 'desc' }) => {
        try {
            let query = supabase.from('external_orders').select('*, external_order_items(*)', { count: 'exact' });

            // Aplicar filtros
            if (filters.search) {
                query = query.or(`customer_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,order_number.ilike.%${filters.search}%`);
            }

            if (filters.district && filters.district !== '') {
                query = query.eq('district', filters.district);
            }

            // Aplicar ordenamiento
            const sortField = sorting.field === 'customerName' ? 'customer_name' :
                sorting.field === 'deliveryAddress' ? 'delivery_address' :
                    sorting.field === 'createdAt' ? 'created_at' :
                        sorting.field;
            query = query.order(sortField, { ascending: sorting.order === 'asc' });

            // Aplicar paginación
            const from = (pagination.page - 1) * pagination.limit;
            const to = from + pagination.limit - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            const transformedOrders = (data || []).map(order => ({
                ...transformExternalOrder(order),
                items: (order.external_order_items || []).map(transformOrderItem)
            }));

            return {
                orders: transformedOrders,
                total: count || 0,
                page: pagination.page,
                limit: pagination.limit,
                totalPages: Math.ceil((count || 0) / pagination.limit)
            };
        } catch (error) {
            console.error('Error fetching external orders:', error);
            return { orders: [], total: 0, page: 1, limit: pagination.limit, totalPages: 0 };
        }
    },

    /**
     * Obtiene un pedido específico por ID
     */
    getExternalOrderById: async (id) => {
        try {
            const { data, error } = await supabase
                .from('external_orders')
                .select('*, external_order_items(*)')
                .eq('id', id)
                .single();

            if (error) throw error;

            return {
                ...transformExternalOrder(data),
                items: (data.external_order_items || []).map(transformOrderItem)
            };
        } catch (error) {
            console.error('Error fetching external order by ID:', error);
            throw error;
        }
    },

    /**
     * Crea un nuevo pedido externo (Ingresar Cotización)
     */
    createExternalOrder: async (orderData) => {
        try {
            // Validaciones
            if (!orderData.customerName) {
                throw new Error('El nombre del cliente es requerido');
            }

            if (!orderData.phone) {
                throw new Error('El teléfono es requerido');
            }

            if (!orderData.items || orderData.items.length === 0) {
                throw new Error('Debe agregar al menos un producto');
            }

            // Obtener todos los pedidos para generar el siguiente número
            const { data: currentOrders } = await supabase
                .from('external_orders')
                .select('order_number');

            const orderNumber = generateOrderNumber(currentOrders);

            // Crear el pedido
            const { data: newOrder, error: orderError } = await supabase
                .from('external_orders')
                .insert([{
                    order_number: orderNumber,
                    customer_name: orderData.customerName,
                    phone: orderData.phone,
                    delivery_address: orderData.deliveryAddress || null,
                    district: orderData.district || null,
                    additional_details: orderData.additionalDetails || null,
                    scheduled_delivery_date: orderData.scheduledDeliveryDate || null,
                    order_date: orderData.orderDate || new Date().toISOString()
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // Crear los items del pedido
            const itemsToInsert = orderData.items.map(item => ({
                order_id: newOrder.id,
                product: item.product,
                quantity: parseInt(item.quantity) || 1,
                unit_price: parseFloat(item.unitPrice) || 0,
                shipping_cost: parseFloat(item.shippingCost) || 0,
                advance_payment: parseFloat(item.advancePayment) || 0
            }));

            const { data: newItems, error: itemsError } = await supabase
                .from('external_order_items')
                .insert(itemsToInsert)
                .select();

            if (itemsError) throw itemsError;

            return {
                ...transformExternalOrder(newOrder),
                items: (newItems || []).map(transformOrderItem)
            };
        } catch (error) {
            console.error('Error creating external order:', error);
            throw error;
        }
    },

    /**
     * Actualiza un item de pedido externo
     */
    updateExternalOrderItem: async (itemId, updates) => {
        try {
            const updateData = {};

            if (updates.quantity !== undefined) {
                const quantity = parseInt(updates.quantity);
                if (quantity <= 0) throw new Error('La cantidad debe ser mayor a 0');
                updateData.quantity = quantity;
            }

            if (updates.unitPrice !== undefined) {
                const unitPrice = parseFloat(updates.unitPrice);
                if (unitPrice < 0) throw new Error('El precio unitario no puede ser negativo');
                updateData.unit_price = unitPrice;
            }

            if (updates.shippingCost !== undefined) {
                const shippingCost = parseFloat(updates.shippingCost);
                if (shippingCost < 0) throw new Error('El costo de envío no puede ser negativo');
                updateData.shipping_cost = shippingCost;
            }

            if (updates.advancePayment !== undefined) {
                const advancePayment = parseFloat(updates.advancePayment);
                if (advancePayment < 0) throw new Error('El adelanto no puede ser negativo');
                updateData.advance_payment = advancePayment;
            }

            const { data: updatedItem, error } = await supabase
                .from('external_order_items')
                .update(updateData)
                .eq('id', itemId)
                .select()
                .single();

            if (error) throw error;

            return transformOrderItem(updatedItem);
        } catch (error) {
            console.error('Error updating external order item:', error);
            throw error;
        }
    },

    /**
     * Elimina un pedido externo
     */
    deleteExternalOrder: async (id) => {
        try {
            // Primero eliminar los items
            const { error: itemsError } = await supabase
                .from('external_order_items')
                .delete()
                .eq('order_id', id);

            if (itemsError) throw itemsError;

            // Luego eliminar el pedido
            const { error } = await supabase
                .from('external_orders')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting external order:', error);
            return false;
        }
    }
};
