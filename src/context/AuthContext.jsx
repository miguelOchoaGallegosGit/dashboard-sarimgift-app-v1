import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar sesión actual
        checkUser();

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkUser = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        } catch (error) {
            console.error('Error checking user session:', error);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            setUser(data.user);
            return { user: data.user, error: null };
        } catch (error) {
            console.error('Error signing in:', error);
            return { user: null, error };
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUser(null);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        signIn,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
