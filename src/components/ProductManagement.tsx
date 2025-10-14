import React, { useState, useEffect } from 'react'
import { supabase, Product } from '../lib/supabase'

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    barcode: '',
    low_stock_threshold: '',
    cost_price: '',
    selling_price: '',
    brand: ''
  })

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  // Filter products based on search term and category
  useEffect(() => {
    const filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = !selectedCategory || product.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    setFilteredProducts(filtered)
  }, [products, searchTerm, selectedCategory])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error loading products:', error)
        if (error.message.includes('relation "products" does not exist')) {
          alert('Products table does not exist. Please run the database setup first. Check DATABASE_SETUP.md for instructions.')
        }
        throw error
      }
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      // Set empty products array on error
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null)

      if (error) throw error
      
      const uniqueCategories = Array.from(new Set(data?.map(item => item.category) || []))
      setCategories(uniqueCategories.sort())
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const addNewCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()].sort())
      setFormData({...formData, category: newCategory.trim()})
      setNewCategory('')
      setShowNewCategoryInput(false)
    }
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      category: '',
      barcode: '',
      low_stock_threshold: '',
    cost_price: '',
    selling_price: '',
    brand: ''
    })
    setShowAddModal(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      category: product.category,
      barcode: product.barcode || '',
      low_stock_threshold: product.low_stock_threshold.toString(),
      cost_price: product.cost_price?.toString() || '',
      selling_price: product.selling_price?.toString() || '',
      brand: product.brand || ''
    })
    setShowAddModal(true)
  }

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category: formData.category,
        barcode: formData.barcode || undefined,
        low_stock_threshold: parseInt(formData.low_stock_threshold),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        selling_price: formData.selling_price ? parseFloat(formData.selling_price) : undefined,
        brand: formData.brand || undefined
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) {
          console.error('Update error:', error)
          if (error.message.includes('row-level security policy')) {
            throw new Error(`Database security policy error. Please run the FIX_RLS_POLICIES.sql script in your Supabase SQL Editor to fix this issue.`)
          }
          throw new Error(`Failed to update product: ${error.message}`)
        }
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData)

        if (error) {
          console.error('Insert error:', error)
          if (error.message.includes('row-level security policy')) {
            throw new Error(`Database security policy error. Please run the FIX_RLS_POLICIES.sql script in your Supabase SQL Editor to fix this issue.`)
          }
          throw new Error(`Failed to create product: ${error.message}`)
        }
      }

      setShowAddModal(false)
      loadProducts()
      alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!')
    } catch (error) {
      console.error('Error saving product:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error saving product: ${errorMessage}`)
    }
  }

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`
  }

  const calculateProfitMargin = (costPrice: number | null | undefined, sellingPrice: number | null | undefined) => {
    if (!costPrice || !sellingPrice) return 'N/A'
    const margin = ((sellingPrice - costPrice) / sellingPrice) * 100
    return `${margin.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    )
  }

  return (
    <div className="product-management">
      <div className="page-header">
        <h1>Product Management</h1>
        <button className="btn btn-primary" onClick={handleAddProduct}>
          + Add New Product
        </button>
      </div>

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
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('')
            }}
          >
            Clear Filters
          </button>
        </div>
        
        <div style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
          Showing {filteredProducts.length} of {products.length} products
          {searchTerm && ` matching "${searchTerm}"`}
          {selectedCategory && ` in ${selectedCategory}`}
        </div>
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Cost Price</th>
              <th>Selling Price</th>
              <th>Profit Margin</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="product-cell">
                    <div className="product-name">{product.name}</div>
                    <div className="product-description">{product.description}</div>
                  </div>
                </td>
                <td>{product.category}</td>
                <td>{product.cost_price ? formatPrice(product.cost_price) : 'N/A'}</td>
                <td>{formatPrice(product.price)}</td>
                <td>{calculateProfitMargin(product.cost_price, product.price)}</td>
                <td>
                  <span className={`stock-badge ${product.quantity <= product.low_stock_threshold ? 'low-stock' : ''}`}>
                    {product.quantity}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${product.quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => handleEditProduct(product)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <div className="category-input-container">
                    <select
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === 'add_new') {
                          setShowNewCategoryInput(true)
                        } else {
                          setFormData({...formData, category: e.target.value})
                          setShowNewCategoryInput(false)
                        }
                      }}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      <option value="add_new">+ Add New Category</option>
                    </select>
                    
                    {showNewCategoryInput && (
                      <div className="new-category-input">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter new category name"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addNewCategory()}
                        />
                        <div className="new-category-buttons">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={addNewCategory}
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setShowNewCategoryInput(false)
                              setNewCategory('')
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cost Price (₦)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Selling Price (₦) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Low Stock Threshold</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Barcode</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  />
                </div>
              </div>


              <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductManagement
