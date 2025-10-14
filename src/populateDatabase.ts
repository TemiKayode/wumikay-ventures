import { supabase } from './lib/supabase'

export const populateDatabase = async () => {
  try {
    console.log('Populating database with sample data...')

    // Check if demo user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'demo@wumikay.com')
      .single()

    if (!existingUser) {
      // Create demo user only if it doesn't exist
      const { error: userError } = await supabase
        .from('users')
        .insert({
          username: 'demo',
          email: 'demo@wumikay.com',
          password: 'demo123',
          role: 'customer'
        })

      if (userError) {
        console.log('Demo user creation failed:', userError.message)
      } else {
        console.log('Demo user created successfully!')
      }
    } else {
      console.log('Demo user already exists')
    }

    // Sample products data
    const sampleProducts = [
      {
        name: 'Coca-Cola PET Bottle',
        description: 'PET Coke',
        price: 4450,
        quantity: 100,
        category: 'Beverages',
        barcode: 'COCA001',
        low_stock_threshold: 10,
        cost_price: 4000,
        selling_price: 4450,
        brand: 'Coca-Cola'
      },
      {
        name: 'Fanta Orange PET Bottle',
        description: 'PET Fanta',
        price: 4450,
        quantity: 100,
        category: 'Beverages',
        barcode: 'FANTA001',
        low_stock_threshold: 10,
        cost_price: 4000,
        selling_price: 4450,
        brand: 'Fanta'
      },
      {
        name: 'Pepsi Cola PET Bottle',
        description: 'PET Pepsi',
        price: 4400,
        quantity: 100,
        category: 'Beverages',
        barcode: 'PEPSI001',
        low_stock_threshold: 10,
        cost_price: 3950,
        selling_price: 4400,
        brand: 'Pepsi'
      },
      {
        name: 'Sprite Lemon-Lime PET Bottle',
        description: 'PET Sprite',
        price: 4450,
        quantity: 100,
        category: 'Beverages',
        barcode: 'SPRITE001',
        low_stock_threshold: 10,
        cost_price: 4000,
        selling_price: 4450,
        brand: 'Sprite'
      },
      {
        name: 'Mr. V Bottled Water',
        description: 'MR. V WATER',
        price: 1800,
        quantity: 100,
        category: 'Water',
        barcode: 'MRV001',
        low_stock_threshold: 10,
        cost_price: 1500,
        selling_price: 1800,
        brand: 'Mr. V'
      },
      {
        name: 'Eva Bottled Water',
        description: 'Eva Water',
        price: 2850,
        quantity: 100,
        category: 'Water',
        barcode: 'EVA001',
        low_stock_threshold: 10,
        cost_price: 2500,
        selling_price: 2850,
        brand: 'Eva'
      }
    ]

    // Check if products already exist
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    if (!existingProducts || existingProducts.length === 0) {
      // Insert sample products only if none exist
      const { error: productsError } = await supabase
        .from('products')
        .insert(sampleProducts)

      if (productsError) {
        console.error('Error inserting products:', productsError)
      } else {
        console.log('Sample products inserted successfully!')
      }
    } else {
      console.log('Products already exist, skipping insertion')
    }

    return true
  } catch (error) {
    console.error('Database population failed:', error)
    return false
  }
}
