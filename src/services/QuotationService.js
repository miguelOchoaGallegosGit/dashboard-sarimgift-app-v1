import { supabase } from '../lib/supabaseClient';
import { SupabaseOrderService } from './SupabaseOrderService';

const transformQuotation = (dbQuotation) => {
    if (!dbQuotation) return null;
    return {
        id: dbQuotation.id,
        quotationNumber: dbQuotation.quotation_number,
        customerName: dbQuotation.customer_name,
        phone: dbQuotation.phone,
        registrationDate: dbQuotation.registration_date,
        scheduledDeliveryDate: dbQuotation.scheduled_delivery_date,
        status: dbQuotation.status,
        rejectionReason: dbQuotation.rejection_reason,
        relatedOrderId: dbQuotation.related_order_id,
        advancePayment: parseFloat(dbQuotation.advance_payment) || 0,
        items: (dbQuotation.quotation_items || []).map(transformQuotationItem),
        createdAt: new Date(dbQuotation.created_at).getTime(),
        updatedAt: new Date(dbQuotation.updated_at).getTime()
    };
};

const transformQuotationItem = (dbItem) => {
    if (!dbItem) return null;
    return {
        id: dbItem.id,
        quotationId: dbItem.quotation_id,
        product: dbItem.product,
        quantity: parseInt(dbItem.quantity) || 1,
        unitPrice: parseFloat(dbItem.unit_price) || 0,
        shippingCost: parseFloat(dbItem.shipping_cost) || 0,
        totalPrice: (parseInt(dbItem.quantity) || 1) * (parseFloat(dbItem.unit_price) || 0),
        inventoryItemId: dbItem.inventory_item_id || null,
        // Si se hizo join con inventory_items, incluir datos del item
        inventoryItem: dbItem.inventory_items ? {
            id: dbItem.inventory_items.id,
            itemNumber: dbItem.inventory_items.item_number,
            tipo: dbItem.inventory_items.tipo,
            material: dbItem.inventory_items.material,
            modelo: dbItem.inventory_items.modelo,
            size: dbItem.inventory_items.size,
            color: dbItem.inventory_items.color,
            imageUrl: dbItem.inventory_items.image_url || null,
            unit_price: parseFloat(dbItem.inventory_items.unit_price) || 0
        } : null
    };
};

