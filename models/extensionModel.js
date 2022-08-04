import {Schema, model, models} from 'mongoose';

const ExtensionModel = new Schema({
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    },
    category: {
        type: String,
        enum: ['blog', 'shopping', 'dev', 'sc', 'prod', 'search', 'pe', 'nw', 'entertainment', 'photo', 'accessibility', 'bookmark', 'tab', 'theme', 'ps', 'other'],
        required: true
    },
    recommend: {
        type: Boolean,
        default: false
    },
    isSafe: {
        type: String,
        enum: ['safe', 'unsafe', 'unknown'],
        required: true
    },
    description: {
        type: String
    },
    browser: {
        type: String,
        enum: ['Chrome', 'Edge', 'Firefox', 'Safari'],
        required: true,
        default: 'Chrome'
    },
    note: {
        type: String,
        required: false
    },
    tutorial: {
        type: [String]
    }
}, {
    timestamps: true
});

const Extension = models.Extension || model('Extension', ExtensionModel);

export default Extension;