import { STRAPI_CONFIG, getAuthHeaders } from '../config/strapi';

const generateOrderNumber = (count) => `PED-${String(count + 1).padStart(4, '0')}`;

/**
 * Transform Strapi response to our Order format
 */
const transformStrapiOrder = (strapiOrder) => {
    if (!strapiOrder) return null;

    // Strapi 5 puede venir plano o con attributes
    const data = strapiOrder.attributes ? { id: strapiOrder.id, ...strapiOrder.attributes } : strapiOrder;
    const { documentId, orden_items, ...fields } = data;

    const appId = documentId || data.id.toString();
    const itemsData = orden_items || [];

    return {
        id: appId,
        numericId: data.id,
        orderNumber: fields.orderNumber,
        date: fields.date,
        customerName: fields.customerName,
        deliveryDate: fields.deliveryDate,
        status: fields.statusOrden || 'Recibido',
        isDelivered: !!fields.isDelivered,
        isPaid: !!fields.isPaid,
        totalAmount: parseFloat(fields.totalAmount) || 0,
        totalAdvance: parseFloat(fields.totalAdvance) || 0,
        totalBalance: parseFloat(fields.totalBalance) || 0,
        createdAt: new Date(fields.createdAt).getTime(),
        items: itemsData.map(item => ({
            id: item.documentId || item.id.toString(),
            description: item.description,
            quantity: item.quantity,
            amount: parseFloat(item.amount) || 0,
            advance: parseFloat(item.advance) || 0
        }))
    };
};

const transformToStrapiPayload = (order) => {
    return {
        data: {
            orderNumber: order.orderNumber,
            date: order.date,
            customerName: order.customerName,
            deliveryDate: order.deliveryDate,
            statusOrden: order.status || 'Recibido',
            isDelivered: !!order.isDelivered,
            isPaid: !!order.isPaid,
            totalAmount: Number(order.totalAmount) || 0,
            totalAdvance: Number(order.totalAdvance) || 0,
            totalBalance: Number(order.totalBalance) || 0
        }
    };
};

export const StrapiOrderService = {
    getOrders: async () => {
        try {
            const url = `${STRAPI_CONFIG.url}${STRAPI_CONFIG.endpoints.orders}?populate=orden_items&sort=createdAt:desc`;
            const response = await fetch(url, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();
            return (result.data || []).map(transformStrapiOrder);
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
    },

    getOrderById: async (id) => {
        try {
            const url = `${STRAPI_CONFIG.url}${STRAPI_CONFIG.endpoints.orders}/${id}?populate=orden_items`;
            const response = await fetch(url, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();
            return transformStrapiOrder(result.data);
        } catch (error) {
            console.error('Error fetching order by ID:', error);
            throw error;
        }
    },

    createOrder: async (orderData) => {
        try {
            const items = orderData.items || [];
            const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            const totalAdvance = items.reduce((sum, item) => sum + (Number(item.advance) || 0), 0);
            const totalBalance = totalAmount - totalAdvance;

            const currentOrders = await StrapiOrderService.getOrders();
            const orderNumber = generateOrderNumber(currentOrders.length);

            const payload = transformToStrapiPayload({
                ...orderData,
                orderNumber,
                totalAmount, totalAdvance, totalBalance
            });

            console.log('Sending Order Header:', payload);

            const orderResponse = await fetch(`${STRAPI_CONFIG.url}${STRAPI_CONFIG.endpoints.orders}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (!orderResponse.ok) {
                const err = await orderResponse.json();
                console.error('Order Header Error:', err);
                throw new Error('Header creation failed');
            }

            const orderResult = await orderResponse.json();
            const createdOrder = orderResult.data;
            const orderDocId = createdOrder.documentId;
            const orderNumericId = createdOrder.id;

            console.log('Order Header Created. Numeric ID:', orderNumericId, 'Doc ID:', orderDocId);

            if (items.length > 0) {
                console.log('Creating', items.length, 'items...');
                const itemPromises = items.map(async (item) => {
                    const itemPayload = {
                        data: {
                            description: item.description,
                            quantity: Number(item.quantity) || 1,
                            amount: Number(item.amount) || 0,
                            advance: Number(item.advance) || 0,
                            orden: orderDocId // <--- PRUEBA: Usamos DocumentID en lugar de NumericID
                        }
                    };

                    const res = await fetch(`${STRAPI_CONFIG.url}${STRAPI_CONFIG.endpoints.orderItems}`, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify(itemPayload)
                    });

                    if (!res.ok) {
                        const errDetail = await res.json();
                        console.error('ITEM ERROR DETAIL:', errDetail);
                        throw new Error(`Item error: ${JSON.stringify(errDetail)}`);
                    }
                    return res.json();
                });

                await Promise.all(itemPromises);
                console.log('All items created successfully');
            }

            return await StrapiOrderService.getOrderById(orderDocId);
        } catch (error) {
            console.error('CRITICAL ERROR in createOrder:', error);
            throw error;
        }
    },

    updateOrder: async (id, updates) => {
        try {
            const current = await StrapiOrderService.getOrderById(id);
            const merged = { ...current, ...updates };

            const items = merged.items || [];
            merged.totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            merged.totalAdvance = items.reduce((sum, item) => sum + (Number(item.advance) || 0), 0);
            merged.totalBalance = merged.totalAmount - merged.totalAdvance;

            if (merged.isDelivered && merged.isPaid) merged.status = 'Cerrado';
            else if (merged.status === 'Cerrado' && (!merged.isDelivered || !merged.isPaid)) merged.status = 'En Proceso';

            const response = await fetch(`${STRAPI_CONFIG.url}${STRAPI_CONFIG.endpoints.orders}/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(transformToStrapiPayload(merged))
            });

            if (!response.ok) throw new Error(`Update HTTP ${response.status}`);
            return await StrapiOrderService.getOrderById(id);
        } catch (error) {
            console.error('Error updating order:', error);
            throw error;
        }
    },

    deleteOrder: async (id) => {
        try {
            const response = await fetch(`${STRAPI_CONFIG.url}${STRAPI_CONFIG.endpoints.orders}/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            return response.ok;
        } catch (error) {
            console.error('Error deleting order:', error);
            return false;
        }
    }
};
