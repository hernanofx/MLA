'use client';

import { useState, useEffect } from 'react';

interface Location {
  id: string;
  warehouseId: string;
  name: string;
  description?: string;
  warehouse: {
    name: string;
  };
}

export default function LocationsTab() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ warehouseId: '', name: '', description: '' });

  useEffect(() => {
    fetchLocations();
    fetchWarehouses();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      setLocations([]);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setWarehouses(data.map((w: any) => ({ id: w.id, name: w.name })));
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ warehouseId: '', name: '', description: '' });
        setShowForm(false);
        fetchLocations();
      }
    } catch (error) {
      console.error('Failed to create location:', error);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Ubicaciones</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'Cancelar' : 'Nueva Ubicación'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={formData.warehouseId}
              onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              className="border p-2 rounded"
              required
            >
              <option value="">Seleccionar Almacén</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Descripción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border p-2 rounded"
            />
          </div>
          <button type="submit" className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Crear
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => (
          <div key={location.id} className="border p-4 rounded shadow">
            <h3 className="text-lg font-semibold">{location.name}</h3>
            <p className="text-gray-600">Almacén: {location.warehouse.name}</p>
            <p className="text-sm text-gray-500">{location.description}</p>
            <div className="mt-2 flex space-x-2">
              <button className="text-blue-500 hover:text-blue-700">Editar</button>
              <button className="text-red-500 hover:text-red-700">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}