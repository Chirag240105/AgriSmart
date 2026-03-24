import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Package, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/api';
import apiClient from '../services/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
export const OrdersPage = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const fetchOrders = async () => {
        try {
            const response = await orderService.getAllOrders();
            const mapped = (response.data?.data || []).map((order) => ({
                id: order._id,
                _id: order._id,
                cropName: order.cropId?.cropName || 'Unknown Crop',
                quantity: order.quantity,
                totalAmount: order.totalAmount || 0,
                status: order.status || 'pending',
                createdAt: order.createdAt || new Date().toISOString(),
                buyerId: order.buyerId,
            }));
            setOrders(mapped);
        }
        catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load orders');
        }
        finally {
            setIsLoading(false);
        }
    };
    const createPaymentOrder = (orderId) => apiClient.post('/payments/create-order', { orderId });
    const verifyPayment = (data) => apiClient.post('/payments/verify', data);
    const requestRefund = (orderId) => apiClient.post('/payments/refund', { orderId });
    const handlePayment = async (order) => {
        try {
            const { data } = await createPaymentOrder(order._id);
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data.amount,
                currency: data.currency,
                name: 'AgriSmart 🌱',
                description: 'Crop Order Payment',
                order_id: data.razorpayOrderId,
                prefill: {
                    name: user?.name,
                    email: user?.email,
                },
                theme: { color: '#16a34a' },
                handler: async (response) => {
                    await verifyPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        orderId: order._id,
                    });
                    toast.success('Payment successful! 🎉');
                    fetchOrders();
                },
            };
            if (!window.Razorpay) {
                toast.error('Payment SDK not ready. Please retry in a moment.');
                return;
            }
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', () => toast.error('Payment failed. Try again.'));
            rzp.open();
        }
        catch (err) {
            toast.error('Could not initiate payment.');
        }
    };
    const handleRefund = async (orderId) => {
        try {
            await requestRefund(orderId);
            toast.success('Refund initiated successfully.');
            fetchOrders();
        }
        catch (err) {
            toast.error('Refund failed. Try again.');
        }
    };
    useEffect(() => {
        if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            document.body.appendChild(script);
        }
        fetchOrders();
    }, []);
    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'default';
            case 'failed':
                return 'destructive';
            case 'pending':
                return 'outline';
            default:
                return 'outline';
        }
    };
    const filterByStatus = (status) => {
        if (!status)
            return orders;
        return orders.filter((order) => order.status === status);
    };
    const OrderCard = ({ order, index }) => (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{order.cropName}</CardTitle>
              <CardDescription>Order #{order.id}</CardDescription>
            </div>
            <Badge variant={getStatusColor(order.status)}>
              {t(`orders.status.${order.status}`)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground"/>
                <div>
                  <p className="text-muted-foreground">{t('crops.quantity')}</p>
                  <p className="font-medium">{order.quantity}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground"/>
                <div>
                  <p className="text-muted-foreground">{t('orders.total')}</p>
                  <p className="font-medium">INR {order.totalAmount.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground"/>
                <div>
                  <p className="text-muted-foreground">{t('orders.orderDate')}</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground mb-1">
              {user?.role === 'farmer' ? t('orders.buyer') : t('orders.seller')}
            </p>
            <p className="font-medium">
              {user?.role === 'farmer' ? order.buyerId || t('orders.buyer') : t('nav.profile')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              {t('orders.viewDetails')}
            </Button>
            {user?.role !== 'farmer' && order.status === 'pending' && (<Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handlePayment(order)}>
                {t('orders.payNow')}
              </Button>)}
            {user?.role !== 'farmer' && order.status === 'paid' && (<Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRefund(order._id)}>
                {t('orders.refund')}
              </Button>)}
          </div>
        </CardContent>
      </Card>
    </motion.div>);
    if (isLoading) {
        return (<div className="flex items-center justify-center h-64">
        <div className="animate-pulse">{t('common.loading')}</div>
      </div>);
    }
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('orders.title')}</h1>
        <p className="text-muted-foreground">{t('orders.subtitle')}</p>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">{t('orders.all')}</TabsTrigger>
          <TabsTrigger value="pending">{t('orders.status.pending')}</TabsTrigger>
          <TabsTrigger value="paid">{t('orders.status.paid')}</TabsTrigger>
          <TabsTrigger value="failed">{t('orders.status.failed')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {orders.map((order, index) => (<OrderCard key={order.id} order={order} index={index}/>))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {filterByStatus('pending').map((order, index) => (<OrderCard key={order.id} order={order} index={index}/>))}
          </div>
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {filterByStatus('paid').map((order, index) => (<OrderCard key={order.id} order={order} index={index}/>))}
          </div>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {filterByStatus('failed').map((order, index) => (<OrderCard key={order.id} order={order} index={index}/>))}
          </div>
        </TabsContent>
      </Tabs>
    </div>);
};
