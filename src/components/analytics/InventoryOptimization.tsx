import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, AlertTriangle, TrendingUp, Bell } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'react-hot-toast';

interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  minThreshold: number;
  maxThreshold: number;
  dailyDemand: number;
  predictedStockout?: string;
  reorderPoint: number;
}

interface InventoryTrend {
  date: string;
  stock: number;
  demand: number;
  predicted: number;
}

interface Props {
  inventoryData: {
    items: InventoryItem[];
    trends: InventoryTrend[];
  };
}

export const InventoryOptimization: React.FC<Props> = ({ inventoryData }) => {
  const [showOverview, setShowOverview] = useState(false);
  const [stockPredictions, setStockPredictions] = useState<{ [key: string]: Date }>({});

  useEffect(() => {
    // Calculate stock-out predictions and show notifications
    const predictions = calculateStockPredictions(inventoryData.items);
    setStockPredictions(predictions);

    // Show notifications for critical items
    Object.entries(predictions).forEach(([itemName, date]) => {
      const daysUntilStockout = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilStockout <= 7) {
        toast.error(
          `Critical: ${itemName} will stock out in ${daysUntilStockout} days!`,
          {
            duration: 5000,
            icon: '⚠️',
          }
        );
      }
    });
  }, [inventoryData]);

  const calculateStockPredictions = (items: InventoryItem[]) => {
    const predictions: { [key: string]: Date } = {};
    
    items.forEach(item => {
      if (item.dailyDemand > 0) {
        const daysUntilStockout = Math.floor(item.currentStock / item.dailyDemand);
        predictions[item.name] = addDays(new Date(), daysUntilStockout);
      }
    });

    return predictions;
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minThreshold) return 'stockout-risk';
    if (item.currentStock >= item.maxThreshold) return 'overstock';
    return 'optimal';
  };

  const calculateDaysUntilStockout = (item: InventoryItem) => {
    if (item.dailyDemand <= 0) return Infinity;
    return Math.floor(item.currentStock / item.dailyDemand);
  };

  const stockoutRiskItems = inventoryData.items.filter(
    item => getStockStatus(item) === 'stockout-risk'
  );

  const overstockItems = inventoryData.items.filter(
    item => getStockStatus(item) === 'overstock'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stockout-risk':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'overstock':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const StockoutPredictions = () => (
    <div className="mb-6">
      <h4 className="font-semibold mb-4">Stock-out Predictions</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(stockPredictions).map(([itemName, date]) => {
          const daysUntilStockout = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const item = inventoryData.items.find(i => i.name === itemName);
          
          if (!item) return null;
          
          const urgencyClass = daysUntilStockout <= 7 
            ? 'bg-red-50 border-red-200' 
            : daysUntilStockout <= 14 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-blue-50 border-blue-200';

          return (
            <div key={itemName} className={`border rounded-lg p-4 ${urgencyClass}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{itemName}</span>
                <Bell className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <p>Current Stock: {item.currentStock} units</p>
                <p>Daily Demand: {item.dailyDemand} units</p>
                <p className="font-medium mt-2">
                  Predicted stock-out: {format(date, 'MMM d, yyyy')}
                  <br />
                  ({daysUntilStockout} days remaining)
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const InventoryOverview = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Inventory Analysis Overview</h3>
          <button 
            onClick={() => setShowOverview(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <StockoutPredictions />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-semibold mb-4">Stock-out Risk Items</h4>
            <div className="space-y-4">
              {stockoutRiskItems.map(item => (
                <div key={item.id} className="border rounded-lg p-4 bg-red-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-red-600">
                      {item.currentStock} units left
                    </span>
                  </div>
                  <div className="text-sm text-red-600">
                    Predicted stock-out in {calculateDaysUntilStockout(item)} days
                  </div>
                  <div className="mt-2 text-sm">
                    Reorder Point: {item.reorderPoint} units
                  </div>
                  <div className="mt-2 text-sm font-medium">
                    Recommended Action: Order {Math.max(item.reorderPoint - item.currentStock, 0)} units
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Overstock Items</h4>
            <div className="space-y-4">
              {overstockItems.map(item => (
                <div key={item.id} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-yellow-600">
                      {item.currentStock} units (Max: {item.maxThreshold})
                    </span>
                  </div>
                  <div className="text-sm text-yellow-600">
                    {item.currentStock - item.maxThreshold} units above maximum threshold
                  </div>
                  <div className="mt-2 text-sm">
                    Daily Demand: {item.dailyDemand} units
                  </div>
                  <div className="mt-2 text-sm font-medium">
                    Expected normalization: {Math.ceil((item.currentStock - item.maxThreshold) / item.dailyDemand)} days
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-4">Recommendations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stockoutRiskItems.length > 0 && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h5 className="font-medium mb-2">Stock-out Prevention</h5>
                  <ul className="text-sm space-y-2">
                    <li>• Place immediate orders for high-risk items</li>
                    <li>• Review and adjust reorder points</li>
                    <li>• Consider expedited shipping options</li>
                  </ul>
                </div>
              )}
              {overstockItems.length > 0 && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h5 className="font-medium mb-2">Overstock Management</h5>
                  <ul className="text-sm space-y-2">
                    <li>• Consider promotional activities</li>
                    <li>• Review storage costs</li>
                    <li>• Adjust future order quantities</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Demand Forecast</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inventoryData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(new Date(date), 'MMM d')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="demand" 
                    stroke="#2563eb" 
                    name="Actual Demand"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#16a34a" 
                    strokeDasharray="5 5" 
                    name="Predicted Demand"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Package className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-xl font-semibold">Demand & Inventory Optimization</h3>
        </div>
        <button
          onClick={() => setShowOverview(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          View Analysis
        </button>
      </div>

      <StockoutPredictions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryData.items}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="currentStock" name="Current Stock" fill="#2563eb" />
              <Bar dataKey="minThreshold" name="Min Threshold" fill="#ef4444" />
              <Bar dataKey="maxThreshold" name="Max Threshold" fill="#eab308" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <h4 className="font-semibold">Critical Items</h4>
            </div>
            <div className="space-y-2">
              {stockoutRiskItems.slice(0, 3).map(item => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 border rounded-lg bg-red-50"
                >
                  <span className="font-medium">{item.name}</span>
                  <div className="text-right">
                    <span className="text-red-600 block">
                      {item.currentStock} units left
                    </span>
                    <span className="text-sm text-red-500">
                      {calculateDaysUntilStockout(item)} days remaining
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Package className="w-5 h-5 text-yellow-600 mr-2" />
              <h4 className="font-semibold">Overstock Items</h4>
            </div>
            <div className="space-y-2">
              {overstockItems.slice(0, 3).map(item => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 border rounded-lg bg-yellow-50"
                >
                  <span className="font-medium">{item.name}</span>
                  <div className="text-right">
                    <span className="text-yellow-600 block">
                      {item.currentStock} units
                    </span>
                    <span className="text-sm text-yellow-500">
                      {item.currentStock - item.maxThreshold} units excess
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showOverview && <InventoryOverview />}
    </div>
  );
};