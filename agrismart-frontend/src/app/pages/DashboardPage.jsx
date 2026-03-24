import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Leaf, ShoppingCart, Package, DollarSign, Activity, AlertCircle, } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cropService, orderService, priceService } from '../services/api';
import { toast } from 'sonner';
export const DashboardPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentCrops, setRecentCrops] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [marketPrices, setMarketPrices] = useState([]);
    useEffect(() => {
        const loadData = async () => {
            try {
                const [cropsRes, ordersRes, pricesRes] = await Promise.all([
                    cropService.getAllCrops(),
                    orderService.getAllOrders(),
                    priceService.getLatestPrices(undefined, 6),
                ]);
                const crops = (cropsRes.data?.data || []).map((crop) => ({
                    id: crop._id,
                    name: crop.cropName,
                    variety: crop.variety || 'Unknown',
                    quantity: crop.quantity,
                    unit: crop.unit || 'kg',
                    status: crop.status || 'available',
                    image: crop.images?.[0],
                }));
                const orders = (ordersRes.data?.data || []).map((order) => ({
                    id: order._id,
                    cropName: order.cropId?.cropName || 'Unknown Crop',
                    quantity: order.quantity,
                    totalAmount: order.totalAmount || 0,
                    status: order.status || 'pending',
                    createdAt: order.createdAt || new Date().toISOString(),
                }));
                const prices = (pricesRes.data?.data || []).map((record) => {
                    const oldValue = record.historicalPrices?.[record.historicalPrices.length - 1]?.price || record.predictedPrice || 0;
                    const newValue = record.predictedPrice || 0;
                    const change = oldValue ? ((newValue - oldValue) / oldValue) * 100 : 0;
                    const trend = record.trend === 'increase' ? 'up' : record.trend === 'decrease' ? 'down' : 'stable';
                    return {
                        id: record._id,
                        product: record.cropName || 'Unknown Crop',
                        currentPrice: Number(record.predictedPrice || 0),
                        unit: record.unit || 'kg',
                        trend,
                        change: Number(change.toFixed(2)),
                    };
                });
                setRecentCrops(crops.slice(0, 3));
                setRecentOrders(orders.slice(0, 3));
                setMarketPrices(prices.slice(0, 4));
                if (user?.role === 'farmer') {
                    const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
                    setStats({
                        totalCrops: crops.length,
                        activeCrops: crops.filter((crop) => crop.status === 'available').length,
                        totalOrders: orders.length,
                        revenue,
                        revenueChange: 0,
                    });
                }
                else {
                    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
                    setStats({
                        totalOrders: orders.length,
                        activeOrders: orders.filter((order) => order.status === 'pending' || order.status === 'paid').length,
                        totalSpent,
                        savedAmount: 0,
                    });
                }
            }
            catch (error) {
                toast.error(error?.response?.data?.message || 'Failed to load dashboard data');
            }
        };
        loadData();
    }, [user?.role]);
    const chartData = useMemo(() => {
        if (!recentOrders.length)
            return [];
        const grouped = {};
        recentOrders.forEach((order) => {
            const label = new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short' });
            grouped[label] = (grouped[label] || 0) + order.totalAmount;
        });
        return Object.entries(grouped).map(([name, revenue]) => ({ name, revenue }));
    }, [recentOrders]);
    if (!stats) {
        return (<div className="flex items-center justify-center h-64">
        <div className="animate-pulse">Loading...</div>
      </div>);
    }
    return (<div className="space-y-6">
      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back, {user?.name}!</CardTitle>
          <CardDescription className="text-green-50">
            Here's what's happening with your {user?.role === 'farmer' ? 'farm' : 'orders'} today
          </CardDescription>
        </CardHeader>
      </Card>

      {user?.role === 'farmer' && (<>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Crops</CardTitle>
                  <Leaf className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCrops}</div>
                  <p className="text-xs text-muted-foreground">{stats.activeCrops} available</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">Orders placed</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">INR {(stats.revenue / 1000).toFixed(0)}K</div>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3"/>
                    {stats.revenueChange}% change
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Crops</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeCrops}</div>
                  <Progress value={stats.totalCrops ? (stats.activeCrops / stats.totalCrops) * 100 : 0} className="mt-2"/>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Revenue by recent order activity</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (<p className="text-sm text-muted-foreground">No revenue data yet.</p>) : (<ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="name"/>
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2}/>
                  </LineChart>
                </ResponsiveContainer>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Crops</CardTitle>
              <CardDescription>Your latest crop listings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCrops.map((crop) => (<div key={crop.id} className="flex items-center gap-4">
                    <img src={crop.image || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400'} alt={crop.name} className="w-16 h-16 rounded-lg object-cover"/>
                    <div className="flex-1">
                      <p className="font-medium">{crop.name}</p>
                      <p className="text-sm text-muted-foreground">{crop.variety}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{crop.quantity} {crop.unit}</p>
                      <Badge variant={crop.status === 'available' ? 'default' : 'secondary'}>
                        {crop.status}
                      </Badge>
                    </div>
                  </div>))}
              </div>
              <Link to="/crops">
                <Button variant="outline" className="w-full mt-4">
                  View All Crops
                </Button>
              </Link>
            </CardContent>
          </Card>
        </>)}

      {user?.role === 'buyer' && (<>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">{stats.activeOrders} active orders</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeOrders}</div>
                  <p className="text-xs text-muted-foreground">Pending or paid</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">INR {(stats.totalSpent / 1000).toFixed(0)}K</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Savings</CardTitle>
                  <TrendingDown className="h-4 w-4 text-green-600"/>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">INR {(stats.savedAmount / 1000).toFixed(0)}K</div>
                  <p className="text-xs text-green-600">Saved through AgriSmart</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your latest purchase orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (<div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.cropName}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.quantity} units � {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">INR {order.totalAmount.toLocaleString()}</p>
                      <Badge variant={order.status === 'paid' ? 'default' : 'outline'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>))}
              </div>
              <Link to="/orders">
                <Button variant="outline" className="w-full mt-4">
                  View All Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </>)}

      <Card>
        <CardHeader>
          <CardTitle>Market Prices</CardTitle>
          <CardDescription>Current market rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {marketPrices.map((price) => (<div key={price.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-green-600 dark:text-green-400"/>
                  </div>
                  <div>
                    <p className="font-medium">{price.product}</p>
                    <p className="text-sm text-muted-foreground">per {price.unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">INR {price.currentPrice}</p>
                  <div className={`flex items-center gap-1 text-xs ${price.trend === 'up' ? 'text-green-600' : price.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                    {price.trend === 'up' ? (<TrendingUp className="h-3 w-3"/>) : (<TrendingDown className="h-3 w-3"/>)}
                    {Math.abs(price.change)}%
                  </div>
                </div>
              </div>))}
          </div>
          <Link to="/prices">
            <Button variant="outline" className="w-full mt-4">
              View All Prices
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/crops">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Leaf className="w-6 h-6"/>
                <span>Manage Crops</span>
              </Button>
            </Link>
            <Link to="/orders">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <ShoppingCart className="w-6 h-6"/>
                <span>View Orders</span>
              </Button>
            </Link>
            <Link to="/weather">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <AlertCircle className="w-6 h-6"/>
                <span>Check Weather</span>
              </Button>
            </Link>
            <Link to="/chatbot">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <AlertCircle className="w-6 h-6"/>
                <span>AI Assistant</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>);
};
