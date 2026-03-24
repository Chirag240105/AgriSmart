import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { cropService } from '../services/api';
export const CropsPage = () => {
    const { user } = useAuth();
    const [crops, setCrops] = useState([]);
    const [filteredCrops, setFilteredCrops] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingCrop, setEditingCrop] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        variety: '',
        quantity: '',
        unit: 'kg',
        pricePerUnit: '',
        quality: 'Standard',
        harvestDate: '',
        locationLat: '',
        locationLng: '',
    });
    useEffect(() => {
        const fetchCrops = async () => {
            try {
                const response = await cropService.getAllCrops();
                const mapped = (response.data?.data || []).map((crop) => {
                    const coordinates = crop?.location?.coordinates;
                    const lng = Array.isArray(coordinates) ? coordinates[0] : undefined;
                    const lat = Array.isArray(coordinates) ? coordinates[1] : undefined;
                    return {
                        id: crop._id,
                        name: crop.cropName,
                        variety: crop.variety || 'Unknown',
                        quantity: crop.quantity,
                        unit: crop.unit || 'kg',
                        pricePerUnit: crop.pricePerUnit || 0,
                        quality: crop.quality,
                        harvestDate: crop.harvestDate,
                        status: crop.status || 'available',
                        image: crop.images?.[0],
                        location: typeof lat === 'number' && typeof lng === 'number'
                            ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                            : 'Unknown',
                        locationLat: typeof lat === 'number' ? lat : undefined,
                        locationLng: typeof lng === 'number' ? lng : undefined,
                    };
                });
                setCrops(mapped);
            }
            catch (error) {
                toast.error(error?.response?.data?.message || 'Failed to load crops');
            }
        };
        fetchCrops();
    }, []);
    useEffect(() => {
        let filtered = crops;
        if (searchQuery) {
            filtered = filtered.filter((crop) => crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                crop.variety.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (statusFilter !== 'all') {
            filtered = filtered.filter((crop) => crop.status === statusFilter);
        }
        setFilteredCrops(filtered);
    }, [searchQuery, statusFilter, crops]);
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            cropName: formData.name,
            variety: formData.variety,
            quantity: Number(formData.quantity),
            unit: formData.unit,
            pricePerUnit: Number(formData.pricePerUnit),
            quality: formData.quality,
            harvestDate: formData.harvestDate ? new Date(formData.harvestDate).toISOString() : undefined,
        };
        const lat = Number(formData.locationLat);
        const lng = Number(formData.locationLng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            payload.location = { lat, lng };
        }
        if (editingCrop) {
            try {
                const response = await cropService.updateCrop(editingCrop.id, payload);
                const updated = response.data?.data;
                setCrops((prev) => prev.map((crop) => crop.id === editingCrop.id
                    ? {
                        ...crop,
                        name: updated.cropName,
                        variety: updated.variety || crop.variety,
                        quantity: updated.quantity,
                        unit: updated.unit || crop.unit,
                        pricePerUnit: updated.pricePerUnit || crop.pricePerUnit,
                        quality: updated.quality || crop.quality,
                        harvestDate: updated.harvestDate || crop.harvestDate,
                        status: updated.status || crop.status,
                    }
                    : crop));
                toast.success('Crop updated successfully!');
                setEditingCrop(null);
            }
            catch (error) {
                toast.error(error?.response?.data?.message || 'Failed to update crop');
            }
        }
        else {
            try {
                const response = await cropService.createCrop(payload);
                const created = response.data?.data;
                const coordinates = created?.location?.coordinates;
                const createdCrop = {
                    id: created._id,
                    name: created.cropName,
                    variety: created.variety || 'Unknown',
                    quantity: created.quantity,
                    unit: created.unit || 'kg',
                    pricePerUnit: created.pricePerUnit || 0,
                    quality: created.quality,
                    harvestDate: created.harvestDate,
                    status: created.status || 'available',
                    image: created.images?.[0],
                    location: Array.isArray(coordinates) && coordinates.length === 2
                        ? `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`
                        : 'Unknown',
                    locationLat: Array.isArray(coordinates) ? coordinates[1] : undefined,
                    locationLng: Array.isArray(coordinates) ? coordinates[0] : undefined,
                };
                setCrops([createdCrop, ...crops]);
                toast.success('Crop added successfully!');
            }
            catch (error) {
                toast.error(error?.response?.data?.message || 'Failed to add crop');
            }
        }
        setFormData({
            name: '',
            variety: '',
            quantity: '',
            unit: 'kg',
            pricePerUnit: '',
            quality: 'Standard',
            harvestDate: '',
            locationLat: '',
            locationLng: '',
        });
        setIsAddDialogOpen(false);
    };
    const handleEdit = (crop) => {
        setEditingCrop(crop);
        setFormData({
            name: crop.name,
            variety: crop.variety,
            quantity: crop.quantity.toString(),
            unit: crop.unit,
            pricePerUnit: crop.pricePerUnit.toString(),
            quality: crop.quality || 'Standard',
            harvestDate: crop.harvestDate ? new Date(crop.harvestDate).toISOString().slice(0, 10) : '',
            locationLat: crop.locationLat?.toString() || '',
            locationLng: crop.locationLng?.toString() || '',
        });
        setIsAddDialogOpen(true);
    };
    const handleDelete = async (id) => {
        try {
            await cropService.deleteCrop(id);
            setCrops(crops.filter((crop) => crop.id !== id));
            toast.success('Crop deleted successfully!');
        }
        catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete crop');
        }
    };
    const resetForm = () => {
        setEditingCrop(null);
        setFormData({
            name: '',
            variety: '',
            quantity: '',
            unit: 'kg',
            pricePerUnit: '',
            quality: 'Standard',
            harvestDate: '',
            locationLat: '',
            locationLng: '',
        });
    };
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Crop Management</h1>
          <p className="text-muted-foreground">Manage your crops and inventory</p>
        </div>
        {user?.role === 'farmer' && (<Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open)
                    resetForm();
            }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4"/>
                Add Crop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCrop ? 'Edit Crop' : 'Add New Crop'}</DialogTitle>
                <DialogDescription>
                  {editingCrop ? 'Update the crop details below' : 'Fill in the details to add a new crop'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Crop Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Wheat" required/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variety">Variety</Label>
                    <Input id="variety" name="variety" value={formData.variety} onChange={handleInputChange} placeholder="e.g., Basmati" required/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} placeholder="e.g., 5000" required/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="ton">Tons</SelectItem>
                        <SelectItem value="quintal">Quintals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerUnit">Price per {formData.unit}</Label>
                    <Input id="pricePerUnit" name="pricePerUnit" type="number" value={formData.pricePerUnit} onChange={handleInputChange} placeholder="e.g., 25" required/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quality">Quality</Label>
                    <Select value={formData.quality} onValueChange={(value) => setFormData({ ...formData, quality: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Organic">Organic</SelectItem>
                        <SelectItem value="Grade A">Grade A</SelectItem>
                        <SelectItem value="Grade B">Grade B</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="harvestDate">Harvest Date</Label>
                    <Input id="harvestDate" name="harvestDate" type="date" value={formData.harvestDate} onChange={handleInputChange}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locationLat">Latitude</Label>
                    <Input id="locationLat" name="locationLat" type="number" value={formData.locationLat} onChange={handleInputChange} placeholder="e.g., 30.7333"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locationLng">Longitude</Label>
                    <Input id="locationLng" name="locationLng" type="number" value={formData.locationLng} onChange={handleInputChange} placeholder="e.g., 76.7794"/>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
            }}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingCrop ? 'Update Crop' : 'Add Crop'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>)}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground"/>
              <Input placeholder="Search crops..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2"/>
                <SelectValue placeholder="Filter by status"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredCrops.length === 0 ? (<Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No crops found</p>
          </CardContent>
        </Card>) : (<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop, index) => (<motion.div key={crop.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="overflow-hidden hover:shadow-lg transition-all">
                <img src={crop.image || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400'} alt={crop.name} className="w-full h-48 object-cover"/>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{crop.name}</CardTitle>
                      <CardDescription>{crop.variety}</CardDescription>
                    </div>
                    <Badge variant={crop.status === 'available'
                    ? 'default'
                    : crop.status === 'sold'
                        ? 'secondary'
                        : 'outline'}>
                      {crop.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium">{crop.quantity} {crop.unit}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-medium">INR {crop.pricePerUnit}/{crop.unit}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium">{crop.location}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Harvest</p>
                      <p className="font-medium">
                        {crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {user?.role === 'farmer' && (<div className="flex gap-2 pt-3 border-t">
                      <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => handleEdit(crop)}>
                        <Edit className="w-4 h-4"/>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1 gap-2" onClick={() => handleDelete(crop.id)}>
                        <Trash2 className="w-4 h-4"/>
                        Delete
                      </Button>
                    </div>)}

                  {user?.role === 'buyer' && (<Button className="w-full">Place Order</Button>)}
                </CardContent>
              </Card>
            </motion.div>))}
        </div>)}
    </div>);
};
