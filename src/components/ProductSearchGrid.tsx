import React, { useState, useMemo } from 'react'
import { Product } from '../lib/supabase'

interface ProductSearchGridProps {
  products: Product[]
  onAddToCart: (product: Product) => void
}

const ProductSearchGrid: React.FC<ProductSearchGridProps> = ({ products, onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showAll, setShowAll] = useState(false)

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
          <input
            type="text"
            className="search-input"
            placeholder="Search products by name, description, brand, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
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
              <div className="product-stock">
                Stock: {product.quantity} units
              </div>
              <div className="product-category">
                Category: {product.category}
              </div>
              {product.brand && (
                <div className="product-brand">
                  Brand: {product.brand}
                </div>
              )}
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
            <img src="/logo.png" alt="No products" style={{ width: '60px', height: '60px', opacity: 0.3, marginBottom: '1rem' }} />
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
