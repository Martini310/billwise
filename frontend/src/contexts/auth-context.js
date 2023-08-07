import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import PropTypes from 'prop-types';
import { axiosInstance } from 'src/utils/axios';
import { useRouter } from 'next/navigation';


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

  const skip = () => {
    try {
      window.sessionStorage.setItem('authenticated', 'true');
    } catch (err) {
      console.error(err);
    }

    const user = {
      id: '5e86809283e28b96d2d38537',
      avatar: '/assets/avatars/avatar-anika-visser.png',
      name: 'Anika Visser',
      email: 'anika.visser@devias.io'
    };

    dispatch({
      type: HANDLERS.SIGN_IN,
      payload: user
    });
  };

  const signIn = async (email, password) => {

    try {
      const response = await axiosInstance.post(`token/`, {
        email: email,
        password: password,
      });
  
      // Check if the response contains the access token
      if (response.data.access) {
        // Store the access token in local storage
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        localStorage.setItem('username', response.data.username);
        window.sessionStorage.setItem('authenticated', 'true');

        console.log(response.data.access, response.data.username)

        // Set the authorization header for future requests
        axiosInstance.defaults.headers['Authorization'] =
          'JWT ' + response.data.access;
  
        // Dispatch the SIGN_IN action with the user data
        dispatch({
          type: HANDLERS.SIGN_IN,
          payload: {
            id: response.data.id,
            avatar: '/assets/avatars/avatar-anika-visser.png',
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
    }
  };

  //   try {

  //     axiosInstance
  //     .post(`token/`, {
  //       email: email,
  //       password: password,
  //     })
  //     .then((res) => {
  //       localStorage.setItem('access_token', res.data.access);
  //       localStorage.setItem('refresh_token', res.data.refresh);
  //       localStorage.setItem('user', res.data.username);

  //       console.log(res.data.access, res.data.username)
  //       axiosInstance.defaults.headers['Authorization'] =
  //         'JWT ' + localStorage.getItem('access_token');
  //     })
  //     window.sessionStorage.setItem('authenticated', 'true');
  //     // router.push('/');
  //     router.reload();
  //   } catch (err) {
  //     console.error(err);
  //   }

  //   const user = {
  //     id: '5e86809283e28b96d2d38537',
  //     avatar: '/assets/avatars/avatar-anika-visser.png',
  //     name: localStorage.getItem('user'),
  //     email: email
  //   };

  //   dispatch({
  //     type: HANDLERS.SIGN_IN,
  //     payload: user
  //   });
  // };

  const signUp = async (email, username, password) => {

    axiosInstance
      .post(`user/register/`, {
        email: email,
        user_name: username,
        password: password,
      })
      .then((res) => {
        console.log(res);
        console.log(res.data);
      });
  };

  const signOut = () => {

        axiosInstance.post('user/logout/blacklist/', {
            refresh_token: localStorage.getItem('refresh_token'),
        });
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('username');
        window.sessionStorage.setItem('authenticated', false);
        axiosInstance.defaults.headers['Authorization'] = null;

    dispatch({
      type: HANDLERS.SIGN_OUT
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        skip,
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
