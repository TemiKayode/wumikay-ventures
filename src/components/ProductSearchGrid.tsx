import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Product } from '../lib/api'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import Tooltip from './Tooltip'

interface ProductSearchGridProps {
  products: Product[]
  onAddToCart: (product: Product) => void
}

const ProductSearchGrid: React.FC<ProductSearchGridProps> = ({ products, onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showAll, setShowAll] = useState(true) // Show all products by default
  const [barcodeMode, setBarcodeMode] = useState(false)
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Handle barcode scan
  const handleBarcodeScan = useCallback((barcode: string) => {
    console.log('Barcode scanned:', barcode)
    
    // Search for product by barcode or name
    const product = products.find(p => 
      p.barcode === barcode || 
      p.name.toLowerCase() === barcode.toLowerCase() ||
      p.name.toLowerCase().includes(barcode.toLowerCase())
    )
    
    if (product) {
      onAddToCart(product)
      setLastScannedProduct(product)
      // Show brief feedback
      setTimeout(() => setLastScannedProduct(null), 2000)
    } else {
      // If no exact match, set as search term
      setSearchTerm(barcode)
    }
  }, [products, onAddToCart])

  // Use barcode scanner hook
  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: barcodeMode,
    minLength: 3,
    maxDelay: 100
  })

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`
  }

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(product => product.category)))
    return uniqueCategories.sort()
  }, [products])

  // Filter products based on search term and category
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = !selectedCategory || product.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    
    // Show only first 12 products unless showAll is true or there's a search/filter
    if (!showAll && !searchTerm && !selectedCategory) {
      return filtered.slice(0, 12)
    }
    
    return filtered
  }, [products, searchTerm, selectedCategory, showAll])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
  }

  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="product-search-container">
        <div className="search-filters">
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              ref={searchInputRef}
              type="text"
              className="search-input barcode-enabled"
              placeholder={barcodeMode ? "📷 Scan barcode or type to search..." : "Search products by name, description, brand, or category..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.length >= 3) {
                  handleBarcodeScan(searchTerm)
                  setSearchTerm('')
                }
              }}
              style={{
                borderColor: barcodeMode ? '#10b981' : undefined,
                boxShadow: barcodeMode ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : undefined
              }}
            />
            {lastScannedProduct && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#10b981',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '0 0 8px 8px',
                fontSize: '14px',
                fontWeight: 500,
                zIndex: 10,
                animation: 'fadeIn 0.3s ease'
              }}>
                ✅ Added: {lastScannedProduct.name}
              </div>
            )}
          </div>
          
          <Tooltip text={barcodeMode ? 'Disable barcode scanner mode' : 'Enable barcode scanner mode'} position="bottom">
            <button
              type="button"
              onClick={() => setBarcodeMode(!barcodeMode)}
              style={{
                padding: '10px 16px',
                backgroundColor: barcodeMode ? '#10b981' : '#f3f4f6',
                color: barcodeMode ? 'white' : '#4b5563',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📷 {barcodeMode ? 'ON' : 'OFF'}
            </button>
          </Tooltip>
          
          <select
            className="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          
          <button
            className="clear-filters"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
        
        <div style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            Showing {filteredProducts.length} of {products.length} products
            {searchTerm && ` matching "${searchTerm}"`}
            {selectedCategory && ` in ${selectedCategory}`}
          </span>
          {!searchTerm && !selectedCategory && products.length > 12 && (
            <button
              className="btn btn-outline"
              onClick={() => setShowAll(!showAll)}
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            >
              {showAll ? 'Show Less' : `Show All ${products.length} Products`}
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="product-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-card">
            <h3 className="product-name">{product.name}</h3>
            <p className="product-description">{product.description}</p>
            
            <div className="product-details">
              <div className="product-price">{formatPrice(product.price)}</div>
              <div className={`product-stock ${product.quantity <= 0 ? 'out-of-stock' : ''}`}>
                Stock: {product.quantity} units
              </div>
              <div className="product-category">
                Category: {product.category || '—'}
              </div>
              <div className="product-brand">
                Brand: {product.brand || '—'}
              </div>
            </div>
            
            <div className="product-actions">
              <button 
                className="btn btn-primary"
                onClick={() => onAddToCart(product)}
                disabled={product.quantity === 0}
              >
                {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
        
        {filteredProducts.length === 0 && (
          <div className="text-center" style={{ gridColumn: '1 / -1', padding: '2rem' }}>
            <img src={((): string => { try { const s = localStorage.getItem('wumikay-settings'); if (s) { const p = JSON.parse(s); return p.logoUrl || (p.companyInfo && p.companyInfo.logoUrl) || '/logo.png' } } catch(e){} return '/logo.png' })()} alt="No products" style={{ width: '60px', height: '60px', opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '0.5rem' }}>No products found</p>
            <p style={{ color: '#999', fontSize: '0.9rem' }}>
              {searchTerm || selectedCategory 
                ? 'Try adjusting your search or filter criteria' 
                : 'No products available'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductSearchGrid
