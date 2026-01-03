# 🔍 Diagnóstico: Items no se registran

## Posibles Causas

### 1. **Nombre del campo de relación incorrecto**

En Strapi, cuando creas una relación, el nombre del campo puede ser diferente.

**Verifica en Strapi Admin:**
1. Ve a **Content-Type Builder**
2. Click en **OrdenItem**
3. Busca el campo de relación
4. ¿Cómo se llama? Puede ser:
   - `orden` ✅ (esperado)
   - `order`
   - `orden_id`
   - Otro nombre

### 2. **Tipo de relación incorrecto**

**Verifica:**
1. En **OrdenItem**, ¿existe un campo de relación?
2. Debería ser: **OrdenItem belongs to Orden** (Many to One)

Si no existe, créalo:
1. Content-Type Builder → OrdenItem
2. Add another field → Relation
3. Nombre: `orden`
4. Tipo: **OrdenItem (left) belongs to Orden (right)**
5. Save

### 3. **Prueba Manual en Postman**

Primero crea una orden:

```
POST https://jolly-dawn-c98c9601f7.strapiapp.com/api/ordens

Headers:
  Content-Type: application/json
  Authorization: Bearer tu_token

Body:
{
  "data": {
    "orderNumber": "PED-TEST",
    "date": "2026-01-03",
    "customerName": "Test",
    "deliveryDate": "2026-01-10",
    "statusOrden": "Recibido",
    "isDelivered": false,
    "isPaid": false,
    "totalAmount": 100,
    "totalAdvance": 50,
    "totalBalance": 50
  }
}
```

**Guarda el ID de la respuesta** (ej: `"id": 5`)

Luego crea un item:

```
POST https://jolly-dawn-c98c9601f7.strapiapp.com/api/ordenitems

Headers:
  Content-Type: application/json
  Authorization: Bearer tu_token

Body:
{
  "data": {
    "description": "Item de prueba",
    "quantity": 1,
    "amount": 100,
    "advance": 50,
    "orden": 5
  }
}
```

**¿Qué error te da?**

### 4. **Posibles errores y soluciones**

#### Error: "orden must be a number"
**Solución:** El ID debe ser número, no string
```javascript
orden: parseInt(createdOrderId)  // En lugar de: orden: createdOrderId
```

#### Error: "orden is not defined"
**Solución:** El campo de relación tiene otro nombre
- Verifica en Content-Type Builder
- Puede ser `order` en lugar de `orden`

#### Error: "relation not found"
**Solución:** La relación no existe
- Crea la relación manualmente en Content-Type Builder

#### Error: 403 Forbidden
**Solución:** Falta permiso
- Settings → Roles → Public → OrdenItem → create ✅

---

## 🧪 Prueba desde la App

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Console**
3. Intenta crear un pedido
4. Busca mensajes de error en rojo
5. Copia y pégame el error completo

---

## 🔧 Verificación en Strapi Admin

Después de crear un pedido desde la app:

1. Ve a **Content Manager** → **Orden**
2. Click en la orden que creaste
3. ¿Ves los items en la relación `orden_items`?
4. Si no, ve a **Content Manager** → **Ordenitem**
5. ¿Existen items creados pero sin relación?

---

## 📝 Checklist de Verificación

- [ ] La relación existe en OrdenItem (campo `orden`)
- [ ] El tipo de relación es "Many to One"
- [ ] Los permisos de create están habilitados
- [ ] Puedes crear un item manualmente en Postman
- [ ] El item se vincula correctamente a la orden
- [ ] La consola del navegador muestra errores

---

## 🚀 Siguiente Paso

**Prueba crear un item manualmente en Postman** y cuéntame:
1. ¿Funcionó?
2. ¿Qué error te dio?
3. ¿El item aparece en Content Manager?
4. ¿Está vinculado a la orden?

Con esa información podré ayudarte mejor! 🎯
