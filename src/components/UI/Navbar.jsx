import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Package } from 'lucide-react';

export const Navbar = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="glass-panel navbar">
            <div className="navbar-brand">
                <div style={{
                    background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    display: 'flex'
                }}>
                    <Package size={24} color="white" />
                </div>
                <span>Sarim<span style={{ color: 'var(--primary-color)' }}>Gift</span></span>
            </div>

            <div className="navbar-actions">
                <Link to="/" className={`btn ${isActive('/') ? 'btn-primary' : 'btn-secondary'}`}>
                    <PlusCircle size={18} />
                    <span>Nuevo Pedido</span>
                </Link>
                <Link to="/dashboard" className={`btn ${isActive('/dashboard') ? 'btn-primary' : 'btn-secondary'}`}>
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                </Link>
            </div>
        </nav>
    );
};
