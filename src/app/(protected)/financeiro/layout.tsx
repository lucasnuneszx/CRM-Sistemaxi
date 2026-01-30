'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingDown, TrendingUp } from 'lucide-react';

export default function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(
    pathname.includes('contas-a-receber') ? 'receber' : 'pagar'
  );

  useEffect(() => {
    setActiveTab(pathname.includes('contas-a-receber') ? 'receber' : 'pagar');
  }, [pathname]);

  const handleTabChange = (value: string) => {
    if (value === 'pagar') {
      router.push('/financeiro/contas-a-pagar');
    } else {
      router.push('/financeiro/contas-a-receber');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pagar" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Contas a Pagar
          </TabsTrigger>
          <TabsTrigger value="receber" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Contas a Receber
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {children}
    </div>
  );
}

