import React, { useEffect, useState } from 'react'

interface LowStockItem {
  id: string
  name: string
  quantity: number
  reorder_point: number
  status: string
}

const LowStockAlert: React.FC = () => {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)
  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || ''

  useEffect(() => {
    const fetchLowStockItems = async () => {
      try {
        const response = await fetch(
          `${serverURL}/api/inventory?where[status][equals]=low_stock&limit=10`,
        )
        const data = await response.json()
        setLowStockItems(data.docs || [])
      } catch (error) {
        console.error('Error fetching low stock items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLowStockItems()
  }, [serverURL])

  if (loading) {
    return <div>Loading low stock alerts...</div>
  }

  if (lowStockItems.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          margin: '16px 0',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', color: '#0ea5e9' }}>✅ All Stock Levels Normal</h3>
        <p style={{ margin: 0, color: '#0369a1' }}>No items are currently low in stock.</p>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#fef2f2',
        border: '1px solid #ef4444',
        borderRadius: '8px',
        margin: '16px 0',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', color: '#dc2626' }}>
        ⚠️ Low Stock Alert ({lowStockItems.length} items)
      </h3>
      <div style={{ display: 'grid', gap: '8px' }}>
        {lowStockItems.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '8px 12px',
              backgroundColor: '#fecaca',
              borderRadius: '4px',
              border: '1px solid #fca5a5',
            }}
          >
            <strong>{item.name}</strong> - Quantity: {item.quantity} (Reorder point:{' '}
            {item.reorder_point})
          </div>
        ))}
      </div>
    </div>
  )
}

export default LowStockAlert
