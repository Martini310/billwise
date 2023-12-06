import { useEffect } from 'react';
import { useAuth } from 'src/hooks/use-auth';

const GoogleCallbackPage = () => {
    const auth = useAuth();

    useEffect(() => {
        // const urlParams = new URLSearchParams(window.location.search);
        const urlParams = 'http://127.0.0.1:3000';
        const accessToken = urlParams.get('access_token');

        auth.signIn('google', accessToken);
    }, []);

    return null;
};

export default GoogleCallbackPage;