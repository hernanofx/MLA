'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Inventory {
  id: string;
  entryId: string | null;
  providerId: string | null;
  locationId: string;
  quantity: number;
  status: string;
  entry?: {
    id: string;
    provider: { name: string };
  } | null;
  provider?: { name: string };
  location: {
    name: string;
    warehouse: { name: string };
  };
}

interface Entry {
  id: string;
  provider: { name: string };
}

interface Location {
  id: string;
  name: string;
  warehouse: { name: string };
}

interface Provider {
  id: string;
  name: string;
}

interface EditInventoryFormProps {
  inventory: Inventory;
  entries: Entry[];
  locations: Location[];
  providers: Provider[];
}

export default function EditInventoryForm({ inventory, entries, locations, providers }: EditInventoryFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    providerId: inventory.providerId || '',
    locationId: inventory.locationId,
    quantity: inventory.quantity,
    status: inventory.status
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/inventory/${inventory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/stocks');
      } else {
        alert('Error al actualizar el registro de inventario');
      }
    } catch (error) {
      console.error('Failed to update inventory:', error);
      alert('Error al actualizar el registro de inventario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="providerId" className="block text-sm font-medium text-gray-700">
                Proveedor
              </label>
              <select
                id="providerId"
                value={formData.providerId}
                onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Seleccionar Proveedor</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="locationId" className="block text-sm font-medium text-gray-700">
                Ubicación
              </label>
              <select
                id="locationId"
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Seleccionar Ubicación</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.warehouse.name} - {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Cantidad
              </label>
              <input
                type="number"
                id="quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                min="1"
                required
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="stored">Almacenado</option>
                <option value="shipped">Enviado</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/stocks')}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}