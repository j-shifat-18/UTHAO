import { api } from './client'

export const paymentApi = {
  getPaymentMethods: () => api.get('/payments/methods'),
  getPaymentRevenue: (params) => api.get('/payments/revenue', { params }),
  getMyPayments: (params) => api.get('/payments/my', { params }),
  getMyInvoices: (params) => api.get('/payments/invoices/my', { params }),
  getAllInvoices: (params) => api.get('/payments/invoices', { params }),
  getInvoiceById: (id) => api.get(`/payments/invoices/${id}`),
  getParcelPayments: (parcelId) => api.get(`/payments/parcels/${parcelId}`),
  getAllPayments: (params) => api.get('/payments', { params }),
  createPayment: (data) => api.post('/payments', data),
  getPaymentById: (id) => api.get(`/payments/${id}`),
  getPaymentInvoice: (paymentId) => api.get(`/payments/${paymentId}/invoice`),
  verifyPayment: (id, data) => api.patch(`/payments/${id}/verify`, data),
  refundPayment: (id, data) => api.patch(`/payments/${id}/refund`, data),
  failPayment: (id, data) => api.patch(`/payments/${id}/fail`, data),
}
