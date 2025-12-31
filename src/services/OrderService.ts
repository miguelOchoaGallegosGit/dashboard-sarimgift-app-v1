import { Order, OrderItem } from '../types';

const STORAGE_KEY = 'sarim_orders';

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateOrderNumber = (count: number) => `PED-${String(count + 1).padStart(4, '0')}`;

export const OrderService = {
    getOrders: (): Order[] => {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    getOrderById: (id: string): Order | undefined => {
        const orders = OrderService.getOrders();
        return orders.find(o => o.id === id);
    },

    createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'status' | 'isDelivered' | 'isPaid' | 'createdAt' | 'totalAmount' | 'totalAdvance' | 'totalBalance'>): Order => {
        const orders = OrderService.getOrders();

        // Calculate totals
        const totalAmount = orderData.items.reduce((sum, item) => sum + item.amount, 0);
        const totalAdvance = orderData.items.reduce((sum, item) => sum + item.advance, 0);
        const totalBalance = totalAmount - totalAdvance;

        const newOrder: Order = {
            ...orderData,
            id: generateId(),
            orderNumber: generateOrderNumber(orders.length),
            status: 'Recibido',
            isDelivered: false,
            isPaid: false,
            createdAt: Date.now(),
            totalAmount,
            totalAdvance,
            totalBalance
        };

        orders.unshift(newOrder); // Add to top
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
        return newOrder;
    },

    updateOrder: (id: string, updates: Partial<Order>): Order | null => {
        const orders = OrderService.getOrders();
        const index = orders.findIndex(o => o.id === id);
        if (index === -1) return null;

        const currentOrder = orders[index];
        const updatedOrder = { ...currentOrder, ...updates };

        // Recalculate Logic if items changed
        if (updates.items) {
            updatedOrder.totalAmount = updatedOrder.items.reduce((sum, item) => sum + item.amount, 0);
            updatedOrder.totalAdvance = updatedOrder.items.reduce((sum, item) => sum + item.advance, 0);
            updatedOrder.totalBalance = updatedOrder.totalAmount - updatedOrder.totalAdvance;
        }

        // Status Logic
        // "la condicion para dar por cerrar el pedido es que los estado Entregado y pagado se cumplan es decir sean true"
        if (updatedOrder.isDelivered && updatedOrder.isPaid) {
            updatedOrder.status = 'Cerrado'; // Or keep the last status but mark as closed? Req says "dar por cerrar".
        } else if (updatedOrder.status === 'Cerrado' && (!updatedOrder.isDelivered || !updatedOrder.isPaid)) {
            // Re-open if uncheck
            updatedOrder.status = 'En Proceso';
        }

        orders[index] = updatedOrder;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
        return updatedOrder;
    },

    deleteOrder: (id: string) => {
        const orders = OrderService.getOrders();
        const filtered = orders.filter(o => o.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
};
