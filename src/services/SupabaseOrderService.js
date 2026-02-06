import { supabase } from '../lib/supabaseClient';

const generateOrderNumber = (orders) => {
    if (!orders || orders.length === 0) return 'PED-0001';
    const numbers = orders.map(o => {
        const match = (o.order_number || '').match(/PED-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    });
    const max = Math.max(...numbers, 0);
    return `PED-${String(max + 1).padStart(4, '0')}`;
};

/**
 * Transform Supabase response to our Order format
 */
const transformSupabaseOrder = (dbOrder) => {
    if (!dbOrder) return null;

    return {
        id: dbOrder.id,
        orderNumber: dbOrder.order_number,
        date: dbOrder.date,
        customerName: dbOrder.customer_name,
        deliveryDate: dbOrder.delivery_date,
        status: dbOrder.status || 'Recibido',
        isDelivered: !!dbOrder.is_delivered,
        isPaid: !!dbOrder.is_paid,
        totalAmount: parseFloat(dbOrder.total_amount) || 0,
        totalAdvance: parseFloat(dbOrder.total_advance) || 0,
        totalBalance: parseFloat(dbOrder.total_balance) || 0,
        createdAt: new Date(dbOrder.created_at).getTime(),
        items: (dbOrder.order_items || []).map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unit_price) || 0,
            amount: parseFloat(item.amount) || 0,
            advance: parseFloat(item.advance) || 0
        }))
    };
};

export const SupabaseOrderService = {
    getOrders: async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(transformSupabaseOrder);
        } catch (error) {
            console.error('Error fetching orders from Supabase:', error);
            return [];
        }
    },

    getOrderById: async (id) => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            return transformSupabaseOrder(data);
        } catch (error) {
            console.error('Error fetching order by ID from Supabase:', error);
            throw error;
        }
    },

    createOrder: async (orderData) => {
        try {
            const items = orderData.items || [];
            const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            const totalAdvance = items.reduce((sum, item) => sum + (Number(item.advance) || 0), 0);
            const totalBalance = totalAmount - totalAdvance;

            // Obtener todas las órdenes para generar el siguiente número
            const { data: currentOrders } = await supabase
                .from('orders')
                .select('order_number');

            const orderNumber = generateOrderNumber(currentOrders);

            // 1. Insertar la cabecera de la orden
            const { data: newOrder, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    order_number: orderNumber,
                    date: orderData.date,
                    customer_name: orderData.customerName,
                    delivery_date: orderData.deliveryDate,
                    status: orderData.status || 'Recibido',
                    is_delivered: !!orderData.isDelivered,
                    is_paid: !!orderData.isPaid,
                    total_amount: totalAmount,
                    total_advance: totalAdvance,
                    total_balance: totalBalance
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Insertar los items si existen
            if (items.length > 0) {
                const itemsToInsert = items.map(item => ({
                    order_id: newOrder.id,
                    description: item.description,
                    quantity: Number(item.quantity) || 1,
                    unit_price: Number(item.unitPrice) || 0,
                    amount: Number(item.amount) || 0,
                    advance: Number(item.advance) || 0
                }));

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(itemsToInsert);

                if (itemsError) throw itemsError;
            }

            // Retornar la orden completa con sus items
            return await SupabaseOrderService.getOrderById(newOrder.id);
        } catch (error) {
            console.error('CRITICAL ERROR in createOrder (Supabase):', error);
            throw error;
        }
    },

    updateOrder: async (id, updates) => {
        try {
            const current = await SupabaseOrderService.getOrderById(id);
            if (!current) throw new Error('Order not found');

            const merged = { ...current, ...updates };

            // Recalcular totales si los items cambiaron
            const items = merged.items || [];
            const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            const totalAdvance = items.reduce((sum, item) => sum + (Number(item.advance) || 0), 0);
            const totalBalance = totalAmount - totalAdvance;

            // Lógica de estado igual a la de Strapi
            let status = merged.status;
            if (merged.isDelivered && merged.isPaid) status = 'Cerrado';
            else if (status === 'Cerrado' && (!merged.isDelivered || !merged.isPaid)) status = 'En Proceso';

            const { data: updatedOrder, error: updateError } = await supabase
                .from('orders')
                .update({
                    customer_name: merged.customerName,
                    delivery_date: merged.deliveryDate,
                    status: status,
                    is_delivered: !!merged.isDelivered,
                    is_paid: !!merged.isPaid,
                    total_amount: totalAmount,
                    total_advance: totalAdvance,
                    total_balance: totalBalance
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Si necesitas actualizar items aquí, tendrías que implementar lógica adicional 
            // (borrar y re-insertar o actualizar por ID). Por ahora replicamos Strapi que actualiza cabecera.

            return await SupabaseOrderService.getOrderById(id);
        } catch (error) {
            console.error('Error updating order in Supabase:', error);
            throw error;
        }
    },

    deleteOrder: async (id) => {
        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting order in Supabase:', error);
            return false;
        }
    }
};
