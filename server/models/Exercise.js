const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: { 
        type: String, 
        required: true, 
        enum: ['cardio', 'strength', 'flexibility', 'hiit', 'yoga', 'pilates', 'sports', 'other'], 
        trim: true 
    },
    muscleGroups: { type: [String], default: [] }, // e.g., 'chest', 'back', 'legs', 'arms', 'core', 'full-body'
    equipment: { 
        type: String, 
        enum: ['bodyweight', 'dumbbells', 'barbell', 'kettlebells', 'resistance-bands', 'machine', 'cable', 'none', 'other'], 
        default: 'bodyweight' 
    },
    difficulty: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced'], 
        default: 'beginner' 
    },
    duration: { type: Number, default: 0 }, // minutes
    caloriesBurned: { type: Number, default: 0 }, // per minute (approximate)
    instructions: { type: [String], default: [] }, // step-by-step instructions
    tips: { type: [String], default: [] }, // form tips and safety notes
    imageUrl: { type: String, trim: true, default: '' },
    videoUrl: { type: String, trim: true, default: '' },
    tags: { type: [String], default: [] }, // e.g., 'home-friendly', 'gym-required', 'low-impact', 'high-intensity'
    sets: { type: Number, default: 0 }, // default sets (0 means variable)
    reps: { type: String, default: '' }, // default reps (e.g., "8-12", "15-20", "30 seconds")
    restTime: { type: Number, default: 60 }, // seconds between sets
    targetGoal: { type: [String], default: [] }, // e.g., 'weight-loss', 'muscle-gain', 'strength', 'endurance', 'flexibility'
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes for efficient querying
exerciseSchema.index({ category: 1 });
exerciseSchema.index({ difficulty: 1 });
exerciseSchema.index({ muscleGroups: 1 });
exerciseSchema.index({ equipment: 1 });
exerciseSchema.index({ targetGoal: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);

