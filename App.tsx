import React, { useEffect } from 'react';
import { testSupabaseConnection } from './src/lib/supabase';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
    useEffect(() => {
        testSupabaseConnection();
    }, []);

    return <AppNavigator />;
}
