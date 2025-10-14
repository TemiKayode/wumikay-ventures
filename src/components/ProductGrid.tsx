import React from 'react'
import { Product } from '../lib/supabase'

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product) => void
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart }) => {
  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
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
      
      {products.length === 0 && (
        <div className="text-center" style={{ gridColumn: '1 / -1', padding: '2rem' }}>
          <img src="/logo.png" alt="No products" style={{ width: '60px', height: '60px', opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: '#666', fontSize: '1.1rem' }}>No products available</p>
        </div>
      )}
    </div>
  )
}

export default ProductGrid
