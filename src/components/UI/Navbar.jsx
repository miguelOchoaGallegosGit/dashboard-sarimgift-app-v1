import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Package } from 'lucide-react';

export const Navbar = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="glass-panel" style={{
            margin: '1rem auto',
            padding: '0.8rem 2rem',
            maxWidth: '1200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: '1rem',
            zIndex: 100
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-color)' }}>
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

            <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to="/" className={`btn ${isActive('/') ? 'btn-primary' : 'btn-secondary'}`}>
                    <PlusCircle size={18} />
                    Nuevo Pedido
                </Link>
                <Link to="/dashboard" className={`btn ${isActive('/dashboard') ? 'btn-primary' : 'btn-secondary'}`}>
                    <LayoutDashboard size={18} />
                    Dashboard
                </Link>
            </div>
        </nav>
    );
};
