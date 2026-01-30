"use client";
import React, { useState } from 'react';
import ClienteFormModal from './ClienteFormModal';
import { Card } from "@/components/ui/card";

// TODO: Integrar com API de clientes
const mockClientes = [
  { id: 1, tipo: 'FISICA', nome: 'João Silva', cpf: '123.456.789-00', email: 'joao@email.com', telefone: '11999999999' },
  { id: 2, tipo: 'JURIDICA', nome: 'Empresa XYZ Ltda', cnpj: '12.345.678/0001-99', email: 'contato@xyz.com', telefone: '1133334444' },
];

export default function ClienteList() {
  const [showModal, setShowModal] = useState(false);
  const [clientes, setClientes] = useState(mockClientes);

  function handleAddCliente(cliente: any) {
    setClientes((prev) => [...prev, { ...cliente, id: prev.length + 1 }]);
    setShowModal(false);
  }

  return (
    <Card className="w-full max-w-4xl mx-auto p-6 mt-4 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Clientes Cadastrados</h2>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full font-semibold shadow transition-all duration-150 text-sm"
          onClick={() => setShowModal(true)}
        >
          + CLIENTE
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border rounded-xl overflow-hidden text-sm bg-transparent shadow">
          <thead>
            <tr className="bg-gray-900">
              <th className="p-2 border text-gray-100 font-semibold">Tipo</th>
              <th className="p-2 border text-gray-100 font-semibold">Nome/Razão Social</th>
              <th className="p-2 border text-gray-100 font-semibold">CPF/CNPJ</th>
              <th className="p-2 border text-gray-100 font-semibold">E-mail</th>
              <th className="p-2 border text-gray-100 font-semibold">Telefone</th>
              <th className="p-2 border text-gray-100 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td className="p-2 border">{c.tipo === 'FISICA' ? 'Física' : 'Jurídica'}</td>
                <td className="p-2 border">{c.nome}</td>
                <td className="p-2 border">{c.tipo === 'FISICA' ? c.cpf : c.cnpj}</td>
                <td className="p-2 border">{c.email}</td>
                <td className="p-2 border">{c.telefone}</td>
                <td className="p-2 border flex gap-2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full font-semibold shadow text-xs select-none cursor-default">Editar</span>
                  <span className="bg-red-600 text-white px-4 py-1 rounded-full font-semibold shadow text-xs select-none cursor-default">Excluir</span>
                  <span className="bg-gray-700 text-white px-4 py-1 rounded-full font-semibold shadow text-xs select-none cursor-default">Ver</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de criação de cliente */}
      <ClienteFormModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleAddCliente} />
    </Card>
  );
}
