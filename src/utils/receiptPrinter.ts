// Receipt printing utility
export interface ReceiptData {
  orderNumber: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
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
}

export const printReceipt = (receiptData: ReceiptData) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=400,height=600')
  
  if (!printWindow) {
    alert('Please allow popups to print receipts')
    return
  }

  const formatPrice = (price: number) => `₦${price.toLocaleString()}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString()

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${receiptData.orderNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          padding: 10px;
          background: white;
          color: black;
        }
        .receipt {
          max-width: 300px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .logo {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .company-info {
          font-size: 10px;
          margin-bottom: 10px;
        }
        .order-info {
          margin-bottom: 10px;
        }
        .order-info div {
          margin-bottom: 3px;
        }
        .items {
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .item-name {
          flex: 1;
        }
        .item-qty {
          margin: 0 10px;
        }
        .item-price {
          text-align: right;
          min-width: 60px;
        }
        .totals {
          margin-bottom: 10px;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .total-line.total {
          font-weight: bold;
          font-size: 14px;
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }
        .payment-info {
          text-align: center;
          margin-bottom: 10px;
          padding: 5px;
          background: #f0f0f0;
          border-radius: 3px;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          margin-top: 15px;
          border-top: 1px dashed #000;
          padding-top: 10px;
        }
        .pos-charge {
          color: #d32f2f;
        }
        @media print {
          body { margin: 0; }
          .receipt { max-width: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="logo">${receiptData.companyName}</div>
          <div class="company-info">
            ${receiptData.companyAddress}<br>
            Tel: ${receiptData.companyPhone}<br>
            Email: ${receiptData.companyEmail}
          </div>
        </div>

        <div class="order-info">
          <div><strong>Order #:</strong> ${receiptData.orderNumber}</div>
          <div><strong>Date:</strong> ${formatDate(receiptData.orderDate)}</div>
          <div><strong>Customer:</strong> ${receiptData.customerName}</div>
          ${receiptData.customerPhone ? `<div><strong>Phone:</strong> ${receiptData.customerPhone}</div>` : ''}
        </div>

        <div class="items">
          <div style="font-weight: bold; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 3px;">
            <span style="flex: 1;">Item</span>
            <span style="margin: 0 10px;">Qty</span>
            <span style="text-align: right; min-width: 60px;">Price</span>
          </div>
          ${receiptData.items.map(item => `
            <div class="item">
              <div class="item-name">${item.name}</div>
              <div class="item-qty">${item.quantity}</div>
              <div class="item-price">${formatPrice(item.subtotal)}</div>
            </div>
          `).join('')}
        </div>

        <div class="totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>${formatPrice(receiptData.subtotal)}</span>
          </div>
          ${receiptData.paymentMode === 'pos' ? `
            <div class="total-line pos-charge">
              <span>POS Charge:</span>
              <span>${formatPrice(receiptData.posCharge)}</span>
            </div>
          ` : ''}
          <div class="total-line total">
            <span>TOTAL:</span>
            <span>${formatPrice(receiptData.total)}</span>
          </div>
        </div>

        <div class="payment-info">
          <strong>Payment: ${receiptData.paymentMode.toUpperCase()}</strong>
        </div>

        ${receiptData.notes ? `
          <div style="margin-bottom: 10px; font-size: 10px;">
            <strong>Notes:</strong> ${receiptData.notes}
          </div>
        ` : ''}

        <div class="footer">
          Thank you for your business!<br>
          Please keep this receipt for your records
        </div>
      </div>
    </body>
    </html>
  `

  printWindow.document.write(receiptHTML)
  printWindow.document.close()
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }
}

// Generate receipt data from order and cart
export const generateReceiptData = (
  order: any,
  cartItems: any[],
  companyInfo: {
    name: string
    address: string
    phone: string
    email: string
  }
): ReceiptData => {
  return {
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    items: cartItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      subtotal: item.price * item.quantity
    })),
    subtotal: order.subtotal_amount || order.total_amount,
    posCharge: order.pos_charge || 0,
    total: order.total_amount,
    paymentMode: order.payment_mode || 'cash',
    orderDate: order.order_date,
    notes: order.notes,
    companyName: companyInfo.name,
    companyAddress: companyInfo.address,
    companyPhone: companyInfo.phone,
    companyEmail: companyInfo.email
  }
}
