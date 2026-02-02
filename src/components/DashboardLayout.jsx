import React from 'react';
import { Header } from '@/components/Header';

export function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-6 px-4">
        {children}
      </main>
    </div>
  );
}
