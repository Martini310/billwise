import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import PropTypes from 'prop-types';
import { axiosInstance } from 'src/utils/axios';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';


const HANDLERS = {
  INITIALIZE: 'INITIALIZE',
  SIGN_IN: 'SIGN_IN',
  SIGN_OUT: 'SIGN_OUT'
};

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null
};

const handlers = {
  [HANDLERS.INITIALIZE]: (state, action) => {
    const user = action.payload;

    return {
      ...state,
      ...(
        // if payload (user) is provided, then is authenticated
        user
          ? ({
            isAuthenticated: true,
            isLoading: false,
            user
          })
          : ({
            isLoading: false
          })
      )
    };
  },
  [HANDLERS.SIGN_IN]: (state, action) => {
    const user = action.payload;

    return {
      ...state,
      isAuthenticated: true,
      user
    };
  },
  [HANDLERS.SIGN_OUT]: (state) => {
    return {
      ...state,
      isAuthenticated: false,
      user: null
    };
  }
};

const reducer = (state, action) => (
  handlers[action.type] ? handlers[action.type](state, action) : state
);

// The role of this context is to propagate authentication state through the App tree.

export const AuthContext = createContext({ undefined });

export const AuthProvider = (props) => {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const initialized = useRef(false);
  const router = useRouter();


  const initialize = async () => {
    // Prevent from calling twice in development mode with React.StrictMode enabled
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    let isAuthenticated = false;

    try {
      isAuthenticated = window.sessionStorage.getItem('authenticated') === 'true';
    } catch (err) {
      console.error(err);
    }

    if (isAuthenticated) {
      const user = {
        id: '5e86809283e28b96d2d38537',
        avatar: '/assets/avatars/avatar-anika-visser.png',
        name: 'Anika Visser',
        email: 'anika.visser@devias.io'
      };

      dispatch({
        type: HANDLERS.INITIALIZE,
        payload: user
      });
    } else {
      dispatch({
        type: HANDLERS.INITIALIZE
      });
    }
  };

  useEffect(
    () => {
      initialize();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const signIn = async (email, password) => {

    try {
      const response = await axiosInstance.post(`token/`, {
        email: email,
        password: password,
      });
      console.log(response)
      // Check if the response contains the access token
      if (response.data.access) {
        // Store the access token in Cookies
        const token = response.data.access;
        Cookies.set('access_token', token, {sameSite: 'Lax'});
        Cookies.set('refresh_token', response.data.refresh, {sameSite: 'Lax'});
        Cookies.set('username', response.data.username, {sameSite: 'Lax'});
        Cookies.set('id', response.data.id, {sameSite: 'Lax'});

        window.sessionStorage.setItem('authenticated', 'true');

        // Set the authorization header for future requests
        axiosInstance.defaults.headers['Authorization'] =
          'JWT ' + token;

        console.log(response.data)
  
        // Dispatch the SIGN_IN action with the user data
        dispatch({
          type: HANDLERS.SIGN_IN,
          payload: {
            id: response.data.id,
            avatar: '/assets/avatars/avatar-fran-perez.png',
            name: response.data.username,
            email: email
          }
        });
  
        // Redirect the user or perform other actions as needed
        router.push('/');

      } else {
        // Handle error: Unable to retrieve access token
        console.error('Access token not found in response');
      }
    } catch (error) {
      // Handle authentication error
      console.error('Authentication failed:', error);
      return error.response.data.detail
    }
  };

  const signUp = async (email, username, name, password) => {

  //   axiosInstance
  //     .post(`user/register/`, {
  //       email: email,
  //       username: username,
  //       first_name: name,
  //       password: password,
  //     })
  //     .then((res) => {
  //       console.log(res);
  //       console.log(res.data);
  //     });
  // };
  try {
    const response = await axiosInstance.post(`user/register/`, {
      email: email,
      username: username,
      first_name: name,
      password: password,
    });
    console.log(response)
    // Check if the response contains the access token
    if (response.status === 201) {

      console.log(response.data)

      // Redirect the user or perform other actions as needed
      router.push('/auth/login');

    } else {
      // Handle error: Unable to retrieve access token
      console.error('Some error');
    }
  } catch (error) {
    // Handle authentication error
    console.error('Registration failed:', error);
    return error.response.data
  }
};

  const signOut = () => {
        axiosInstance.post('user/logout/blacklist/', {
            refresh_token: Cookies.get('refresh_token')
        });
        window.sessionStorage.setItem('authenticated', false);
        axiosInstance.defaults.headers['Authorization'] = null;
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        Cookies.remove('username');
        Cookies.remove('id');

    dispatch({
      type: HANDLERS.SIGN_OUT
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node
};

export const AuthConsumer = AuthContext.Consumer;

export const useAuthContext = () => useContext(AuthContext);
