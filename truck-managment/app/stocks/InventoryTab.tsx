'use client';

import { useState, useEffect } from 'react';

interface Inventory {
  id: string;
  entryId: string;
  locationId: string;
  quantity: number;
  status: string;
  entry: {
    id: string;
    provider: { name: string };
  };
  location: {
    name: string;
    warehouse: { name: string };
  };
}

export default function InventoryTab() {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    entryId: '',
    locationId: '',
    quantity: 1,
    status: 'stored'
  });

  useEffect(() => {
    fetchInventories();
  }, []);

  const fetchInventories = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setInventories(data);
    } catch (error) {
      console.error('Failed to fetch inventories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ entryId: '', locationId: '', quantity: 1, status: 'stored' });
        setShowForm(false);
        fetchInventories();
      }
    } catch (error) {
      console.error('Failed to create inventory:', error);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Inventario</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'Cancelar' : 'Nuevo Inventario'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Entry ID"
              value={formData.entryId}
              onChange={(e) => setFormData({ ...formData, entryId: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Location ID"
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="Cantidad"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="border p-2 rounded"
              min="1"
              required
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="border p-2 rounded"
            >
              <option value="stored">Almacenado</option>
              <option value="shipped">Enviado</option>
            </select>
          </div>
          <button type="submit" className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Crear
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Proveedor</th>
              <th className="py-2 px-4 border-b">Almacén</th>
              <th className="py-2 px-4 border-b">Ubicación</th>
              <th className="py-2 px-4 border-b">Cantidad</th>
              <th className="py-2 px-4 border-b">Estado</th>
              <th className="py-2 px-4 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inventories.map((inv) => (
              <tr key={inv.id}>
                <td className="py-2 px-4 border-b">{inv.entry.provider.name}</td>
                <td className="py-2 px-4 border-b">{inv.location.warehouse.name}</td>
                <td className="py-2 px-4 border-b">{inv.location.name}</td>
                <td className="py-2 px-4 border-b">{inv.quantity}</td>
                <td className="py-2 px-4 border-b">{inv.status}</td>
                <td className="py-2 px-4 border-b">
                  <button className="text-blue-500 hover:text-blue-700 mr-2">Editar</button>
                  <button className="text-red-500 hover:text-red-700">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}