'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import WarehousesTab from './WarehousesTab';
import InventoryTab from './InventoryTab';
import LocationsTab from './LocationsTab';
import PackagesTab from './PackagesTab';
import LabelsTab from './LabelsTab';
import ReexpedicionTab from './ReexpedicionTab';

export default function StocksClient() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'inventory');
  const { data: session } = useSession();

  // Actualizar tab cuando cambie el parámetro de URL
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const allTabs = [
    { id: 'inventory', label: 'Devoluciones' },
    { id: 'reexpedicion', label: 'Reexpedición' },
    { id: 'packages', label: 'Paquetes' },
    { id: 'locations', label: 'Ubicaciones' },
    { id: 'warehouses', label: 'Almacenes' },
    { id: 'labels', label: 'Etiquetas' },
  ];

  const operarioTabs = ['inventory', 'reexpedicion', 'packages', 'locations', 'labels'];
  const tabs = session?.user?.role === 'operario' ? allTabs.filter(tab => operarioTabs.includes(tab.id)) : allTabs;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Stock</h1>
        <p className="mt-2 text-sm text-gray-600">Administra almacenes, ubicaciones, devoluciones y reexpedición</p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'warehouses' && <WarehousesTab />}
        {activeTab === 'locations' && <LocationsTab />}
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'reexpedicion' && <ReexpedicionTab />}
        {activeTab === 'packages' && <PackagesTab />}
        {activeTab === 'labels' && <LabelsTab />}
      </div>
    </div>
  );
}