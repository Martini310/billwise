import { useEffect } from 'react';
import { useAuth } from 'src/hooks/use-auth';

const GoogleCallbackPage = () => {
    const auth = useAuth();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        // const urlParams = 'http://localhost:3000/api/auth/callback/google';
        const accessToken = urlParams.get('access_token');

        auth.signIn('google', accessToken);
    }, []);

    return null;
};

export default GoogleCallbackPage;