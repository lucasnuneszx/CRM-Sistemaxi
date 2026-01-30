'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para o dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-center">Redirecionando para o dashboard...</p>
    </div>
  );
}
