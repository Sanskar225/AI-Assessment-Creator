'use client';

import './globals.css';
import { Provider } from 'react-redux';
import { store } from '../store';
import { Toaster } from 'react-hot-toast';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { useWebSocket } from '../hooks/useWebSocket';

function AppContent({ children }: { children: React.ReactNode }) {
  useWebSocket();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[220px] min-h-screen max-md:ml-0">
        <Topbar />
        <main className="flex-1 p-7">{children}</main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#fff',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            borderRadius: '12px',
            padding: '12px 16px',
          },
        }}
      />
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>VedaAI — Assessment Creator</title>
        <meta name="description" content="AI-powered assessment creator for teachers" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Provider store={store}>
          <AppContent>{children}</AppContent>
        </Provider>
      </body>
    </html>
  );
}
