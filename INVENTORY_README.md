# Módulo de Inventario - Guía de Configuración

## 📋 Descripción

Módulo completo de gestión de inventario para el dashboard de SarimGift con las siguientes funcionalidades:

- ✅ Listado de items con grilla configurable
- ✅ Registro de nuevos items
- ✅ Actualización de stock
- ✅ Filtros por nombre y categoría
- ✅ Paginación (20, 50, 100 items)
- ✅ Ordenamiento por columnas
- ✅ Visibilidad de columnas configurable
- ✅ Alertas visuales para stock bajo (< 5 unidades)
- ✅ Confirmación al establecer stock en 0
- ✅ Diseño responsive (desktop y móvil)

## 🗄️ Configuración de Base de Datos

### Paso 1: Crear la tabla en Supabase

1. Accede a tu proyecto de Supabase: https://app.supabase.com
2. Ve a la sección **SQL Editor**
3. Copia y pega el contenido del archivo `INVENTORY_SETUP.sql`
4. Ejecuta el script haciendo clic en **Run**

El script creará:
- Tabla `inventory_items` con todos los campos necesarios
- Índices para optimizar consultas
- Trigger para actualizar `updated_at` automáticamente
- Políticas RLS (Row Level Security)

### Paso 2: Verificar la creación

1. Ve a **Table Editor** en Supabase
2. Busca la tabla `inventory_items`
3. Verifica que tenga las siguientes columnas:
   - id (bigint)
   - item_number (varchar)
   - name (varchar)
   - description (text)
   - category (varchar)
   - quantity (integer)
   - unit_price (numeric)
   - size (varchar)
   - color (varchar)
   - supplier (varchar)
   - notes (text)
   - created_at (timestamptz)
   - updated_at (timestamptz)

### Paso 3: (Opcional) Insertar datos de prueba

Si deseas probar el módulo con datos de ejemplo:

1. Abre el archivo `INVENTORY_SETUP.sql`
2. Descomenta las líneas de INSERT (elimina `/*` y `*/`)
3. Ejecuta nuevamente el script en Supabase

Esto insertará 10 items de prueba con diferentes categorías y niveles de stock.

## 🚀 Uso del Módulo

### Acceder al Inventario

1. Inicia el servidor de desarrollo: `npm run dev`
2. Abre el navegador en `http://localhost:5173`
3. Haz clic en el botón **Inventario** en el navbar

### Agregar un Item

1. Haz clic en el botón **Agregar Item**
2. Completa el formulario:
   - **Nombre*** (requerido)
   - **Categoría*** (requerido): Unisex, Niño, Niña, Dama, Caballero, Accesorios
   - **Cantidad*** (requerido): 0-1000
   - Precio Unitario (opcional)
   - Talla, Color, Proveedor, Notas (opcionales)
3. Haz clic en **Guardar Item**

El sistema generará automáticamente el código del item (ITEM-0001, ITEM-0002, etc.)

### Actualizar Stock

1. En la grilla, localiza el item que deseas actualizar
2. Haz clic en el icono de edición (lápiz) en la columna **Acciones**
3. Ingresa la nueva cantidad
4. Si ingresas 0, se mostrará una confirmación adicional
5. Haz clic en **Actualizar Stock**

### Filtrar Items

- **Búsqueda por nombre**: Escribe en el campo "Buscar Producto"
- **Filtrar por categoría**: Selecciona una categoría del dropdown
- **Limpiar filtros**: Haz clic en "Limpiar Filtros"

### Ordenar Columnas

- Haz clic en el encabezado de cualquier columna para ordenar
- Primer clic: orden ascendente (A-Z, 0-9)
- Segundo clic: orden descendente (Z-A, 9-0)

### Configurar Columnas Visibles

1. Haz clic en el botón **Columnas** (icono de engranaje)
2. Marca/desmarca las columnas que deseas ver
3. La columna "Item #" siempre estará visible

### Cambiar Paginación

