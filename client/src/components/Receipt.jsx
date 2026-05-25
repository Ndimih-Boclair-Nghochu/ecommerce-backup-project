import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import axios from '../lib/api'
import { formatXAF } from '../utils/format'

export default function Receipt({ order, onClose }) {
  const receiptRef = useRef(null)
  const [shopName, setShopName] = useState('MyShop')

  useEffect(() => {
    let active = true
    axios.get('/api/settings')
      .then((res) => active && setShopName(res.data.shopName || 'MyShop'))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const downloadPdf = async () => {
    if (!receiptRef.current) return
    const loadingToast = toast.loading('Preparing PDF...')
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 10

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - 20
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= pageHeight - 20
      }

      pdf.save(`receipt-${order.id}.pdf`)
      toast.success('Receipt downloaded')
    } catch {
      toast.error('Could not generate receipt PDF')
    } finally {
      toast.dismiss(loadingToast)
    }
  }

  if (!order) return null

  const buyer = order.buyer || {}
  const totals = order.totals || { subtotal: order.subtotal, shipping: order.shippingFee, total: order.total }

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/60 p-4 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="mb-3 flex justify-end gap-2">
          <button type="button" onClick={downloadPdf} className="rounded-md bg-blue-700 px-4 py-2 font-bold text-white hover:bg-blue-800">
            Download PDF
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="rounded-md bg-white px-4 py-2 font-bold text-gray-800 hover:bg-gray-100">
              Close
            </button>
          )}
        </div>

        <section ref={receiptRef} className="bg-white rounded-lg shadow-xl overflow-hidden text-gray-950">
          <header className="bg-blue-800 text-white p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{shopName}</h1>
                <p className="text-blue-100 mt-1">mile 4, Bamenda, Cameroon</p>
                <p className="text-blue-100">+237 6 52 882 753</p>
              </div>
              <div className="sm:text-right">
                <p className="text-sm text-blue-100">Receipt</p>
                <p className="font-mono font-bold break-all">{order.id}</p>
                <p className="text-sm text-blue-100 mt-1">{new Date(order.createdAt || Date.now()).toLocaleString()}</p>
              </div>
            </div>
          </header>

          <div className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <h2 className="font-bold mb-2">Customer</h2>
                <p>{buyer.name || order.customer?.name || 'Walk-in customer'}</p>
                <p className="text-sm text-gray-600">{buyer.email || ''}</p>
                <p className="text-sm text-gray-600">{buyer.phone || order.customer?.phone || ''}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h2 className="font-bold mb-2">Order</h2>
                <p className="capitalize">Status: {order.status || 'completed'}</p>
                <p>Region: {order.region || 'In store'}</p>
                {order.deliveryAgency && <p>Agency: {order.deliveryAgency}</p>}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="py-3 pr-3">Item</th>
                    <th className="py-3 pr-3 text-center">Qty</th>
                    <th className="py-3 pr-3 text-right">Price</th>
                    <th className="py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item, index) => (
                    <tr key={`${item.id || item.name}-${index}`} className="border-b border-gray-100">
                      <td className="py-3 pr-3 font-semibold">{item.name}</td>
                      <td className="py-3 pr-3 text-center">{item.quantity}</td>
                      <td className="py-3 pr-3 text-right">{formatXAF(item.price)}</td>
                      <td className="py-3 text-right font-bold">{formatXAF(Number(item.price || 0) * Number(item.quantity || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto max-w-sm rounded-lg bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatXAF(totals.subtotal || 0)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{formatXAF(totals.shipping || totals.shippingFee || 0)}</span></div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatXAF(totals.total || 0)}</span>
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              Your order has been received. We will contact you shortly to confirm payment and delivery.
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
