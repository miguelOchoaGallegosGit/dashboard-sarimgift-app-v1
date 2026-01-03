// Descomentar la línea que quieras usar:

// Para usar LocalStorage (desarrollo sin backend)
//export { OrderService } from './OrderService';

// Para usar Strapi (descomentar cuando esté configurado)
export { StrapiOrderService as OrderService } from './StrapiOrderService';
