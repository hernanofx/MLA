'use client';

import { useState } from 'react';
import WarehousesTab from './WarehousesTab';
import InventoryTab from './InventoryTab';
import LocationsTab from './LocationsTab';

export default function StocksClient() {
  const [activeTab, setActiveTab] = useState('warehouses');

  const tabs = [
    { id: 'warehouses', label: 'Almacenes' },
    { id: 'locations', label: 'Ubicaciones' },
    { id: 'inventory', label: 'Inventario' },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Stock</h1>
        <p className="mt-2 text-sm text-gray-600">Administra almacenes, ubicaciones e inventario</p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
      </div>
    </div>
  );
}