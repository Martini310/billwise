import axios from 'axios';
import Cookies from 'js-cookie';

// export const baseURL = 'http://127.0.0.1:8000/api/';
// export const baseURL = 'https://billwise-api.onrender.com/api/';
export const baseURL = 'http://localhost:8000/api/';

export const axiosInstance = axios.create({
    baseURL: baseURL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',

    },
});

// Request interceptor to add the JWT token from cookies to the headers
axiosInstance.interceptors.request.use((config) => {
	const token = Cookies.get('access_token');
	if (token) {
	  config.headers.Authorization = `JWT ${token}`;
	}
	return config;
  });

axiosInstance.interceptors.response.use(
	(response) => {
		return response;
	},
	async function (error) {
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
			originalRequest.url === baseURL + 'token/refresh/'
			) {
				window.location.href = '/auth/login/';
				return Promise.reject(error);
		}

		if (
			error.response.data.code === 'token_not_valid' &&
			error.response.status === 401 &&
			error.response.statusText === 'Unauthorized'
			) {
			const refreshToken = Cookies.get('refresh_token');

			if (refreshToken ) {

				if (refreshToken === 'undefined') { 
					window.location.href = 'auth/login/'
					return console.log('Refresh token not available.')
				}
				const tokenParts = JSON.parse(atob(refreshToken.split('.')[1]));

				// exp date in token is expressed in seconds, while now() returns milliseconds:
				const now = Math.ceil(Date.now() / 1000);
				console.log(tokenParts.exp);

				if (tokenParts.exp > now) {
					return axiosInstance
						.post('/token/refresh/', { refresh: refreshToken })
						.then((response) => {
							Cookies.set('access_token', response.data.access);
							Cookies.set('refresh_token', response.data.refresh);

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