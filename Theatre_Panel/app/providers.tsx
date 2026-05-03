'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { AuthProvider } from '@/lib/context/auth-context';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>{children}</AuthProvider>
    </Provider>
  );
}
