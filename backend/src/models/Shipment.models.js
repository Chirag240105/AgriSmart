import mongoose from "mongoose";

const shipmentSchema = new mongoose.Schema({
    farmerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    buyerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cropId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop', 
    },
    cropName:String,
    quantity:{
        type: Number,
        required: true
    },
    agreedPrice: {
        type: Number,
        required: true
    },
    destination:{
        address: String,
        location: {
            type:{
                type: String,
                enum : ["Point"],
                default: "Point"
            },
            coordinates: [Number]
        }
    },
    status:{
        type: String,
        enum:["created", "picked_up", "in_transit", "delivered", "delayed", "canceled"],
        default : "created",
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    truckId: String,
    currentLocation:{
        type:{
        type: String,
        enum: ["Point"],
        default: "Point"
    },
    coordinates: {
        type:[Number],
        index:"2dsphere"
    },
},
locationHistory:[
 {
       timestamps: Date,
    coordinates: [Number]
}
],
eta: Date,
  currentTemperature: Number,

  temperatureHistory: [
    {
      timestamp: Date,
      value: Number
    }
  ],


  riskScore: {
    type: Number,
    min: 0,
    max: 100
  },

  // Reserved fields for future AI/model integrations.
  aiInsights: {
    routeRiskScore: Number,
    etaConfidence: Number,
    anomalyFlags: [String],
    modelVersion: String,
    lastEvaluatedAt: Date
  },

  integrationRefs: {
    pathwayStreamId: String
  },

  alerts: [
    {
      type: String,
      severity: {
        type: String,
        enum: ["warning", "critical"]
      },
      message: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]


}, {timestamps: true})

shipmentSchema.pre('save', function() {
    if(this.locationHistory.length > 100){
        this.locationHistory.shift()
    }
    if(this.temperatureHistory.length > 100){
        this.temperatureHistory.shift()
    }
})
export const Shipment = mongoose.model('Shipment' , shipmentSchema)
