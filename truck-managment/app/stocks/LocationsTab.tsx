'use client';

import { useState, useEffect } from 'react';
import ActionMenu from '@/app/components/ActionMenu';

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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta ubicación?')) return;

    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchLocations();
      }
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>;

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Ubicaciones</h2>
          <p className="mt-2 text-sm text-gray-700">Gestiona las ubicaciones dentro de los almacenes</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 h-10"
          >
            {showForm ? 'Cancelar' : 'Nueva Ubicación'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-8 bg-white shadow sm:rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nueva Ubicación</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="warehouseId" className="block text-sm font-medium text-gray-700">
                    Almacén
                  </label>
                  <select
                    id="warehouseId"
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Seleccionar Almacén</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Crear Ubicación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-visible sm:rounded-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {locations.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No hay ubicaciones registradas
            </li>
          ) : (
            locations.map((location) => (
              <li key={location.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{location.name}</h3>
                        <p className="text-sm text-gray-500">Almacén: {location.warehouse.name}</p>
                        <p className="text-sm text-gray-500">{location.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <ActionMenu
                      editHref={`/stocks/locations/${location.id}/edit`}
                      onDelete={() => handleDelete(location.id)}
                    />
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}