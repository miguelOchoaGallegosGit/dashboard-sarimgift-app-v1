# 🎨 Guía de Implementación - Sistema de Temas

## ✅ Completado

### 1. **Sistema de Temas Base**
- ✅ ThemeContext creado (`src/context/ThemeContext.jsx`)
- ✅ App.jsx envuelto con ThemeProvider
- ✅ CSS completamente reescrito con variables de tema
- ✅ Navbar actualizado con toggle de tema (Sol/Luna)

### 2. **Estilos CSS Implementados**
- ✅ Variables CSS para modo claro y oscuro
- ✅ Estilos base (reset, tipografía, layout)
- ✅ Componentes UI (botones, inputs, badges, modales)
- ✅ Estilos específicos de Dashboard
- ✅ Estilos específicos de Inventory
- ✅ Estilos específicos de OrderEntry
- ✅ Sistema responsive completo

## 📋 Clases CSS Disponibles

### **Dashboard**
```jsx
// Header
<div className="dashboard-header">
  <h1 className="dashboard-title">Dashboard</h1>
  <p className="dashboard-subtitle">Resumen de pedidos</p>
</div>

// Stats
<div className="stats-grid">
  <div className="stat-card">
    <span className="stat-label">Total</span>
    <span className="stat-value primary">26</span>
  </div>
</div>

// Filtros
<div className="filter-tabs">
  <button className="filter-tab active">Todos</button>
  <button className="filter-tab">En Proceso</button>
</div>

// Orders
<div className="orders-grid">
  <div className="order-card">
    <div className="order-header">
      <div>
        <div className="order-number">PED-0001</div>
        <h3 className="order-client">Cliente Name</h3>
        <div className="order-date">
          <Calendar size={14} />
          <span>2026-02-15</span>
        </div>
      </div>
      <span className="status-badge entregado">Entregado</span>
    </div>
    <div className="order-items">2 items registrados</div>
    <div className="order-total">S/ 71.00</div>
  </div>
</div>
```

### **Status Badges**
```jsx
<span className="status-badge pendiente">Pendiente</span>
<span className="status-badge en-proceso">En Proceso</span>
<span className="status-badge entregado">Entregado</span>
<span className="status-badge pagado">Pagado</span>
```

### **Inventory**
```jsx
<table className="inventory-table">
  <thead>
    <tr>
      <th>Item #</th>
      <th>Nombre</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>ITEM-0001</td>
      <td>Producto</td>
    </tr>
  </tbody>
</table>

<span className="stock-badge">25</span>
```

### **Order Entry**
```jsx
<form className="order-form">
  <div className="form-section">
    <h3 className="form-section-title">
      <User size={20} />
      Información del Cliente
    </h3>
    {/* inputs */}
  </div>

  <div className="items-list">
    <div className="item-row">
      {/* item fields */}
    </div>
  </div>

  <div className="order-summary">
    <div className="summary-row">
      <span className="summary-label">Subtotal</span>
      <span className="summary-value">S/ 100.00</span>
    </div>
    <div className="summary-row">
      <span className="summary-label">Total</span>
      <span className="summary-total">S/ 100.00</span>
    </div>
  </div>
</form>
```

## 🎨 Paleta de Colores

### Modo Oscuro (Default)
```css
--bg-primary: #1a1d2e
--bg-secondary: #252836
--bg-tertiary: #2a2d3a
--text-primary: #ffffff
--text-secondary: #9ca3af
--primary-color: #6366f1
--success-color: #10b981
--warning-color: #f59e0b
--danger-color: #ef4444
```

### Modo Claro
```css
--bg-primary: #f8f9fa
--bg-secondary: #ffffff
--bg-tertiary: #f3f4f6
--text-primary: #1f2937
--text-secondary: #6b7280
```

## 🔄 Cómo Usar el Toggle de Tema

El toggle está en el Navbar. El usuario puede:
1. Hacer clic en el icono Sol/Luna
2. El tema se guarda en localStorage
3. Se aplica automáticamente en la próxima visita

## 📱 Responsive

- **Desktop**: Diseño completo con todas las columnas
- **Tablet** (< 768px): Grid adaptado, navbar compacto
- **Mobile** (< 480px): Vista de una columna, navegación inferior

## 🚀 Próximos Pasos para Actualizar Componentes

### Dashboard.jsx
Reemplazar inline styles con clases:
```jsx
// ANTES
<div style={{ padding: '2rem 0' }}>
  <h1 style={{ fontSize: '2.4rem', ... }}>Dashboard</h1>
</div>

// DESPUÉS
<div className="main-content">
  <div className="dashboard-header">
    <h1 className="dashboard-title">Dashboard</h1>
    <p className="dashboard-subtitle">Resumen de pedidos</p>
  </div>
</div>
```

### Mantener Búsqueda por Fechas
El Dashboard ya tiene los filtros de fecha implementados:
```jsx
const [filters, setFilters] = useState({
  search: '',
  status: '',
  startDate: '',  // ✅ Mantener
  endDate: ''     // ✅ Mantener
});
```

Solo necesitas actualizar el JSX para usar las nuevas clases CSS.

## 📝 Checklist de Actualización

- [x] ThemeContext creado
- [x] ThemeProvider en App.jsx
- [x] Toggle en Navbar
- [x] CSS base con variables de tema
- [x] Estilos de Dashboard
- [x] Estilos de Inventory
- [x] Estilos de OrderEntry
- [ ] Actualizar Dashboard.jsx con nuevas clases
- [ ] Actualizar OrderEntry.jsx con nuevas clases
- [ ] Actualizar Inventory.jsx con nuevas clases
- [ ] Probar toggle de tema
- [ ] Verificar responsive

## 🎯 Ejemplo de Actualización Rápida

Para actualizar un componente:

1. **Reemplazar contenedores:**
   ```jsx
   // ANTES
   <div style={{ padding: '2rem' }}>
   
   // DESPUÉS
   <div className="main-content">
   ```

2. **Reemplazar cards:**
   ```jsx
   // ANTES
   <div className="glass-panel" style={{ padding: '1.5rem' }}>
   
   // DESPUÉS
   <div className="glass-panel">
   ```

3. **Reemplazar botones:**
   ```jsx
   // ANTES
   <button className="btn btn-primary" style={{ ... }}>
   
   // DESPUÉS
   <button className="btn btn-primary">
   ```

4. **Usar clases específicas:**
   ```jsx
   <div className="order-card">
   <span className="status-badge entregado">
   <div className="stat-card">
   ```

---

**Implementado**: 2026-02-09  
**Estado**: Base completada, componentes pendientes de actualización
