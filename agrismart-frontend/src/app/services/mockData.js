// Mock data for fallback when API is unavailable
export const mockUser = {
    id: '1',
    name: 'John Farmer',
    email: 'john@agrismart.com',
    role: 'farmer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
};
export const mockCrops = [
    {
        id: '1',
        name: 'Wheat',
        variety: 'Hard Red Winter',
        quantity: 5000,
        unit: 'kg',
        location: 'Punjab, India',
        plantingDate: '2024-11-15',
        expectedHarvest: '2025-03-20',
        status: 'growing',
        image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400',
        price: 25,
        farmerId: '1',
    },
    {
        id: '2',
        name: 'Rice',
        variety: 'Basmati',
        quantity: 3000,
        unit: 'kg',
        location: 'Haryana, India',
        plantingDate: '2024-06-01',
        expectedHarvest: '2024-10-15',
        status: 'harvested',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        price: 40,
        farmerId: '1',
    },
    {
        id: '3',
        name: 'Tomatoes',
        variety: 'Cherry',
        quantity: 1500,
        unit: 'kg',
        location: 'Maharashtra, India',
        plantingDate: '2025-01-10',
        expectedHarvest: '2025-04-05',
        status: 'growing',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
        price: 30,
        farmerId: '1',
    },
];
export const mockOrders = [
    {
        id: '1',
        cropId: '1',
        cropName: 'Wheat',
        buyerId: '2',
        buyerName: 'Fresh Foods Ltd',
        quantity: 1000,
        totalPrice: 25000,
        status: 'pending',
        orderDate: '2025-03-10',
        deliveryDate: '2025-03-25',
    },
    {
        id: '2',
        cropId: '2',
        cropName: 'Rice',
        buyerId: '3',
        buyerName: 'Global Grains',
        quantity: 2000,
        totalPrice: 80000,
        status: 'confirmed',
        orderDate: '2025-03-08',
        deliveryDate: '2025-03-20',
    },
    {
        id: '3',
        cropId: '3',
        cropName: 'Tomatoes',
        buyerId: '2',
        buyerName: 'Fresh Foods Ltd',
        quantity: 500,
        totalPrice: 15000,
        status: 'shipped',
        orderDate: '2025-03-05',
        deliveryDate: '2025-03-15',
    },
];
export const mockShipments = [
    {
        id: '1',
        orderId: '3',
        trackingId: 'TRK001234567',
        status: 'in_transit',
        currentLocation: 'Mumbai Hub',
        estimatedDelivery: '2025-03-15',
        updates: [
            { timestamp: '2025-03-10 10:00', location: 'Origin Warehouse', status: 'Picked up' },
            { timestamp: '2025-03-11 14:30', location: 'Regional Hub', status: 'In transit' },
            { timestamp: '2025-03-12 09:15', location: 'Mumbai Hub', status: 'Out for delivery' },
        ],
    },
];
export const mockWeather = {
    current: {
        temperature: 28,
        condition: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12,
        rainfall: 0,
        location: 'Punjab, India',
        icon: 'partly-cloudy',
    },
    forecast: [
        { day: 'Today', temp: 28, condition: 'Partly Cloudy', icon: 'partly-cloudy', rainfall: 0 },
        { day: 'Tomorrow', temp: 30, condition: 'Sunny', icon: 'sunny', rainfall: 0 },
        { day: 'Wednesday', temp: 27, condition: 'Rainy', icon: 'rainy', rainfall: 15 },
        { day: 'Thursday', temp: 26, condition: 'Cloudy', icon: 'cloudy', rainfall: 5 },
        { day: 'Friday', temp: 29, condition: 'Sunny', icon: 'sunny', rainfall: 0 },
    ],
};
export const mockPrices = [
    { id: '1', product: 'Wheat', currentPrice: 25, change: +2.5, trend: 'up', unit: 'kg' },
    { id: '2', product: 'Rice', currentPrice: 40, change: -1.2, trend: 'down', unit: 'kg' },
    { id: '3', product: 'Tomatoes', currentPrice: 30, change: +5.8, trend: 'up', unit: 'kg' },
    { id: '4', product: 'Potatoes', currentPrice: 20, change: +1.5, trend: 'up', unit: 'kg' },
    { id: '5', product: 'Onions', currentPrice: 35, change: -3.2, trend: 'down', unit: 'kg' },
];
export const mockPriceTrends = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
        {
            label: 'Wheat',
            data: [22, 23, 24, 23, 24, 25],
            color: '#16a34a',
        },
        {
            label: 'Rice',
            data: [38, 39, 41, 40, 41, 40],
            color: '#84cc16',
        },
        {
            label: 'Tomatoes',
            data: [25, 28, 27, 29, 28, 30],
            color: '#f59e0b',
        },
    ],
};
export const mockDiseaseResult = {
    disease: 'Late Blight',
    confidence: 87.5,
    severity: 'moderate',
    description: 'Late blight is caused by the oomycete Phytophthora infestans. It affects leaves, stems, and tubers.',
    treatment: [
        'Remove and destroy infected plant parts',
        'Apply fungicide spray (Mancozeb or Chlorothalonil)',
        'Improve air circulation around plants',
        'Avoid overhead watering',
    ],
    prevention: [
        'Use disease-resistant varieties',
        'Rotate crops annually',
        'Maintain proper spacing between plants',
        'Apply preventive fungicides during humid conditions',
    ],
};
export const mockChatHistory = [
    {
        id: '1',
        role: 'user',
        message: 'What is the best time to plant wheat?',
        timestamp: '2025-03-19 10:30',
    },
    {
        id: '2',
        role: 'assistant',
        message: 'The best time to plant wheat depends on your region and the type of wheat. For winter wheat, planting is typically done in fall (October-November). For spring wheat, plant in early spring (March-April) when soil temperature reaches 40-45°F. In India, wheat is generally sown in October-November for harvesting in March-April.',
        timestamp: '2025-03-19 10:31',
    },
];
export const mockDashboardStats = {
    farmer: {
        totalCrops: 12,
        activeCrops: 8,
        totalOrders: 24,
        revenue: 450000,
        revenueChange: +12.5,
    },
    buyer: {
        totalOrders: 18,
        activeOrders: 5,
        totalSpent: 320000,
        savedAmount: 45000,
    },
};
