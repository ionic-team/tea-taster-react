import { Storage } from '@capacitor/storage';
import Axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export const useAuthentication = () => {
  const { state, dispatch } = useContext(AuthContext);

  if (state === undefined) {
    throw new Error('useAuthentication must be used with an AuthProvider');
  }

  const login = async (username: string, password: string): Promise<void> => {
    dispatch({ type: 'LOGIN' });
    try {
      const url = `${process.env.REACT_APP_DATA_SERVICE}/login`;
      const { data } = await Axios.post(url, { username, password });

      if (!data.success) throw new Error('Failed to log in.');

      await Storage.set({ key: 'auth-token', value: data.token });
      const session = { token: data.token, user: data.user };
      dispatch({ type: 'LOGIN_SUCCESS', session });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', error: error.message });
    }
  };

  const logout = async (): Promise<void> => {
    dispatch({ type: 'LOGOUT' });
    try {
      const url = `${process.env.REACT_APP_DATA_SERVICE}/logout`;
      const headers = { Authorization: 'Bearer ' + state.session!.token };

      await Axios.post(url, null, { headers });
      await Storage.remove({ key: 'auth-token' });
      dispatch({ type: 'LOGOUT_SUCCESS' });
    } catch (error) {
      dispatch({ type: 'LOGOUT_FAILURE', error: error.message });
    }
  };

  return {
    session: state.session,
    loading: state.loading,
    error: state.error,
    login,
    logout,
  };
};
