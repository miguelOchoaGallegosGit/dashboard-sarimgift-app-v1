# 🚀 Configuración de Strapi Cloud para SarimGift

## ☁️ Paso 1: Crear tu proyecto en Strapi Cloud

### 1.1 Registrarse en Strapi Cloud

1. Ve a [https://cloud.strapi.io](https://cloud.strapi.io)
2. Crea una cuenta o inicia sesión
3. Click en **"Create Project"**
4. Selecciona el plan (Free tier es suficiente para empezar)
5. Nombra tu proyecto: `sarimgift-backend`
6. Espera a que se despliegue (toma 2-3 minutos)

### 1.2 Acceder al Admin Panel

Una vez desplegado, recibirás:
- **URL del proyecto**: `https://tu-proyecto.strapiapp.com`
- **URL del admin**: `https://tu-proyecto.strapiapp.com/admin`

Guarda esta URL, la necesitarás para configurar tu aplicación.

---

## 📦 Paso 2: Crear las Entidades en Strapi Cloud

### 2.1 Acceder al Content-Type Builder

1. Abre tu admin panel: `https://tu-proyecto.strapiapp.com/admin`
2. Crea tu cuenta de administrador (primera vez)
3. Ve a **Content-Type Builder** en el menú lateral

### 2.2 Crear Collection Type: **Order**

1. Click en **"Create new collection type"**
2. Display name: `Order`
3. API ID (singular): `order`
4. Click **Continue**

**Agregar campos:**

| Campo | Tipo | Configuración |
|-------|------|---------------|
| `orderNumber` | Text | - Type: Short text<br>- **Unique**: ✅<br>- **Required**: ✅ |
| `date` | Date | - Type: date (only)<br>- **Required**: ✅ |
| `customerName` | Text | - Type: Short text<br>- **Required**: ✅ |
| `deliveryDate` | Date | - Type: date (only)<br>- **Required**: ✅ |
| `status` | Enumeration | - Name: status<br>- Values (uno por línea):<br>  - `Recibido`<br>  - `En Proceso`<br>  - `Cerrado`<br>- Default value: `Recibido` |
| `isDelivered` | Boolean | - Default value: `false` |
| `isPaid` | Boolean | - Default value: `false` |
| `totalAmount` | Number | - Number format: **decimal**<br>- **Required**: ✅ |
| `totalAdvance` | Number | - Number format: **decimal**<br>- **Required**: ✅ |
| `totalBalance` | Number | - Number format: **decimal**<br>- **Required**: ✅ |

5. Click **"Add another field"** → **Relation**
   - Relation name: `items`
   - Tipo de relación: **Order has many OrderItems**
   - Click **Finish**

6. Click **Save** (arriba a la derecha)

### 2.3 Crear Collection Type: **OrderItem**

1. Click en **"Create new collection type"**
2. Display name: `OrderItem`
3. API ID (singular): `order-item`
4. Click **Continue**

**Agregar campos:**

| Campo | Tipo | Configuración |
|-------|------|---------------|
| `description` | Text | - Type: Short text<br>- **Required**: ✅ |
| `quantity` | Number | - Number format: **integer**<br>- **Required**: ✅<br>- Minimum value: `1` |
| `amount` | Number | - Number format: **decimal**<br>- **Required**: ✅ |
| `advance` | Number | - Number format: **decimal**<br>- Default value: `0` |

5. La relación con `Order` ya debe estar creada automáticamente
6. Click **Save**

---

## 🔐 Paso 3: Configurar Permisos y API Token

### 3.1 Crear API Token (Recomendado)

1. Ve a **Settings** (⚙️) → **API Tokens**
2. Click en **"Create new API Token"**
3. Configuración:
   - **Name**: `SarimGift Dashboard`
   - **Description**: `Token para el dashboard de pedidos`
   - **Token duration**: `Unlimited`
   - **Token type**: Selecciona **Custom**
   
4. En **Permissions**, expande cada Collection Type y marca:
   
   **Order:**
   - ✅ find
   - ✅ findOne
   - ✅ create
   - ✅ update
   - ✅ delete
   
   **Order-item:**
   - ✅ find
   - ✅ findOne
   - ✅ create
   - ✅ update
   - ✅ delete

5. Click **Save**
6. **¡IMPORTANTE!** Copia el token que aparece. Solo se muestra una vez.

### 3.2 Alternativa: Permisos Públicos (Solo para pruebas)

Si prefieres no usar token durante el desarrollo:

1. Ve a **Settings** → **Users & Permissions Plugin** → **Roles**
2. Click en **Public**
3. Marca los mismos permisos que en el paso anterior
4. Click **Save**

⚠️ **Advertencia**: Esto hace que tu API sea pública. Úsalo solo para pruebas.

---

## ⚙️ Paso 4: Configurar tu Aplicación React

### 4.1 Actualizar Variables de Entorno

Abre el archivo `.env` en la raíz de tu proyecto y actualiza:

```env
VITE_STRAPI_URL=https://tu-proyecto.strapiapp.com
VITE_STRAPI_API_TOKEN=tu_token_copiado_aqui
```

**Ejemplo:**
```env
VITE_STRAPI_URL=https://sarimgift-backend-abc123.strapiapp.com
VITE_STRAPI_API_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

### 4.2 Activar el Servicio de Strapi

Abre `src/services/index.js` y actualiza:

```javascript
// Comenta esta línea (LocalStorage):
// export { OrderService } from './OrderService';

// Descomenta esta línea (Strapi):
export { StrapiOrderService as OrderService } from './StrapiOrderService';
```

### 4.3 Reiniciar el Servidor de Desarrollo

```bash
# Detén el servidor actual (Ctrl+C)
# Luego reinicia:
npm run dev
```

---

## 🧪 Paso 5: Probar la Integración

### 5.1 Verificar la Conexión

1. Abre tu aplicación en el navegador
2. Abre la consola del navegador (F12)
3. Ve a la pestaña **Network**
4. Navega a "Nuevo Pedido"

Deberías ver requests a tu URL de Strapi Cloud.

### 5.2 Crear un Pedido de Prueba

1. Completa el formulario de "Nuevo Pedido"
2. Agrega al menos un item
3. Click en **"Guardar Pedido"**
4. Verifica que aparezca en el Dashboard

### 5.3 Verificar en Strapi Cloud

1. Ve a tu admin panel de Strapi Cloud
2. Click en **Content Manager** → **Order**
3. Deberías ver el pedido que acabas de crear
4. Click en el pedido para ver los items asociados

---

## 🔄 Migrar Datos de LocalStorage a Strapi Cloud (Opcional)

Si ya tienes datos en LocalStorage y quieres migrarlos:

### Opción 1: Script de Migración Manual

1. Abre la consola del navegador en tu aplicación
2. Pega y ejecuta este código:

```javascript
// 1. Obtener datos de LocalStorage
const localOrders = JSON.parse(localStorage.getItem('sarim_orders') || '[]');

// 2. Función para migrar
async function migrateToStrapi() {
  const STRAPI_URL = 'https://tu-proyecto.strapiapp.com';
  const API_TOKEN = 'tu_token_aqui';
  
  for (const order of localOrders) {
    try {
      // Crear el pedido
      const response = await fetch(`${STRAPI_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify({
          data: {
            orderNumber: order.orderNumber,
            date: order.date,
            customerName: order.customerName,
            deliveryDate: order.deliveryDate,
            status: order.status,
            isDelivered: order.isDelivered,
            isPaid: order.isPaid,
            totalAmount: order.totalAmount,
            totalAdvance: order.totalAdvance,
            totalBalance: order.totalBalance
          }
        })
      });
      
      const result = await response.json();
      const orderId = result.data.id;
      
      // Crear los items
      for (const item of order.items) {
        await fetch(`${STRAPI_URL}/api/order-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`
          },
          body: JSON.stringify({
            data: {
              description: item.description,
              quantity: item.quantity,
              amount: item.amount,
              advance: item.advance,
              order: orderId
            }
          })
        });
      }
      
      console.log(`✅ Migrado: ${order.orderNumber}`);
    } catch (error) {
      console.error(`❌ Error migrando ${order.orderNumber}:`, error);
    }
  }
  
  console.log('🎉 Migración completada!');
}

// 3. Ejecutar migración
migrateToStrapi();
```

### Opción 2: Exportar/Importar CSV

1. Exporta tus datos de LocalStorage a CSV
2. Usa la función de importación de Strapi Cloud (si está disponible en tu plan)

---

## 🌐 Configuración de CORS (Si es necesario)

Strapi Cloud maneja CORS automáticamente, pero si tienes problemas:

1. Ve a **Settings** → **Global settings** → **Security**
2. Agrega tu dominio de desarrollo en **CORS**:
   ```
   http://localhost:5173
   ```
3. Click **Save**

---

## 📝 Notas Importantes

### URLs de Strapi Cloud

Tu proyecto tendrá estas URLs:
- **API**: `https://tu-proyecto.strapiapp.com/api`
- **Admin**: `https://tu-proyecto.strapiapp.com/admin`
- **Uploads**: `https://tu-proyecto.strapiapp.com/uploads`

### Límites del Plan Free

- **Registros**: 1,000 entradas
- **Assets**: 1GB de almacenamiento
- **Requests**: 1,000 requests/día

Para producción, considera actualizar al plan Pro.

### Seguridad

✅ **Recomendaciones:**
- Usa siempre API Tokens en producción
- No compartas tu token en repositorios públicos
- Agrega `.env` a tu `.gitignore`
- Usa variables de entorno en tu plataforma de deploy (Vercel, Netlify, etc.)

---

## 🚀 Deploy a Producción

### Variables de Entorno en Vercel/Netlify

Cuando despliegues tu aplicación, agrega estas variables:

```
VITE_STRAPI_URL=https://tu-proyecto.strapiapp.com
VITE_STRAPI_API_TOKEN=tu_token_de_produccion
```

---

## 🆘 Troubleshooting

### Error 401 Unauthorized
- Verifica que el token esté correctamente configurado en `.env`
- Asegúrate de que el token tenga los permisos correctos

### Error 403 Forbidden
- Revisa los permisos del API Token
- O habilita los permisos públicos temporalmente

### Error 404 Not Found
- Verifica que la URL de Strapi esté correcta
- Asegúrate de que las entidades estén creadas

### Los datos no aparecen
- Verifica en Content Manager de Strapi que los datos se guardaron
- Revisa la consola del navegador para errores
- Verifica que la relación Order → OrderItems esté configurada

---

## ✅ Checklist Final

- [ ] Cuenta creada en Strapi Cloud
- [ ] Proyecto desplegado
- [ ] Entidad **Order** creada con todos los campos
- [ ] Entidad **OrderItem** creada con todos los campos
- [ ] Relación Order ↔ OrderItems configurada
- [ ] API Token creado y copiado
- [ ] Archivo `.env` actualizado con URL y Token
- [ ] Servicio cambiado a `StrapiOrderService` en `src/services/index.js`
- [ ] Aplicación reiniciada
- [ ] Pedido de prueba creado exitosamente
- [ ] Datos verificados en Strapi Cloud Admin

¡Listo! Tu aplicación ahora está conectada a Strapi Cloud. 🎉
