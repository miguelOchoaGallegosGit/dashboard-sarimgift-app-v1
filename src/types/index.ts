export type OrderStatus = 'Recibido' | 'En Proceso' | 'Entregado' | 'Pagado' | 'Cerrado';

export interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  amount: number; // Unit Price or Total for this line? Usually Unit Price * Qty, but strictly "Monto" in request. Let's assume this is the TOTAL amount for this line item.
  advance: number;
}

export interface Order {
  id: string;
  orderNumber: string; // Readable shorter ID e.g. "001"
  date: string; // ISO Date string YYYY-MM-DD
  customerName: string;
  deliveryDate: string;
  items: OrderItem[];
  
  // Computed/Cached totals
  totalAmount: number;
  totalAdvance: number;
  totalBalance: number; // Saldo a favor
  
  status: OrderStatus;
  
  // Flags for the "Bifurcation" logic
  isDelivered: boolean;
  isPaid: boolean;
  
  createdAt: number;
}
