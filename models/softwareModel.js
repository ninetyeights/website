import { Schema, model, models } from 'mongoose'
import { PLATFORM, SOFTWARE_CATEGORIES } from '../constants/static'

const SoftwareModel = new Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  urls: [
    {
      officialUrl: String,
      downloadUrl: String,
      platform: {
        type: String,
        enum: PLATFORM,
        required: true,
      }
    },
  ],
  category: {
    type: String,
    enum: Object.keys(SOFTWARE_CATEGORIES),
    required: true
  },
  recommend: {
    type: Boolean,
    default: false,
  },
  isSafe: {
    type: String,
    enum: ['safe', 'unsafe', 'unknown'],
    required: true,
  },
  description: {
    type: String,
  }
}, {
  timestamps: true
});

const Software = models.Software || model('Software', SoftwareModel);

export default Software;