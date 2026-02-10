# 🔄 Actualización del Esquema de Inventario

## 📋 **Cambios en la Base de Datos**

### **Nueva Estructura de `inventory_items`:**

```sql
create table public.inventory_items (
  id bigserial not null,
  item_number character varying(20) not null,
  name character varying(255) not null,
  category character varying(50) not null,
  unit_price numeric(10, 2) null default 0.00,
  quantity integer not null default 0,
  tipo character varying(100) null,
  color VARCHAR(50),
  material character varying(100) null,
  modelo character varying(100) null,
  diseno character varying(255) null,
  size VARCHAR(20),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),  
  constraint inventory_items_pkey primary key (id),
  constraint inventory_items_item_number_key unique (item_number),
  constraint inventory_items_category_check check (
    (category)::text = any (
      array[
        'Unisex'::character varying,
        'Niño'::character varying,
        'Niña'::character varying,
        'Dama'::character varying,
        'Caballero'::character varying,
        'Accesorios'::character varying
      ]::text[]
    )
  ),
  constraint inventory_items_quantity_check check ((quantity >= 0))
);
```

### **Campos Eliminados:**
- ❌ `description` (Descripción)
- ❌ `notes` (Notas Adicionales)
- ❌ `cost` (Costo Unitario)

### **Campos Agregados:**
- ✅ `size` (Talla)
- ✅ `color` (Color)

### **Campos Renombrados:**
- 🔄 `cost` → `unit_price` (Costo → Precio)

## 🗺️ **Mapeo de Campos**

| Formulario | Base de Datos | Tipo | Requerido |
|------------|---------------|------|-----------|
| Nombre del Producto | `name` | VARCHAR(255) | ✅ |
| Categoría | `category` | VARCHAR(50) | ✅ |
| Precio Unitario | `unit_price` | NUMERIC(10,2) | ✅ |
| Cantidad | `quantity` | INTEGER | ✅ |
| Tipo | `tipo` | VARCHAR(100) | ❌ |
| Material | `material` | VARCHAR(100) | ❌ |
| Modelo | `modelo` | VARCHAR(100) | ❌ |
| Diseño | `diseno` | VARCHAR(255) | ❌ |
| Talla | `size` | VARCHAR(20) | ❌ |
| Color | `color` | VARCHAR(50) | ❌ |

## 📁 **Archivos Modificados**

### **1. AddInventoryItemModal.jsx** ✅

**Estado Inicial:**
```jsx
const [formData, setFormData] = useState({
    name: '',
    description: '',      // ❌ ELIMINADO
    category: '',
    quantity: 0,
    cost: 0,              // ❌ RENOMBRADO
    tipo: '',
    material: '',
    modelo: '',
    diseno: '',
    notes: ''             // ❌ ELIMINADO
});
```

**Estado Actualizado:**
```jsx
const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    unit_price: 0,        // ✅ NUEVO NOMBRE
    tipo: '',
    material: '',
    modelo: '',
    diseno: '',
    size: '',             // ✅ NUEVO
    color: ''             // ✅ NUEVO
});
```

**Validación:**
```jsx
// ANTES
const cost = parseFloat(formData.cost);
if (isNaN(cost) || cost < 0) {
    newErrors.cost = 'El costo debe ser mayor o igual a 0';
}

// DESPUÉS
const unit_price = parseFloat(formData.unit_price);
if (isNaN(unit_price) || unit_price < 0) {
    newErrors.unit_price = 'El precio debe ser mayor o igual a 0';
}
```

**Formulario:**
- **Columna 1:** Nombre, Categoría, Cantidad, Tipo, Modelo
- **Columna 2:** Precio Unitario, Material, Diseño, Talla, Color

### **2. UpdateStockModal.jsx** ✅

**Estado:**
```jsx
// ANTES
const [newCost, setNewCost] = useState(item.cost || 0);

// DESPUÉS
const [newUnitPrice, setNewUnitPrice] = useState(item.unit_price || 0);
```

**Handler:**
```jsx
// ANTES
const handleCostChange = (e) => {
    setNewCost(e.target.value);
};

// DESPUÉS
const handleUnitPriceChange = (e) => {
    setNewUnitPrice(e.target.value);
};
```

**Update:**
```jsx
// ANTES
await onUpdate(item.id, { quantity, cost });

// DESPUÉS
await onUpdate(item.id, { quantity, unit_price });
```

### **3. InventoryGrid.jsx** ✅

**Columnas Visibles:**
```jsx
const [visibleColumns, setVisibleColumns] = useState({
    itemNumber: true,
    name: true,
    category: true,
    quantity: true,
    unit_price: true,     // ✅ RENOMBRADO
    tipo: true,
    material: true,
    modelo: false,
    diseno: false,
    size: false,          // ✅ NUEVO
    color: false          // ✅ NUEVO
});
```

**Definición de Columnas:**
```jsx
const columns = [
    { key: 'itemNumber', label: 'Item #', alwaysVisible: true },
    { key: 'name', label: 'Nombre', alwaysVisible: false },
    { key: 'category', label: 'Categoría', alwaysVisible: false },
    { key: 'quantity', label: 'Cantidad', alwaysVisible: false },
    { key: 'unit_price', label: 'Precio', alwaysVisible: false },
    { key: 'tipo', label: 'Tipo', alwaysVisible: false },
    { key: 'material', label: 'Material', alwaysVisible: false },
    { key: 'modelo', label: 'Modelo', alwaysVisible: false },
    { key: 'diseno', label: 'Diseño', alwaysVisible: false },
    { key: 'size', label: 'Talla', alwaysVisible: false },
    { key: 'color', label: 'Color', alwaysVisible: false }
];
```

