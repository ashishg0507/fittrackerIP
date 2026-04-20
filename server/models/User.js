const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
{
	username: { type: String, required: true, unique: true, minlength: 3, maxlength: 50, trim: true },
	email: { type: String, required: true, unique: true, lowercase: true, trim: true },
	passwordHash: { type: String, required: true },

	// Profile fields
	firstName: { type: String, trim: true, default: '' },
	lastName: { type: String, trim: true, default: '' },
	phone: { type: String, trim: true, default: '' },
	dateOfBirth: { type: String, trim: true, default: '' }, 
	gender: { type: String, trim: true, enum: ['male', 'female', 'other', ''], default: '' },
	bio: { type: String, trim: true, default: '' },
	avatarUrl: { type: String, trim: true, default: '' },

	// Measurements
	height: { type: Number, default: 0 },
	currentWeight: { type: Number, default: 0 },
	targetWeight: { type: Number, default: 0 },
	bodyFat: { type: Number, default: 0 },

	// Goals & preferences
	goals: { type: [String], default: [] },
	activityLevel: { type: String, trim: true, default: '' },
	fitnessLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', ''], default: '' },
	primaryWorkoutGoal: { type: String, enum: ['weight-loss', 'muscle-gain', 'strength', 'endurance', 'flexibility', 'general-fitness', ''], default: '' },
	workoutDuration: { type: Number, default: 0 },
	workoutFrequency: { type: Number, default: 0 },
	preferredTime: { type: String, trim: true, default: '' },
	cardio: { type: [String], default: [] },
	strength: { type: [String], default: [] },
	flexibility: { type: [String], default: [] },
	notifications: {
		workoutReminders: { type: Boolean, default: false },
		goalProgress: { type: Boolean, default: false },
		motivational: { type: Boolean, default: false },
		socialUpdates: { type: Boolean, default: false }
	},

	// Diet & Nutrition
	nutritionGoals: {
		targetCalories: { type: Number, default: 0 },
		targetProtein: { type: Number, default: 0 },
		targetCarbs: { type: Number, default: 0 },
		targetFats: { type: Number, default: 0 }
	},
	dietaryPreferences: {
		dietaryType: { type: String, default: 'vegetarian', enum: ['vegetarian', 'vegan', 'non-vegetarian', 'eggetarian'] },
		avoidBeef: { type: Boolean, default: false },
		avoidPork: { type: Boolean, default: false },
		avoidSeafood: { type: Boolean, default: false },
		avoidDairy: { type: Boolean, default: false },
		allergies: { type: [String], default: [] }, // 'nuts', 'gluten', 'soy', etc.
		religiousRestrictions: { type: String, enum: ['none', 'halal', 'kosher', 'jain'], default: 'none' }
	},
	currentDietPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'DietPlan', default: null },
	currentWorkoutPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan', default: null },

	// Subscription & Payment
	subscription: {
		plan: { type: String, enum: ['free', 'basic', 'pro', 'premium', ''], default: 'free' },
		billingCycle: { type: String, enum: ['monthly', 'yearly', ''], default: '' },
		status: { type: String, enum: ['inactive', 'active', 'expired', 'cancelled', ''], default: 'inactive' },
		startDate: { type: Date },
		endDate: { type: Date },
		razorpayOrderId: { type: String, default: '' },
		razorpayPaymentId: { type: String, default: '' },
		razorpaySignature: { type: String, default: '' }
	}
},
{ timestamps: true }
);

userSchema.methods.hasActivePaidSubscription = function hasActivePaidSubscription() {
	if (!this.subscription) return false;
	if (this.subscription.status !== 'active') return false;
	if (!['basic', 'pro', 'premium'].includes(this.subscription.plan)) return false;
	if (this.subscription.endDate && new Date(this.subscription.endDate) < new Date()) return false;
	return true;
};

userSchema.methods.canAccessGenerationFeatures = function canAccessGenerationFeatures() {
	// Keep one internal account always premium-enabled.
	if (this.username === 'user') return true;
	return this.hasActivePaidSubscription();
};

module.exports = mongoose.model('User', userSchema);


