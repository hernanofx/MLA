'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface PackageMovement {
  id: string;
  action: string;
  timestamp: string;
  notes?: string;
  fromProvider?: {
    name: string;
  };
  toProvider?: {
    name: string;
  };
  fromLocation?: {
    name: string;
    warehouse: { name: string };
  };
  toLocation?: {
    name: string;
    warehouse: { name: string };
  };
}

interface Package {
  id: string;
  trackingNumber: string;
  status: string;
  currentProvider?: {
    name: string;
  };
  currentLocation: {
    name: string;
    warehouse: { name: string };
  };
  movements: PackageMovement[];
}

export default function PackageHistoryPage() {
  const params = useParams();
  const trackingNumber = params.trackingNumber as string;
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackage();
  }, [trackingNumber]);

  const fetchPackage = async () => {
    try {
      const res = await fetch(`/api/packages/${trackingNumber}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setPkg(data);
    } catch (error) {
      console.error('Failed to fetch package:', error);
      setPkg(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>;

  if (!pkg) return <div className="text-center py-12">Paquete no encontrado</div>;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Historial del Paquete</h1>
        <p className="mt-2 text-sm text-gray-600">Tracking Number: {pkg.trackingNumber}</p>
      </div>

      <div className="bg-white shadow sm:rounded-lg border border-gray-200 mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información Actual</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd className="mt-1 text-sm text-gray-900">{pkg.status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Proveedor Actual</dt>
              <dd className="mt-1 text-sm text-gray-900">{pkg.currentProvider?.name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Ubicación Actual</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {pkg.currentLocation.warehouse.name} - {pkg.currentLocation.name}
              </dd>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de Movimientos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  De
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  A
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notas
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pkg.movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay movimientos registrados
                  </td>
                </tr>
              ) : (
                pkg.movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(movement.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.action === 'ingreso' ? 'Ingreso' :
                       movement.action === 'traspaso' ? 'Traspaso' :
                       'Salida'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.fromProvider?.name || 'N/A'} - {movement.fromLocation ? `${movement.fromLocation.warehouse.name} / ${movement.fromLocation.name}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.toProvider?.name || 'N/A'} - {movement.toLocation ? `${movement.toLocation.warehouse.name} / ${movement.toLocation.name}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.notes || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}