const generateQuotationNumber = (currentQuotations) => {
    if (!currentQuotations || currentQuotations.length === 0) return 'COT-0001';

    // Extract numbers from existing IDs to find max
    const numbers = currentQuotations
        .map(q => {
            const match = (q.quotation_number || '').match(/COT-(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        });

    const max = Math.max(...numbers, 0);
    return `COT-${String(max + 1).padStart(4, '0')}`;
};

export const QuotationService = {
    getQuotations: async (filters = {}, pagination = { page: 1, limit: 10 }, sorting = { field: 'created_at', order: 'desc' }) => {
        try {
            let query = supabase.from('quotations').select('*, quotation_items(*, inventory_items(id, item_number, tipo, material, modelo, size, color, image_url, unit_price))', { count: 'exact' });

            // Filters
            if (filters.search) {
                query = query.or(`customer_name.ilike.%${filters.search}%,quotation_number.ilike.%${filters.search}%`);
            }
            if (filters.status && filters.status !== 'TODOS') {
                query = query.eq('status', filters.status);
            }

            // Sorting
            const sortField = sorting.field === 'customerName' ? 'customer_name' :
                sorting.field === 'quotationNumber' ? 'quotation_number' :
                    sorting.field === 'registrationDate' ? 'registration_date' :
                        'created_at';

            query = query.order(sortField, { ascending: sorting.order === 'asc' });

            // Pagination
            const from = (pagination.page - 1) * pagination.limit;
            const to = from + pagination.limit - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;
            if (error) throw error;

            return {
                quotations: (data || []).map(transformQuotation),
                total: count || 0,
                page: pagination.page,
                totalPages: Math.ceil((count || 0) / pagination.limit)
            };

        } catch (error) {
            console.error('Error fetching quotations:', error);
            throw error;
        }
    },

    createQuotation: async (quotationData) => {
        try {
            // Generate ID locally or fetch max to generate
            const { data: existing } = await supabase.from('quotations').select('quotation_number');
            const newNumber = generateQuotationNumber(existing);

            const { data: newQuotation, error: qError } = await supabase
                .from('quotations')
                .insert([{
                    quotation_number: newNumber,
                    customer_name: quotationData.customerName,
                    phone: quotationData.phone,
                    registration_date: quotationData.registrationDate,
                    scheduled_delivery_date: quotationData.scheduledDeliveryDate,
                    advance_payment: quotationData.advancePayment || 0,
                    status: 'REGISTRADO'
                }])
                .select()
                .single();

            if (qError) throw qError;

            const itemsToInsert = quotationData.items.map(item => ({
                quotation_id: newQuotation.id,
                product: item.product,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                shipping_cost: 0, // Default 0 on creation
                inventory_item_id: item.inventoryItemId || null
            }));

            const { data: newItems, error: iError } = await supabase
                .from('quotation_items')
                .insert(itemsToInsert)
                .select();

            if (iError) throw iError;

            return {
                ...transformQuotation(newQuotation),
                items: (newItems || []).map(transformQuotationItem)
            };

        } catch (error) {
            console.error('Error creating quotation:', error);
            throw error;
        }
    },

    updateQuotationItem: async (itemId, updates) => {
        try {
            const dbUpdates = {
                quantity: updates.quantity,
                unit_price: updates.unitPrice,
                shipping_cost: updates.shippingCost
            };
            if (updates.product !== undefined) {
                dbUpdates.product = updates.product;
            }

            const { data, error } = await supabase
                .from('quotation_items')
                .update(dbUpdates)
                .eq('id', itemId)
                .select()
                .single();

            if (error) throw error;
            return transformQuotationItem(data);
        } catch (error) {
            console.error('Error updating quotation item:', error);
            throw error;
        }
    },

    updateQuotation: async (id, updates) => {
        try {
            const dbUpdates = {};
            if (updates.customerName !== undefined) dbUpdates.customer_name = updates.customerName;
            if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
            if (updates.scheduledDeliveryDate !== undefined) dbUpdates.scheduled_delivery_date = updates.scheduledDeliveryDate;
            if (updates.advancePayment !== undefined) dbUpdates.advance_payment = updates.advancePayment;
            if (updates.status !== undefined) dbUpdates.status = updates.status;

            const { data, error } = await supabase
                .from('quotations')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return transformQuotation(data);
        } catch (error) {
            console.error('Error updating quotation:', error);
            throw error;
        }
    },

    getQuotationById: async (id) => {
        const { data, error } = await supabase
            .from('quotations')
            .select('*, quotation_items(*, inventory_items(id, item_number, tipo, material, modelo, size, color, image_url, unit_price))')
            .eq('id', id)
            .single();

        if (error) throw error;
        return transformQuotation(data);
    },

    rejectQuotation: async (id, rejectionReason) => {
        const { data, error } = await supabase
            .from('quotations')
            .update({
                status: 'RECHAZADO',
                rejection_reason: rejectionReason || null
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return transformQuotation(data);
    },

    processQuotationToOrder: async (id) => {
        try {
            // 1. Get Quotation Data
            const quotation = await QuotationService.getQuotationById(id);
            if (!quotation) throw new Error('Quotation not found');

            // 2. Prepare Order Data
            // Map items. Amount = (qty * unitPrice) + shipping.
            const orderItems = quotation.items.map((item, index) => ({
                description: item.product,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                advance: index === 0 ? quotation.advancePayment : 0,
                amount: (item.quantity * item.unitPrice) + (item.shippingCost || 0),
                inventoryItemId: item.inventoryItemId || null // Propagar vínculo al pedido
            }));

            const orderData = {
                date: new Date().toISOString().split('T')[0], // Today
                customerName: quotation.customerName,
                phone: quotation.phone,
                deliveryDate: quotation.scheduledDeliveryDate,
                status: 'Recibido',
                isDelivered: false,
                isPaid: false,
                items: orderItems
            };

            // 3. Create Order
            const createdOrder = await SupabaseOrderService.createOrder(orderData);

            // 4. Update Quotation Status and Link
            const { data, error } = await supabase
                .from('quotations')
                .update({
                    status: 'ACEPTADO',
                    related_order_id: createdOrder.id // Vinculación ahora activa
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return transformQuotation(data);

        } catch (error) {
            console.error('Error processing quotation to order:', error);
            throw error;
        }
    },

    getQuotationByOrderId: async (orderId) => {
        try {
            const { data, error } = await supabase
                .from('quotations')
                .select('quotation_number')
                .eq('related_order_id', orderId)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching quotation by order ID:', error);
            return null;
        }
    },

    supabase: supabase
};
