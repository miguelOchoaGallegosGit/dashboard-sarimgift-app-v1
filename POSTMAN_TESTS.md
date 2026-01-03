# 🧪 Pruebas con Postman - Strapi API

## 📋 Configuración Base

**Base URL:** `https://jolly-dawn-c98c9601f7.strapiapp.com`

**Headers necesarios:**
```
Content-Type: application/json
Authorization: Bearer e65afee1d037966cd1b162e16e74324d11c7d4c9eec7a158b1767de0e71333044b7d1d86d15f793629a6dabb3cf85451cb6f0ededf366cacc21311d174bf0348db1b931a2747ea362d10d1e239bf50760e47d0cde5345ce33707b3e31979a95a9f6e9464fd0a890fa4a52c7a63c5d3e5bb3a31db33a046618d240578341fe869
```

---

## 🔍 1. Verificar que Strapi está funcionando

### GET - Health Check
```
GET https://jolly-dawn-c98c9601f7.strapiapp.com/_health
```

**Respuesta esperada:**
```json
{
  "status": "ok"
}
```

---

## 📦 2. Listar todas las órdenes

### GET - Get All Orders
```
GET https://jolly-dawn-c98c9601f7.strapiapp.com/api/ordens?populate=orden_items
```

**Headers:**
```
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada:**
```json
{
  "data": [],
  "meta": {
    "pagination": {...}
  }
}
```

---

## ➕ 3. Crear una orden (SIN items primero)

### POST - Create Order
```
POST https://jolly-dawn-c98c9601f7.strapiapp.com/api/ordens
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer tu_token_aqui
```

**Body (JSON):**
```json
{
  "data": {
    "orderNumber": "PED-0001",
    "date": "2026-01-03",
    "customerName": "Juan Pérez",
    "deliveryDate": "2026-01-10",
    "statusOrden": "Recibido",
    "isDelivered": false,
    "isPaid": false,
    "totalAmount": 100.00,
    "totalAdvance": 50.00,
    "totalBalance": 50.00
  }
}
```

**Respuesta esperada:**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "orderNumber": "PED-0001",
      "date": "2026-01-03",
      "customerName": "Juan Pérez",
      ...
    }
  }
}
```

**⚠️ Guarda el `id` de la respuesta!** Lo necesitarás para crear los items.

---

## 📝 4. Crear items para la orden

### POST - Create Order Item
```
POST https://jolly-dawn-c98c9601f7.strapiapp.com/api/orden-items
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer tu_token_aqui
```

**Body (JSON):**
```json
{
  "data": {
    "description": "Producto de prueba",
    "quantity": 2,
    "amount": 100.00,
    "advance": 50.00,
    "orden": 1
  }
}
```

**⚠️ Importante:** Reemplaza `"orden": 1` con el ID de la orden que creaste en el paso anterior.

---

## 🔍 5. Verificar la orden con sus items

### GET - Get Order by ID
```
GET https://jolly-dawn-c98c9601f7.strapiapp.com/api/ordens/1?populate=orden_items
```

**Respuesta esperada:**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "orderNumber": "PED-0001",
      "orden_items": {
        "data": [
          {
            "id": 1,
            "attributes": {
              "description": "Producto de prueba",
              "quantity": 2,
              "amount": 100.00,
              "advance": 50.00
            }
          }
        ]
      }
    }
  }
}
```

---

## ✏️ 6. Actualizar una orden

### PUT - Update Order
```
PUT https://jolly-dawn-c98c9601f7.strapiapp.com/api/ordens/1
```

**Body (JSON):**
```json
{
  "data": {
    "statusOrden": "En Proceso",
    "isDelivered": true
  }
}
```

---

## 🗑️ 7. Eliminar una orden

### DELETE - Delete Order
```
DELETE https://jolly-dawn-c98c9601f7.strapiapp.com/api/ordens/1
```

---

## 🐛 Troubleshooting

### Error 404 - Not Found
**Causa:** El endpoint no existe
**Solución:** 
- Verifica que usas `/api/ordens` (no `/api/orders`)
- Verifica que las entidades estén creadas en Strapi

### Error 401 - Unauthorized
**Causa:** Token inválido o faltante
**Solución:**
- Verifica que el header `Authorization` esté presente
- Verifica que el token sea correcto

### Error 403 - Forbidden
**Causa:** No tienes permisos
**Solución:**
- Ve a Strapi Admin → Settings → Users & Permissions → Roles → Public
- Marca los permisos: find, findOne, create, update, delete
- Para Orden y OrdenItem

### Error 400 - Bad Request
**Causa:** Datos inválidos
**Solución:**
- Verifica que los campos requeridos estén presentes
- Verifica que los tipos de datos sean correctos
- Revisa el mensaje de error en la respuesta

---

## 📝 Nombres Correctos en Strapi

| Concepto | Nombre en Strapi | Endpoint |
|----------|------------------|----------|
| Orden (singular) | `orden` | `/api/ordens` |
| OrdenItem (singular) | `ordenitem` | `/api/orden-items` |
| Campo status | `statusOrden` | - |
| Relación items | `orden_items` | - |
| Relación orden (en item) | `orden` | - |

---

## ✅ Checklist de Verificación

- [ ] Health check funciona
- [ ] GET /api/ordens funciona (aunque esté vacío)
- [ ] POST /api/ordens crea una orden
- [ ] POST /api/ordenitems crea un item
- [ ] GET /api/ordens/1?populate=orden_items muestra la orden con items
- [ ] PUT /api/ordens/1 actualiza la orden
- [ ] DELETE funciona

Si todos estos pasos funcionan en Postman, entonces el problema está en el código del frontend, no en Strapi.
