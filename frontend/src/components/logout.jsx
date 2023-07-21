import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../axios";

export default function Logout() {
    const navigate = useNavigate();

    useEffect(() => {
        axiosInstance.post('user/logout/blacklist/', {
            refresh_token: localStorage.getItem('refresh_token'),
        });
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userID');
        axiosInstance.defaults.headers['Authorization'] = null;
        navigate('/login');
    });
    return <div>Logout</div>;
}