import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Autenticación automática con las credenciales del usuario
const authenticateUser = async () => {
    try {
        // Primero verificar si ya hay una sesión activa
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            console.log('Usuario ya autenticado:', session.user.email);
            return;
        }

        // Si no hay sesión, autenticar automáticamente
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'miguel.ochoa.gallegos@gmail.com',
            password: 'sarimbd'
        });

        if (error) {
            console.error('Error en autenticación automática:', error);
            return;
        }

        console.log('Autenticación automática exitosa:', data.user.email);
    } catch (error) {
        console.error('Error inesperado en autenticación:', error);
    }
};

// Ejecutar autenticación automática al cargar el módulo
authenticateUser();
