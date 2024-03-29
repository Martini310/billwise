import axios from 'axios';
import Cookies from 'js-cookie';
import { getSession } from 'next-auth/react';

export const baseURL = process.env.NEXT_PUBLIC_URL

export const axiosInstance = axios.create({
    baseURL: baseURL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
		
    },
});

// Request interceptor to add the JWT token from cookies to the headers
axiosInstance.interceptors.request.use(async (request) => {
	const session = await getSession();
	// const token = fetchedSession.access_token;
	if (session) {
	  request.headers.Authorization = `JWT ${session.access_token}`;
	}
	return request;
});

axiosInstance.interceptors.response.use(
	(response) => {
		return response;
	},
	async function (error) {
		const session = await getSession();
		const originalRequest = error.config;

		if (typeof error.response === 'undefined') {
			alert(
				'A server/network error occurred. ' +
				'Looks like CORS might be the problem. ' +
			'Sorry about this - we will get it fixed shortly.'
				);
				return Promise.reject(error);
			}
			
		if (
				error.response.status === 401 &&
				error.response.data.detail === "Authentication credentials were not provided."
				) {
					console.log('sesja!!!!!!!!', session)
					console.log(axiosInstance.defaults.headers)
					console.log('to tuuuuuuuuuuuuuuuuuuuuuuuuuu')
					window.location.href = '/auth/login/';
					return Promise.reject(error);
			}

		if (
			error.response.status === 401 &&
			originalRequest.url === baseURL + 'auth/token/refresh/'
			) {
				window.location.href = '/auth/login/';
				return Promise.reject(error);
		}

		if (
			error.response.data.code === 'token_not_valid' &&
			error.response.status === 401 &&
			error.response.data.messages[0].message === 'Token is invalid or expired'
			) {
			const refreshToken = session.refresh_token;

			if (refreshToken ) {

				if (refreshToken === 'undefined') { 
					window.location.href = 'auth/login/'
					return console.log('Refresh token not available.')
				}
				const tokenParts = JSON.parse(atob(refreshToken.split('.')[1]));

				// exp date in token is expressed in seconds, while now() returns milliseconds:
				const now = Math.ceil(Date.now() / 1000);
				console.log('token-parts', tokenParts.exp);

				if (tokenParts.exp > now) {
					return axiosInstance
						.post('/token/refresh/', { refresh: refreshToken })
						.then((response) => {
							console.log('odpowiedź', response.data)
							axiosInstance.defaults.headers['Authorization'] =
								'JWT ' + response.data.access;
							originalRequest.headers['Authorization'] =
								'JWT ' + response.data.access;

							return axiosInstance(originalRequest);
						})
						.catch((err) => {
							console.log(err);
						});
				} else {
					console.log('Refresh token is expired', tokenParts.exp, now);
					window.location.href = '/auth/login/';
				}
			} else {
				console.log('Refresh token not available.');
				window.location.href = '/auth/login/';
			}
		}

		// specific error handling done elsewhere
		return Promise.reject(error);
	}
);