**Tabla Desktop:**
```jsx
{visibleColumns.unit_price && (
    <td>
        <span style={{ fontWeight: '600', color: 'var(--success-color)' }}>
            S/ {item.unit_price?.toFixed(2) || '0.00'}
        </span>
    </td>
)}
{visibleColumns.size && (
    <td>{item.size || '-'}</td>
)}
{visibleColumns.color && (
    <td>{item.color || '-'}</td>
)}
```

**Cards Mobile:**
```jsx
<div>
    <span>Precio</span>
    <strong>S/ {item.unit_price?.toFixed(2) || '0.00'}</strong>
</div>
{item.size && (
    <div>
        <span>Talla</span>
        <span>{item.size}</span>
    </div>
)}
{item.color && (
    <div>
        <span>Color</span>
        <span>{item.color}</span>
    </div>
)}
```

### **4. InventoryService.js** ✅

**Transform Function:**
```jsx
const transformSupabaseItem = (dbItem) => {
    return {
        id: dbItem.id,
        itemNumber: dbItem.item_number,
        name: dbItem.name,
        category: dbItem.category,
        quantity: parseInt(dbItem.quantity) || 0,
        unit_price: parseFloat(dbItem.unit_price) || 0,  // ✅
        tipo: dbItem.tipo,
        material: dbItem.material,
        modelo: dbItem.modelo,
        diseno: dbItem.diseno,
        size: dbItem.size,                                // ✅
        color: dbItem.color,                              // ✅
        createdAt: new Date(dbItem.created_at).getTime(),
        updatedAt: new Date(dbItem.updated_at).getTime()
    };
};
```

**Create Item:**
```jsx
.insert([{
    item_number: itemNumber,
    name: itemData.name.trim(),
    category: itemData.category,
    quantity: quantity,
    unit_price: parseFloat(itemData.unit_price) || 0,  // ✅
    tipo: itemData.tipo || null,
    material: itemData.material || null,
    modelo: itemData.modelo || null,
    diseno: itemData.diseno || null,
    size: itemData.size || null,                        // ✅
    color: itemData.color || null                       // ✅
}])
```

**Update Item:**
```jsx
if (updates.unit_price !== undefined) {
    const unit_price = parseFloat(updates.unit_price);
    if (isNaN(unit_price) || unit_price < 0) {
        throw new Error('El precio debe ser mayor o igual a 0');
    }
    updateData.unit_price = unit_price;
}
if (updates.size !== undefined) updateData.size = updates.size;
if (updates.color !== undefined) updateData.color = updates.color;
```

## ✅ **Verificación de Cambios**

### **Formulario AddInventoryItem:**
- [x] Campo "Nombre del Producto" → `name`
- [x] Campo "Categoría" → `category`
- [x] Campo "Precio Unitario" → `unit_price` (renombrado de "Costo")
- [x] Campo "Cantidad" → `quantity`
- [x] Campo "Tipo" → `tipo`
- [x] Campo "Material" → `material`
- [x] Campo "Modelo" → `modelo`
- [x] Campo "Diseño" → `diseno`
- [x] Campo "Talla" → `size` (NUEVO)
- [x] Campo "Color" → `color` (NUEVO)
- [x] Eliminado "Descripción"
- [x] Eliminado "Notas Adicionales"

### **Modal UpdateStock:**
- [x] Campo "Precio Unitario" → `unit_price`
- [x] Validación de precio actualizada
- [x] Handler `handleUnitPriceChange`
- [x] Update con `unit_price`

### **Grid de Inventario:**
- [x] Columna "Precio" visible por defecto
- [x] Columna "Talla" disponible (oculta por defecto)
- [x] Columna "Color" disponible (oculta por defecto)
- [x] Tabla desktop muestra todas las columnas
- [x] Cards mobile muestran todos los campos

### **Servicio:**
- [x] `transformSupabaseItem` actualizado
- [x] `createInventoryItem` actualizado
- [x] `updateInventoryItem` actualizado
- [x] Validaciones actualizadas

## 🎯 **Resumen de Cambios**

| Componente | Cambios |
|------------|---------|
| AddInventoryItemModal.jsx | Estado, validación, formulario (2 columnas) |
| UpdateStockModal.jsx | Estado, handler, validación, UI |
| InventoryGrid.jsx | Columnas, tabla, cards mobile |
| InventoryService.js | Transform, create, update |

## 📊 **Comparación Antes/Después**

### **ANTES:**
```
Campos: 10
- name
- description ❌
- category
- quantity
- cost ❌
- tipo
- material
- modelo
- diseno
- notes ❌
```

### **DESPUÉS:**
```
Campos: 10
- name
- category
- quantity
- unit_price ✅
- tipo
- material
- modelo
- diseno
- size ✅
- color ✅
```

---

**Implementado:** 2026-02-09 21:50  
**Estado:** ✅ Completado  
**Compatibilidad:** ✅ 100% con nuevo esquema de BD
