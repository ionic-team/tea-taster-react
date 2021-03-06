import React from 'react';
import Axios from 'axios';
import { Plugins } from '@capacitor/core';
import { renderHook, act, cleanup } from '@testing-library/react-hooks';
import { useAuthentication } from './useAuthentication';
import { AuthProvider } from './AuthContext';
import { mockSession } from './__mocks__/mockSession';

const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;

describe('useAuthentication', () => {
  beforeEach(() => {
    (Plugins.Storage as any) = jest.fn();
    (Plugins.Storage.get as any) = jest.fn(async () => ({ value: null }));
    (Plugins.Storage.set as any) = jest.fn(async () => ({}));
    (Axios.post as any) = jest.fn(async () => ({
      data: {
        success: true,
        token: mockSession.token,
        user: mockSession.user,
      },
    }));
  });

  describe('login', () => {
    it('POSTs the login request', async () => {
      const url = `${process.env.REACT_APP_DATA_SERVICE}/login`;
      const { result, waitForNextUpdate } = renderHook(
        () => useAuthentication(),
        { wrapper },
      );
      await waitForNextUpdate();
      await act(() => result.current.login('test@test.com', 'P@ssword!'));
      expect(Axios.post).toHaveBeenCalledTimes(1);
      expect(Axios.post).toHaveBeenCalledWith(url, {
        username: 'test@test.com',
        password: 'P@ssword!',
      });
    });

    describe('on success', () => {
      it('stores the token in storage', async () => {
        const { result, waitForNextUpdate } = renderHook(
          () => useAuthentication(),
          { wrapper },
        );
        await waitForNextUpdate();
        await act(() => result.current.login('test@test.com', 'P@ssword!'));
        expect(Plugins.Storage.set).toHaveBeenCalledTimes(1);
        expect(Plugins.Storage.set).toHaveBeenCalledWith({
          key: 'auth-token',
          value: mockSession.token,
        });
      });

      it('sets the session', async () => {
        const { result, waitForNextUpdate } = renderHook(
          () => useAuthentication(),
          { wrapper },
        );
        await waitForNextUpdate();
        await act(() => result.current.login('test@test.com', 'P@ssword!'));
        expect(result.current.session).toEqual(mockSession);
      });
    });

    describe('on failure', () => {
      beforeEach(() => {
        (Axios.post as any) = jest.fn(async () => ({
          data: { success: false },
        }));
      });

      it('sets the error', async () => {
        const { result, waitForNextUpdate } = renderHook(
          () => useAuthentication(),
          { wrapper },
        );
        await waitForNextUpdate();
        await act(() => result.current.login('test@test.com', 'P@ssword!'));
        expect(result.current.error).toEqual('Failed to log in.');
      });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      (Plugins.Storage.remove as any) = jest.fn(async () => ({}));
      (Plugins.Storage.get as any) = jest.fn(async () => ({
        value: mockSession.token,
      }));
      (Axios.get as any) = jest.fn(async () => ({ data: mockSession.user }));
    });

    it('POSTs the logout request', async () => {
      const url = `${process.env.REACT_APP_DATA_SERVICE}/logout`;
      const headers = { Authorization: 'Bearer ' + mockSession.token };
      const { result, waitForNextUpdate } = renderHook(
        () => useAuthentication(),
        { wrapper },
      );
      await waitForNextUpdate();
      await act(() => result.current.logout());
      expect(Axios.post).toHaveBeenCalledTimes(1);
      expect(Axios.post).toHaveBeenCalledWith(url, null, { headers });
    });

    describe('on success', () => {
      it('removes the token from storage', async () => {
        const { result, waitForNextUpdate } = renderHook(
          () => useAuthentication(),
          { wrapper },
        );
        await waitForNextUpdate();
        await act(() => result.current.logout());
        expect(Plugins.Storage.remove).toHaveBeenCalledTimes(1);
        expect(Plugins.Storage.remove).toHaveBeenCalledWith({
          key: 'auth-token',
        });
      });

      it('clears the session', async () => {
        const { result, waitForNextUpdate } = renderHook(
          () => useAuthentication(),
          { wrapper },
        );
        await waitForNextUpdate();
        expect(result.current.session).toEqual(mockSession);
        await act(() => result.current.logout());
        expect(result.current.session).toBeUndefined();
      });
    });

    describe('on failure', () => {
      it('sets the error', async () => {
        const { result, waitForNextUpdate } = renderHook(
          () => useAuthentication(),
          { wrapper },
        );
        await waitForNextUpdate();
        await act(() => result.current.login('test@test.com', 'P@ssword!'));
        expect(result.current.session).toEqual(mockSession);
        (Axios.post as any) = jest.fn(async () => {
          throw new Error('Failed to log out');
        });
        await act(() => result.current.logout());
        expect(result.current.error).toEqual('Failed to log out');
      });
    });
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });
});
