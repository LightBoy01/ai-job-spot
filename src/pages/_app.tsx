import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import '../lib/firebase'; // Explicitly import to ensure initialization

function MyApp({ Component, pageProps }: AppProps) {
  // You can optionally log the app here to confirm it's initialized
  // console.log('Firebase app initialized in _app.tsx:', app);

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          className: '',
          style: {
            margin: '40px',
            background: '#363636',
            color: '#fff',
            zIndex: 1,
          },
          duration: 5000,
          success: {
            duration: 3000,
          },
          error: {
            duration: 5000,
          },
        }}
      />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