- Selecciona 20, 50 o 100 items por página en el dropdown
- Usa los botones "Anterior" y "Siguiente" para navegar

## 📱 Uso Móvil

El módulo está optimizado para dispositivos móviles:

- **Desktop**: Vista de tabla completa
- **Tablet (< 900px)**: Vista de tabla con menos columnas
- **Móvil (< 600px)**: Vista de cards verticales

## 🎨 Indicadores Visuales

### Stock Badges (Cantidad)

- 🔴 **Rojo**: Cantidad = 0 o < 5 (stock bajo/agotado)
- 🟡 **Amarillo**: Cantidad entre 5-20 (stock medio)
- 🟢 **Verde**: Cantidad > 20 (stock saludable)

### Alertas de Stock Bajo

Los items con cantidad < 5 se resaltan con un fondo rojo sutil en la grilla.

## 🔧 Estructura de Archivos

```
src/
├── services/
│   └── InventoryService.js          # Servicio CRUD para inventario
├── components/
│   └── Inventory/
│       ├── InventoryGrid.jsx        # Grilla con ordenamiento y columnas
│       ├── AddInventoryItemModal.jsx # Modal para agregar items
│       └── UpdateStockModal.jsx     # Modal para actualizar stock
├── pages/
│   └── Inventory/
│       └── Inventory.jsx            # Página principal del módulo
└── index.css                        # Estilos del módulo (al final del archivo)
```

## 🐛 Solución de Problemas

### Error: "relation 'inventory_items' does not exist"

**Solución**: La tabla no se ha creado en Supabase. Ejecuta el script `INVENTORY_SETUP.sql`.

### Error: "permission denied for table inventory_items"

**Solución**: Las políticas RLS no están configuradas correctamente. Verifica que la política "Enable all operations" esté activa en Supabase.

### Los items no se muestran en la grilla

**Solución**: 
1. Verifica que la tabla tenga datos (ve a Table Editor en Supabase)
2. Revisa la consola del navegador (F12) para ver errores
3. Verifica que las credenciales de Supabase en `.env` sean correctas

### El botón "Inventario" no aparece en el navbar

**Solución**: Asegúrate de que el servidor de desarrollo esté corriendo (`npm run dev`) y recarga la página.

## 📊 Categorías Disponibles

1. **Unisex**: Prendas sin distinción de género
2. **Niño**: Prendas infantiles masculinas
3. **Niña**: Prendas infantiles femeninas
4. **Dama**: Prendas femeninas adultas
5. **Caballero**: Prendas masculinas adultas
6. **Accesorios**: Productos como llaveros, reglas, etc.

## ✅ Checklist de Verificación

- [ ] Tabla `inventory_items` creada en Supabase
- [ ] Políticas RLS configuradas
- [ ] Navegación a `/inventario` funcional
- [ ] Botón "Inventario" visible en navbar
- [ ] Modal "Agregar Item" funcional
- [ ] Validaciones de formulario funcionando
- [ ] Actualización de stock funcional
- [ ] Confirmación al establecer stock en 0
- [ ] Filtros de búsqueda y categoría funcionando
- [ ] Paginación (20, 50, 100) funcional
- [ ] Ordenamiento de columnas funcional
- [ ] Selector de columnas visibles funcional
- [ ] Alertas visuales para stock bajo
- [ ] Diseño responsive en móvil

## 📝 Notas Adicionales

- El campo `item_number` se genera automáticamente en formato ITEM-XXXX
- La cantidad máxima permitida es 1000 unidades
- El precio puede tener hasta 2 decimales
- Los campos opcionales pueden dejarse vacíos
- El trigger `updated_at` se actualiza automáticamente en cada modificación

## 🆘 Soporte

Si encuentras algún problema o necesitas ayuda adicional, revisa:
1. Los logs de la consola del navegador (F12)
2. Los logs de Supabase en la sección "Logs"
3. El archivo `implementation_plan.md` para más detalles técnicos
