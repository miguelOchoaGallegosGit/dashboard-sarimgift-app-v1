# 📦 Bandeja de Pedidos Externos - Implementación

## Descripción General

Se ha implementado una nueva sección llamada **Bandeja** en el sistema para gestionar pedidos externos provenientes de otras webs. Esta funcionalidad permite visualizar, editar y crear cotizaciones de pedidos con información detallada del cliente y productos.

## 🎨 Características Implementadas

### 1. Navegación
- ✅ Nuevo item "Bandeja" en el menú principal (entre Dashboard e Inventario)
- ✅ Ícono `Inbox` de Lucide React
- ✅ Ruta: `/bandeja`

### 2. Grid de Pedidos
El grid principal muestra los siguientes datos:
- **Nombre del Cliente**
- **Teléfono**
- **Dirección de Entrega**
- **Distrito**
- **Detalles Adicionales**

#### Funcionalidades del Grid:
- ✅ **Paginación**: Control de registros por página (5, 10, 20, 50)
- ✅ **Ordenamiento**: Click en headers de columnas para ordenar (ASC/DESC)
- ✅ **Filtros**: Búsqueda por nombre/teléfono y filtro por distrito
- ✅ **Control de Columnas**: Mostrar/ocultar columnas según necesidad
- ✅ **Botón de Lupa**: Para ver el detalle del pedido

### 3. Modal de Detalle de Pedido

Muestra información completa del pedido con tabla de productos:

| Campo | Descripción | Editable |
|-------|-------------|----------|
| Producto | Nombre del producto | ❌ |
| Cantidad | Número de unidades | ✅ |
| Precio Unitario | Precio por unidad (S/) | ✅ |
| Precio Total | Cantidad × Precio Unit. | 🔄 Auto-calculado |
| Costo de Envío | Costo adicional (S/) | ✅ |

**Características:**
- Campos editables actualizan el precio total en tiempo real
- Botón "Guardar Cambios" para persistir modificaciones
- Muestra total general (suma de todos los productos + envíos)

### 4. Modal "Ingresar Cotización"

Permite crear nuevas cotizaciones con dos secciones:

#### 📋 Información del Cliente
- Nombre del Cliente (*)
- Teléfono (*)
- Dirección de Entrega
- Distrito
- Detalles Adicionales

#### 📦 Detalle de Items
- Tabla dinámica con botón "Añadir Item"
- Campos por item:
  - Producto
  - Cantidad
  - Precio Unitario
  - Subtotal (auto-calculado)
  - Costo de Envío
  - Botón eliminar (🗑️)
- Cálculo automático del total general

## 🗄️ Base de Datos

### Tablas Creadas

#### `external_orders`
```sql
- id (UUID, PK)
- order_number (VARCHAR, UNIQUE)
- customer_name (VARCHAR)
- phone (VARCHAR)
- delivery_address (TEXT)
- district (VARCHAR)
- additional_details (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `external_order_items`
```sql
- id (UUID, PK)
- order_id (UUID, FK -> external_orders)
- product (VARCHAR)
- quantity (INTEGER)
- unit_price (DECIMAL)
- shipping_cost (DECIMAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Índices Creados
- `idx_external_orders_customer_name`
- `idx_external_orders_phone`
- `idx_external_orders_district`
- `idx_external_orders_created_at`
- `idx_external_order_items_order_id`

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

1. **Servicios**
   - `src/services/ExternalOrderService.js` - Lógica de negocio y API

2. **Componentes**
   - `src/components/Order/ExternalOrderDetailModal.jsx` - Modal de detalle
   - `src/components/Order/NewExternalOrderModal.jsx` - Modal de crear cotización

3. **Páginas**
   - `src/pages/Bandeja/Bandeja.jsx` - Página principal

4. **SQL**
   - `BANDEJA_SETUP.sql` - Script de creación de tablas

### Archivos Modificados

1. `src/App.jsx` - Agregada ruta `/bandeja`
2. `src/components/UI/Navbar.jsx` - Agregado item de menú "Bandeja"
3. `src/services/index.js` - Export del `ExternalOrderService`

## 🚀 Instrucciones de Instalación

### 1. Crear las Tablas en Supabase

Ejecuta el archivo `BANDEJA_SETUP.sql` en tu proyecto de Supabase:

1. Ve a tu proyecto en Supabase
2. Abre el SQL Editor
3. Copia y pega el contenido de `BANDEJA_SETUP.sql`
4. Ejecuta el script

Esto creará:
- Las tablas necesarias
- Índices para performance
- Triggers para `updated_at`
- Políticas de RLS
- Datos de ejemplo (5 pedidos con sus items)

### 2. Verificar la Aplicación

```bash
# Asegúrate de que el servidor de desarrollo esté corriendo
npm run dev
```

Navega a `http://localhost:5173/bandeja` (o el puerto que uses)

## 🎯 Uso de la Aplicación

### Visualizar Pedidos
1. Haz click en "Bandeja" en el menú
2. Usa los filtros para buscar pedidos específicos
3. Haz click en el ícono de lupa (👁️) para ver detalles

### Editar Pedidos
1. Abre el modal de detalle
2. Modifica cantidad, precio unitario o costo de envío
3. El precio total se actualiza automáticamente
4. Haz click en "Guardar Cambios"

### Crear Nueva Cotización
1. Haz click en "Ingresar Cotización"
2. Completa información del cliente
3. Agrega productos usando "Añadir Item"
4. Completa los datos de cada producto
5. Verifica el total general
6. Haz click en "Guardar Cotización"

## 🎨 Diseño

El diseño sigue los mismos patrones visuales del resto de la aplicación:
- Glass morphism effects
- Modo claro/oscuro
- Animaciones suaves
- Tema consistente con variables CSS
- Responsive design

## 🔒 Seguridad

- Row Level Security (RLS) habilitado en Supabase
- Validaciones en frontend y backend
- Políticas configurables según necesidades

## 📝 Notas Importantes

1. **RLS Policies**: Las políticas actuales permiten todas las operaciones. Modifica según tus necesidades de autenticación.

2. **Números de Pedido**: Se generan automáticamente con formato `ORD-EXT-0001`, `ORD-EXT-0002`, etc.

3. **Validaciones**: 
   - Cantidad debe ser > 0
   - Precios no pueden ser negativos
   - Nombre y teléfono son obligatorios

4. **Datos de Ejemplo**: El script SQL incluye 5 pedidos de ejemplo. Puedes eliminarlos si no los necesitas.

## 🐛 Troubleshooting

### Error: "Table does not exist"
- Verifica que hayas ejecutado el script SQL en Supabase
- Revisa que las tablas se crearon correctamente en el SQL Editor

### Error de permisos RLS
- Revisa las políticas de RLS en Supabase
- Asegúrate de que las políticas permitan las operaciones necesarias

### No se muestran los pedidos
- Verifica la conexión a Supabase
- Revisa la consola del navegador para errores
- Asegúrate de que existan datos en las tablas

## 🔄 Próximas Mejoras Sugeridas

- [ ] Exportar pedidos a PDF/Excel
- [ ] Notificaciones de nuevos pedidos
- [ ] Estados de pedido (Pendiente, En Proceso, Completado)
- [ ] Integración con sistema de inventario
- [ ] Dashboard de estadísticas de pedidos externos
- [ ] Filtros avanzados por fecha
- [ ] Búsqueda por número de pedido

---

**Fecha de Implementación**: 11 de Febrero, 2026  
**Versión**: 1.0.0
