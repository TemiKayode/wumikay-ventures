// Receipt printing utility - Modern Professional Design
export interface ReceiptData {
  orderNumber: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  logoUrl?: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
  subtotal: number
  posCharge: number
  total: number
  paymentMode: 'cash' | 'pos'
  orderDate: string
  notes?: string
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  receiptFooterMessage?: string
  // Payment tracking fields
  amountPaid?: number
  amountDue?: number
  change?: number
  paymentStatus?: 'paid' | 'partial' | 'unpaid'
}

export interface PrintOptions {
  printAdminCopy?: boolean
  printCustomerCopy?: boolean
  copyType?: 'admin' | 'customer'
}

// Print both admin and customer copies
export const printDualReceipts = (receiptData: ReceiptData) => {
  // Print admin copy first
  printReceipt(receiptData, { copyType: 'admin' })
  
  // Print customer copy after a short delay
  setTimeout(() => {
    printReceipt(receiptData, { copyType: 'customer' })
  }, 1500)
}

export const printReceipt = (receiptData: ReceiptData, options: PrintOptions = {}) => {
  if (!receiptData || !receiptData.items || receiptData.items.length === 0) {
    console.error('Invalid receipt data:', receiptData)
    alert('Cannot print receipt: Invalid receipt data')
    return
  }

  const { copyType = 'customer' } = options
  const isAdminCopy = copyType === 'admin'
  const isElectron = window.navigator.userAgent.toLowerCase().includes('electron')
  
  let printWindow: Window | null = null
  
  try {
    printWindow = window.open('', '_blank', 'width=450,height=700')
  } catch (error) {
    console.error('Error opening print window:', error)
  }
  
  if (!printWindow) {
    try {
      printWindow = window.open('', '_blank')
    } catch (error) {
      console.error('Error opening print window (fallback):', error)
      alert('Cannot open print window. Please check your browser popup settings.')
      return
    }
    
    if (!printWindow) {
      alert('Please allow popups to print receipts.')
      return
    }
  }

  // Load saved settings
  let savedSettings: any = null
  try {
    const settingsRaw = localStorage.getItem('wumikay-settings')
    if (settingsRaw) savedSettings = JSON.parse(settingsRaw)
  } catch (e) {
    console.warn('Failed to parse saved settings:', e)
  }

  const currencySymbol = savedSettings?.currencySymbol || '₦'
  const receiptSettings = savedSettings?.receiptSettings || {
    showLogo: true,
    showCompanyInfo: true,
    showItemDetails: true,
    receiptWidth: '80mm',
    fontSize: '12px',
    printAutomatically: false
  }

  const formatPrice = (price: number) => `${currencySymbol}${price.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-NG', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Resolve logo URL
  let logoUrl = receiptData.logoUrl || '/logo.png'
  try {
    logoUrl = new URL(logoUrl, window.location.href).href
  } catch (e) {
    try { logoUrl = `${window.location.origin}/logo.png` } catch (err) { /* ignore */ }
  }

  // Get footer message
  const footerMessage = receiptData.receiptFooterMessage || savedSettings?.receiptFooter || 'Thank you for shopping with us!'

  const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${receiptData.orderNumber}</title>
  <style>
    /* System fonts only - works offline */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;
      font-size: ${receiptSettings.fontSize || '11px'};
      line-height: 1.4;
      background: white;
      color: #1f2937;
      padding: 0;
      margin: 0;
      width: ${receiptSettings.receiptWidth || '80mm'};
    }
    
    .receipt {
      width: 100%;
      max-width: ${receiptSettings.receiptWidth || '80mm'};
      margin: 0;
      padding: 8px 10px;
    }
    
    /* Header with Logo - Compact */
    .header {
      text-align: center;
      padding-bottom: 8px;
      border-bottom: 1px dashed #9ca3af;
      margin-bottom: 8px;
    }
    
    .logo-container {
      margin-bottom: 5px;
    }
    
    .logo-img {
      max-width: 70px;
      max-height: 50px;
      height: auto;
      margin: 0 auto;
      display: block;
    }
    
    .company-name {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin: 4px 0 2px 0;
      letter-spacing: -0.3px;
    }
    
    .company-tagline {
      font-size: 8px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .company-info {
      font-size: 9px;
      color: #4b5563;
      margin-top: 4px;
      line-height: 1.4;
    }
    
    /* Receipt Title - Compact */
    .receipt-title {
      text-align: center;
      background: #1f2937;
      color: white;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    /* Order Info - Compact */
    .order-info {
      background: #f3f4f6;
      border-radius: 4px;
      padding: 6px 8px;
      margin-bottom: 8px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: 9px;
    }
    
    .info-label {
      color: #6b7280;
      font-weight: 500;
    }
    
    .info-value {
      color: #111827;
      font-weight: 600;
      text-align: right;
    }
    
    /* Items Section - Compact */
    .items-section {
      margin-bottom: 8px;
    }
    
    .items-header {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid #d1d5db;
      font-size: 8px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .items-header span:first-child { flex: 2; }
    .items-header span:nth-child(2) { width: 40px; text-align: center; }
    .items-header span:last-child { width: 70px; text-align: right; }
    
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      border-bottom: 1px dotted #d1d5db;
    }
    
    .item-row:last-child {
      border-bottom: none;
    }
    
    .item-name {
      flex: 2;
      font-size: 10px;
      font-weight: 500;
      color: #1f2937;
    }
    
    .item-qty {
      width: 30px;
      text-align: center;
      font-size: 9px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
    }
    
    .item-price {
      width: 70px;
      text-align: right;
      font-size: 12px;
      font-weight: 600;
      color: #111827;
    }
    
    /* Totals Section - Compact */
    .totals-section {
      background: #f3f4f6;
      border-radius: 4px;
      padding: 6px 8px;
      margin-bottom: 8px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 10px;
    }
    
    .total-label {
      color: #4b5563;
    }
    
    .total-value {
      font-weight: 600;
      color: #1f2937;
    }
    
    .pos-charge {
      color: #dc2626;
    }
    
    .grand-total {
      border-top: 2px solid #e5e7eb;
      margin-top: 8px;
      padding-top: 10px;
    }
    
    .grand-total .total-label {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
    }
    
    .grand-total .total-value {
      font-size: 16px;
      font-weight: 700;
      color: #059669;
    }
    
    /* Payment Badge */
    .payment-badge {
      text-align: center;
      margin-bottom: 15px;
    }
    
    .badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .badge-cash {
      background: #dcfce7;
      color: #166534;
    }
    
    .badge-pos {
      background: #dbeafe;
      color: #1e40af;
    }
    
    /* Notes */
    .notes {
      background: #fef3c7;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 15px;
      font-size: 11px;
    }
    
    .notes-label {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 4px;
    }
    
    .notes-text {
      color: #78350f;
    }
    
    /* Footer - Compact */
    .footer {
      text-align: center;
      padding-top: 8px;
      border-top: 1px dashed #9ca3af;
      margin-top: 5px;
    }
    
    .footer-message {
      font-size: 9px;
      color: #4b5563;
      line-height: 1.4;
      margin-bottom: 5px;
    }
    
    .footer-timestamp {
      font-size: 8px;
      color: #9ca3af;
      margin-top: 5px;
    }
    
    .barcode-placeholder {
      margin: 5px auto;
      padding: 4px;
      background: #f3f4f6;
      border-radius: 2px;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9px;
      letter-spacing: 1px;
    }
    
    /* Print Styles - Windows Compatible Receipt Format */
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: ${receiptSettings.receiptWidth || '80mm'} !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      .receipt {
        max-width: none !important;
        width: 100% !important;
        padding: 3mm !important;
        margin: 0 !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
        page-break-before: avoid !important;
      }
      
      .receipt-title {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Prevent any element from breaking across pages */
      .header, .order-info, .items-section, .totals-section, 
      .payment-badge, .notes, .footer {
        page-break-inside: avoid !important;
      }
      
      /* Hide browser default headers/footers */
      @page {
        margin: 0mm !important;
      }
    }
    
    /* Page size - 80mm width, auto height (grows with content) */
    @page {
      size: ${receiptSettings.receiptWidth || '80mm'} auto;
      margin: 0mm;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <!-- Header with Logo -->
    <div class="header" style="display: ${receiptSettings.showLogo || receiptSettings.showCompanyInfo ? 'block' : 'none'}">
      <div class="logo-container" style="display: ${receiptSettings.showLogo ? 'block' : 'none'}">
        <img 
          src="${logoUrl}" 
          alt="${receiptData.companyName}" 
          class="logo-img"
          onerror="this.style.display='none'"
        >
      </div>
      <div class="company-name">${receiptData.companyName}</div>
      <div class="company-tagline">Sales Receipt</div>
      <div class="company-info" style="display: ${receiptSettings.showCompanyInfo ? 'block' : 'none'}">
        ${receiptData.companyAddress}<br>
        📞 ${receiptData.companyPhone}<br>
        ✉️ ${receiptData.companyEmail}
      </div>
    </div>

    <!-- Receipt Title -->
    <div class="receipt-title">
      ${isAdminCopy ? '📋 ADMIN COPY' : 'Official Receipt'}
    </div>
    ${isAdminCopy ? `
    <div style="text-align: center; background: #fef3c7; padding: 4px; border-radius: 4px; font-size: 10px; margin-bottom: 10px;">
      ⚠️ Keep this copy for your records
    </div>
    ` : ''}

    <!-- Order Info -->
    <div class="order-info">
      <div class="info-row">
        <span class="info-label">Receipt No:</span>
        <span class="info-value">${receiptData.orderNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span class="info-value">${formatDate(receiptData.orderDate)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Customer:</span>
        <span class="info-value">${receiptData.customerName}</span>
      </div>
      ${receiptData.customerPhone ? `
      <div class="info-row">
        <span class="info-label">Phone:</span>
        <span class="info-value">${receiptData.customerPhone}</span>
      </div>
      ` : ''}
    </div>

    <!-- Items -->
    <div class="items-section">
      <div class="items-header">
        <span>Item</span>
        <span>Qty</span>
        <span>Amount</span>
      </div>
      ${receiptData.items.map(item => `
        <div class="item-row">
          <span class="item-name">${item.name}</span>
          <span class="item-qty">${item.quantity}</span>
          <span class="item-price">${formatPrice(item.subtotal)}</span>
        </div>
      `).join('')}
    </div>

    <!-- Totals -->
    <div class="totals-section">
      <div class="total-row">
        <span class="total-label">Subtotal</span>
        <span class="total-value">${formatPrice(receiptData.subtotal)}</span>
      </div>
      ${receiptData.paymentMode === 'pos' && receiptData.posCharge > 0 ? `
      <div class="total-row">
        <span class="total-label pos-charge">POS Charge</span>
        <span class="total-value pos-charge">+${formatPrice(receiptData.posCharge)}</span>
      </div>
      ` : ''}
      <div class="total-row grand-total">
        <span class="total-label">TOTAL</span>
        <span class="total-value">${formatPrice(receiptData.total)}</span>
      </div>
    </div>

    <!-- Payment Details - Compact -->
    <div style="background: #f8fafc; border: 1px solid #d1d5db; border-radius: 4px; padding: 6px 8px; margin-bottom: 8px;">
      <div style="text-align: center; font-weight: bold; font-size: 8px; color: #475569; margin-bottom: 4px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 3px;">
        PAYMENT
      </div>
      <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 10px;">
        <span>Paid:</span>
        <span style="font-weight: bold; color: #22c55e;">${formatPrice(receiptData.amountPaid ?? receiptData.total)}</span>
      </div>
      ${(receiptData.change || 0) > 0 ? `
      <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 10px;">
        <span>Change:</span>
        <span style="font-weight: bold; color: #16a34a;">${formatPrice(receiptData.change || 0)}</span>
      </div>
      ` : ''}
      ${(receiptData.amountDue || 0) > 0 ? `
      <div style="display: flex; justify-content: space-between; padding: 4px 6px; font-size: 10px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 3px; margin-top: 4px;">
        <span style="color: #991b1b; font-weight: 600;">BALANCE:</span>
        <span style="font-weight: bold; color: #dc2626;">${formatPrice(receiptData.amountDue || 0)}</span>
      </div>
      ` : `
      <div style="text-align: center; padding: 3px; background: #dcfce7; border-radius: 2px; margin-top: 3px;">
        <span style="color: #166534; font-weight: 600; font-size: 9px;">PAID</span>
      </div>
      `}
    </div>

    <!-- Payment Method -->
    <div class="payment-badge">
      <span class="badge ${receiptData.paymentMode === 'cash' ? 'badge-cash' : 'badge-pos'}">
        ${receiptData.paymentMode === 'cash' ? '💵 Paid with Cash' : '💳 Paid with POS'}
      </span>
      ${receiptData.paymentStatus && receiptData.paymentStatus !== 'paid' ? `
      <div style="margin-top: 6px;">
        <span style="display: inline-block; padding: 4px 12px; background: ${receiptData.paymentStatus === 'partial' ? '#f59e0b' : '#ef4444'}; color: white; border-radius: 12px; font-size: 10px; font-weight: 600;">
          ${receiptData.paymentStatus === 'partial' ? 'PARTIAL PAYMENT' : 'UNPAID'}
        </span>
      </div>
      ` : ''}
    </div>

    <!-- Notes -->
    ${receiptData.notes ? `
    <div class="notes">
      <div class="notes-label">📝 Notes:</div>
      <div class="notes-text">${receiptData.notes}</div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <div class="footer-message">
        ${footerMessage.split('\\n').map((line: string) => line.trim()).filter(Boolean).join('<br>')}
      </div>
      <div class="barcode-placeholder">
        ${receiptData.orderNumber}
      </div>
      <div class="footer-timestamp">
        Printed: ${new Date().toLocaleString('en-NG')}
      </div>
    </div>
  </div>
</body>
</html>
`

  try {
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
  } catch (error) {
    console.error('Error writing receipt HTML:', error)
    alert('Error generating receipt. Please try again.')
    if (printWindow && !printWindow.closed) printWindow.close()
    return
  }
  
  const triggerPrint = () => {
    if (!printWindow || printWindow.closed) return
    
    try {
      printWindow.focus()
      if (receiptSettings.printAutomatically) {
        printWindow.print()
      } else {
        printWindow.print()
      }
      
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          setTimeout(() => {
            if (printWindow && !printWindow.closed) printWindow.close()
          }, isElectron ? 2000 : 1000)
        }
      }, 500)
    } catch (error) {
      console.error('Error during print:', error)
      alert('Print dialog failed. Use Ctrl+P to print manually.')
    }
  }
  
  if (printWindow.document.readyState === 'complete') {
    setTimeout(triggerPrint, 200)
  } else {
    printWindow.onload = () => setTimeout(triggerPrint, 200)
  }
  
  setTimeout(() => {
    if (printWindow && !printWindow.closed) {
      try { triggerPrint() } catch (e) { console.error('Fallback print error:', e) }
    }
  }, isElectron ? 2500 : 2000)
}

// Generate receipt data from order
export const generateReceiptData = (
  order: any,
  cartItems: any[],
  companyInfo: { name: string; address: string; phone: string; email: string }
): ReceiptData => {
  if (!order) throw new Error('Order data is required')
  
  if (!cartItems || cartItems.length === 0) {
    if (order.items && order.items.length > 0) {
      cartItems = order.items.map((item: any) => ({
        id: item.product_id,
        name: item.product_name,
        price: item.unit_price,
        quantity: item.quantity
      }))
    } else {
      throw new Error('No items found for receipt')
    }
  }
  
  const calculatedSubtotal = cartItems.reduce((sum, item) => {
    const price = item.price || item.unit_price || 0
    const quantity = item.quantity || 1
    return sum + (price * quantity)
  }, 0)
  
  const subtotal = order.subtotal_amount || calculatedSubtotal
  const posCharge = order.pos_charge || 0
  const total = order.total_amount || (subtotal + posCharge)
  
  const receiptItems = cartItems.map(item => {
    const price = item.price || item.unit_price || 0
    const quantity = item.quantity || 1
    return {
      name: item.name || item.product_name || 'Unknown Item',
      quantity: quantity,
      unitPrice: price,
      subtotal: price * quantity
    }
  })

  // Get footer message from settings
  let receiptFooterMessage: string | undefined
  try {
    const settingsRaw = localStorage.getItem('wumikay-settings')
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw)
      if (parsed?.receiptFooter?.trim()) {
        receiptFooterMessage = parsed.receiptFooter.trim()
      }
    }
  } catch (e) {
    console.warn('Failed to load receipt footer:', e)
  }
  
  return {
    orderNumber: order.order_number || `ORD-${Date.now()}`,
    customerName: order.customer_name || 'Walk-in Customer',
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    items: receiptItems,
    subtotal: subtotal,
    posCharge: posCharge,
    total: total,
    paymentMode: (order.payment_mode || order.paymentMode || 'cash') as 'cash' | 'pos',
    orderDate: order.order_date || order.orderDate || new Date().toISOString(),
    notes: order.notes,
    companyName: companyInfo.name,
    companyAddress: companyInfo.address,
    companyPhone: companyInfo.phone,
    companyEmail: companyInfo.email,
    receiptFooterMessage,
    logoUrl: (companyInfo as any).logoUrl
  }
}
