import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Package, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/api';
import { toast } from 'sonner';
export const OrdersPage = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await orderService.getAllOrders();
                const mapped = (response.data?.data || []).map((order) => ({
                    id: order._id,
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
              {order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground"/>
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-medium">{order.quantity}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground"/>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-medium">INR {order.totalAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground"/>
              <div>
                <p className="text-muted-foreground">Order Date</p>
                <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground mb-1">
              {user?.role === 'farmer' ? 'Buyer' : 'Seller'}
            </p>
            <p className="font-medium">
              {user?.role === 'farmer' ? order.buyerId || 'Buyer' : 'Farmer'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>);
    if (isLoading) {
        return (<div className="flex items-center justify-center h-64">
        <div className="animate-pulse">Loading...</div>
      </div>);
    }
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Track and manage your orders</p>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
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
