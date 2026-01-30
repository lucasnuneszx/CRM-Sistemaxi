import React from 'react';
import ClienteForm from '../../../components/clients/ClienteForm';
import ClienteList from '../../../components/clients/ClienteList';

export default function ClientesPage() {
  return (
    <div className="w-full flex flex-col gap-8 py-10 px-2 md:px-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-primary">Cadastro de Clientes</h1>
      <div className="grid grid-cols-1 gap-8">
        <ClienteForm />
        <ClienteList />
      </div>
    </div>
  );
}
