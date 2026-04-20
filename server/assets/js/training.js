// Training Page JavaScript Functionality
let canGenerateWorkoutPlan = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeTrainingFeatureAccess();

    // Initialize the workout generator
    initializeWorkoutGenerator();
    
    // Load user profile data
    loadUserProfileData();
    
    // Initialize exercise library
    initializeExerciseLibrary();
    
    // Load current workout plan if exists
    loadCurrentWorkoutPlan();
});

async function initializeTrainingFeatureAccess() {
    const generateBtn = document.getElementById('generate-workout-btn');
    try {
        const response = await fetch('/api/payment/subscription');
        const data = await response.json();
        canGenerateWorkoutPlan = !!(data && data.features && data.features.canGenerateWorkoutPlan);
    } catch (err) {
        console.error('Failed to load subscription features:', err);
        canGenerateWorkoutPlan = false;
    }

    if (generateBtn && !canGenerateWorkoutPlan) {
        generateBtn.innerHTML = '<i class="fas fa-lock"></i> Upgrade To Generate Workout Plan';
    }
}

// Workout Generator Functionality
function initializeWorkoutGenerator() {
    const generateBtn = document.getElementById('generate-workout-btn');
    
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            if (validateWorkoutForm()) {
                generateWorkoutPlan();
            }
        });
    }
}

// Form Validation
function validateWorkoutForm() {
    const fitnessLevel = document.getElementById('fitness-level').value;
    const workoutGoal = document.getElementById('workout-goal').value;
    const duration = document.getElementById('plan-duration').value;
    const workoutsPerWeek = document.getElementById('workouts-per-week').value;
    
    if (!fitnessLevel || !workoutGoal || !duration || !workoutsPerWeek) {
        alert('Please fill in all fields');
        return false;
    }
    
    return true;
}

// Generate Workout Plan
async function generateWorkoutPlan() {
    if (!canGenerateWorkoutPlan) {
        alert('Workout plan generation requires an active subscription. Please upgrade your plan.');
        window.location.href = '/pricing';
        return;
    }

    const formData = {
        fitnessLevel: document.getElementById('fitness-level').value,
        primaryGoal: document.getElementById('workout-goal').value,
        duration: parseInt(document.getElementById('plan-duration').value),
        workoutsPerWeek: parseInt(document.getElementById('workouts-per-week').value)
    };
    
    // Show loading state
    const generateBtn = document.getElementById('generate-workout-btn');
    const originalText = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Plan...';
    
    try {
        const response = await fetch('/api/training/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.ok && data.workoutPlan) {
            // Invalidate cache after generating new plan
            invalidateCache('workoutPlan');
            displayWorkoutPlan(data.workoutPlan);
            document.getElementById('workout-plan-display').style.display = 'block';
            document.getElementById('workout-plan-display').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            if (response.status === 403) {
                alert(data.message || 'Workout plan generation requires an active subscription.');
                window.location.href = '/pricing';
                return;
            }
            alert(data.message || 'Failed to generate workout plan');
        }
    } catch (err) {
        console.error('Error generating workout plan:', err);
        alert('An error occurred while generating your workout plan');
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalText;
    }
}

// Display Workout Plan
function displayWorkoutPlan(workoutPlan) {
    const displaySection = document.getElementById('workout-plan-display');
    const weeklyWorkouts = document.getElementById('weekly-workouts');
    const statsDiv = document.getElementById('workout-plan-stats');
    const calendarContainer = document.getElementById('workout-calendar');
    
    // Display stats
    const totalWorkouts = workoutPlan.dailyWorkouts.filter(w => w.workoutType !== 'rest').length;
    const totalCalories = workoutPlan.dailyWorkouts.reduce((sum, w) => sum + (w.estimatedCalories || 0), 0);
    const avgDuration = Math.round(workoutPlan.dailyWorkouts.reduce((sum, w) => sum + (w.totalDuration || 0), 0) / workoutPlan.dailyWorkouts.length);
    
    statsDiv.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
            <div class="stat-value">${totalWorkouts}</div>
            <div class="stat-label">Workouts</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-fire"></i></div>
            <div class="stat-value">${totalCalories}</div>
            <div class="stat-label">Total Calories</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-clock"></i></div>
            <div class="stat-value">${avgDuration} min</div>
            <div class="stat-label">Avg Duration</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-trophy"></i></div>
            <div class="stat-value">${workoutPlan.progress?.currentStreak || 0}</div>
            <div class="stat-label">Day Streak</div>
        </div>
    `;

    // Render calendar overview (if container exists)
    if (calendarContainer) {
        renderWorkoutCalendar(workoutPlan, calendarContainer);
    }
    
    // Create tabs container
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs-list';
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'tabs-content';
    
    // Generate tabs and content for each day
    workoutPlan.dailyWorkouts.forEach((dailyWorkout, index) => {
        const date = new Date(dailyWorkout.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayNum = date.getDate();
        
        // Create tab button
        const tabButton = document.createElement('div');
        tabButton.className = `tab-button ${index === 0 ? 'active' : ''} ${dailyWorkout.completed ? 'completed' : ''}`;
        tabButton.dataset.day = index;
        tabButton.innerHTML = `
            <div class="tab-day">${dayName}</div>
            <div class="tab-date">${dayNum}</div>
            ${dailyWorkout.completed ? '<i class="fas fa-check-circle" style="margin-top: 0.25rem; color: #27ae60;"></i>' : ''}
        `;
        tabsContainer.appendChild(tabButton);
        
        // Create tab panel
        const tabPanel = document.createElement('div');
        tabPanel.className = `tab-panel ${index === 0 ? 'active' : ''}`;
        tabPanel.dataset.day = index;
        
        if (dailyWorkout.workoutType === 'rest') {
            tabPanel.innerHTML = `
                <div class="tab-panel-header">
                    <h3>${date.toLocaleDateString('en-US', { weekday: 'long' })} - Rest Day</h3>
                    <p>${dateStr}</p>
                </div>
                <div class="rest-day-content">
                    <i class="fas fa-bed"></i>
                    <h3>Rest Day</h3>
                    <p>Take a well-deserved rest. Recovery is essential for progress!</p>
                </div>
            `;
        } else {
            const exercisesList = dailyWorkout.exercises.map(ex => {
                const exercise = ex.exercise;
                if (!exercise) return '';
                
                return `
                    <div class="exercise-item">
                        <div class="exercise-info">
                            <h4>${exercise.name}</h4>
                            <p class="exercise-meta">${exercise.muscleGroups?.join(', ') || 'Full Body'}</p>
                        </div>
                        <div class="exercise-details">
                            ${ex.sets ? `<span class="detail-badge"><i class="fas fa-redo"></i> ${ex.sets} sets</span>` : ''}
                            ${ex.reps ? `<span class="detail-badge"><i class="fas fa-hashtag"></i> ${ex.reps} reps</span>` : ''}
                            ${ex.duration ? `<span class="detail-badge"><i class="fas fa-clock"></i> ${ex.duration} min</span>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            
            tabPanel.innerHTML = `
                <div class="tab-panel-header">
                    <h3>${date.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
                    <p>${dateStr}</p>
                </div>
                <div class="workout-day-summary">
                    <div class="summary-badge ${dailyWorkout.workoutType}">
                        <span class="workout-type-badge ${dailyWorkout.workoutType}">${dailyWorkout.workoutType.charAt(0).toUpperCase() + dailyWorkout.workoutType.slice(1)}</span>
                    </div>
                    <div class="workout-stats">
                        <span><i class="fas fa-clock"></i> ${dailyWorkout.totalDuration} min</span>
                        <span><i class="fas fa-fire"></i> ${dailyWorkout.estimatedCalories} cal</span>
                        <span><i class="fas fa-dumbbell"></i> ${dailyWorkout.exercises.length} exercises</span>
                    </div>
                </div>
                <div class="exercises-list">
                    ${exercisesList}
                </div>
                <div class="workout-actions">
                    ${!dailyWorkout.completed ? `
                        <button class="btn btn-primary btn-full" onclick="completeWorkout('${workoutPlan._id}', ${index})">
                            <i class="fas fa-check"></i> Mark as Completed
                        </button>
                    ` : `
                        <div class="completed-badge"><i class="fas fa-check-circle"></i> Completed</div>
                    `}
                </div>
            `;
        }
        
        contentContainer.appendChild(tabPanel);
    });
    
    // Clear and add tabs and content
    weeklyWorkouts.innerHTML = '';
    weeklyWorkouts.appendChild(tabsContainer);
    weeklyWorkouts.appendChild(contentContainer);
    
    // Add tab switching functionality
    const tabButtons = tabsContainer.querySelectorAll('.tab-button');
    const tabPanels = contentContainer.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const dayIndex = parseInt(button.dataset.day);
            
            // Remove active class from all
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to selected
            button.classList.add('active');
            tabPanels[dayIndex].classList.add('active');
        });
    });
}

// Render a simple month-style calendar for the workout plan
function renderWorkoutCalendar(workoutPlan, container) {
    container.innerHTML = '';

    const start = new Date(workoutPlan.startDate);
    const end = new Date(workoutPlan.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return;
    }

    const header = document.createElement('div');
    header.className = 'workout-calendar-header';
    const monthLabel = start.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });
    header.innerHTML = `<div class="workout-calendar-title"><i class="fas fa-calendar-alt"></i> Schedule (${monthLabel})</div>`;
    container.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'workout-calendar-grid';

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach((d) => {
        const el = document.createElement('div');
        el.className = 'workout-calendar-day-name';
        el.textContent = d;
        grid.appendChild(el);
    });

    // Map YYYY-MM-DD -> { index, workout }
    const dayMap = new Map();
    workoutPlan.dailyWorkouts.forEach((dw, index) => {
        dayMap.set(dw.date, { index, workout: dw });
    });

    const firstOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const firstWeekday = firstOfMonth.getDay();

    const cellCount = 42; // 6 weeks * 7 days
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < cellCount; i++) {
        const cell = document.createElement('div');
        cell.className = 'workout-calendar-cell';

        const cellDate = new Date(firstOfMonth);
        cellDate.setDate(firstOfMonth.getDate() + (i - firstWeekday));
        const iso = cellDate.toISOString().split('T')[0];

        const dateEl = document.createElement('div');
        dateEl.className = 'workout-calendar-date';
        dateEl.textContent = cellDate.getDate();
        cell.appendChild(dateEl);

        const meta = dayMap.get(iso);
        const inRange = cellDate >= start && cellDate <= end;

        if (!inRange) {
            cell.classList.add('outside-range');
        } else if (meta) {
            const { workout, index } = meta;
            if (workout.workoutType !== 'rest') {
                cell.classList.add('has-workout');
                const typeEl = document.createElement('div');
                typeEl.className = 'workout-calendar-type';
                typeEl.textContent = workout.workoutType;
                cell.appendChild(typeEl);
            }
            if (workout.completed) {
                cell.classList.add('completed');
            }
            cell.dataset.dayIndex = index;
        }

        if (iso === todayStr) {
            cell.classList.add('today');
        }

        if (inRange && dayMap.has(iso)) {
            cell.addEventListener('click', () => {
                const idx = parseInt(cell.dataset.dayIndex, 10);
                const tabsRoot = document.querySelector('#weekly-workouts .tabs-list');
                const panelsRoot = document.querySelector('#weekly-workouts .tabs-content');
                if (!tabsRoot || !panelsRoot) return;

                const tabButtons = tabsRoot.querySelectorAll('.tab-button');
                const tabPanels = panelsRoot.querySelectorAll('.tab-panel');

                tabButtons.forEach((btn) => btn.classList.remove('active'));
                tabPanels.forEach((panel) => panel.classList.remove('active'));

                if (tabButtons[idx]) tabButtons[idx].classList.add('active');
                if (tabPanels[idx]) tabPanels[idx].classList.add('active');
            });
        }

        grid.appendChild(cell);
    }

    container.appendChild(grid);
}

// Complete Workout
async function completeWorkout(workoutPlanId, dayIndex) {
    try {
        const response = await fetch('/api/training/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workoutPlanId, dayIndex })
        });
        
        const data = await response.json();
        
        if (data.ok && data.workoutPlan) {
            // Invalidate cache after completing workout
            invalidateCache('workoutPlan');
            displayWorkoutPlan(data.workoutPlan);
            alert('Workout marked as completed! Great job! 🎉');
        } else {
            alert(data.message || 'Failed to mark workout as completed');
        }
    } catch (err) {
        console.error('Error completing workout:', err);
        alert('An error occurred while marking workout as completed');
    }
}

// Load Current Workout Plan
async function loadCurrentWorkoutPlan() {
    try {
        const response = await cachedFetch('/api/training/current', {}, 'workoutPlan', CACHE_TTL.workoutPlan);
        const data = await response.json();
        
        if (data.ok && data.workoutPlan) {
            displayWorkoutPlan(data.workoutPlan);
            document.getElementById('workout-plan-display').style.display = 'block';
        }
    } catch (err) {
        console.error('Error loading current workout plan:', err);
    }
}

// Load User Profile Data
async function loadUserProfileData() {
    try {
        // Try to get profile data from the main profile API first
        const profileResponse = await cachedFetch('/api/profile', {}, 'profile', CACHE_TTL.profile);
        const profileData = await profileResponse.json();
        
        if (profileData.ok && profileData.user) {
            const user = profileData.user;
            
            // Pre-fill fitness level - use explicit fitnessLevel if set, otherwise derive from activityLevel
            if (user.fitnessLevel) {
                document.getElementById('fitness-level').value = user.fitnessLevel;
            } else if (user.activityLevel) {
                // Map activity level to fitness level as fallback
                const levelMap = {
                    'sedentary': 'beginner',
                    'light': 'beginner',
                    'moderate': 'intermediate',
                    'active': 'advanced',
                    'very-active': 'advanced'
                };
                const fitnessLevel = levelMap[user.activityLevel] || 'beginner';
                document.getElementById('fitness-level').value = fitnessLevel;
            }
            
            // Pre-fill primary workout goal - use explicit primaryWorkoutGoal if set, otherwise derive from goals
            if (user.primaryWorkoutGoal) {
                document.getElementById('workout-goal').value = user.primaryWorkoutGoal;
            } else if (user.goals && user.goals.length > 0) {
                // Map user goals to workout goals
                const goalMap = {
                    'build-muscle': 'muscle-gain',
                    'lose-weight': 'weight-loss',
                    'improve-strength': 'strength',
                    'improve-endurance': 'endurance',
                    'increase-flexibility': 'flexibility',
                    'general-fitness': 'general-fitness'
                };
                // Try to find matching goal
                let workoutGoal = 'general-fitness';
                for (const goal of user.goals) {
                    if (goalMap[goal]) {
                        workoutGoal = goalMap[goal];
                        break;
                    }
                }
                document.getElementById('workout-goal').value = workoutGoal;
            }
            
            // Pre-fill workouts per week
            if (user.workoutFrequency && user.workoutFrequency > 0) {
                document.getElementById('workouts-per-week').value = user.workoutFrequency;
            }
        }
        
        // Also try the training profile API as fallback
        const trainingResponse = await cachedFetch('/api/training/profile', {}, 'trainingProfile', CACHE_TTL.trainingProfile);
        const trainingData = await trainingResponse.json();
        
        if (trainingData.ok && trainingData.profileData) {
            const profile = trainingData.profileData;
            
            // Only fill if not already filled from main profile
            if (!document.getElementById('fitness-level').value && profile.activityLevel) {
                const levelMap = {
                    'sedentary': 'beginner',
                    'light': 'beginner',
                    'moderate': 'intermediate',
                    'active': 'advanced',
                    'very-active': 'advanced'
                };
                const fitnessLevel = levelMap[profile.activityLevel] || 'beginner';
                document.getElementById('fitness-level').value = fitnessLevel;
            }
            
            if (!document.getElementById('workout-goal').value && profile.goals && profile.goals.length > 0) {
                const goalMap = {
                    'build-muscle': 'muscle-gain',
                    'lose-weight': 'weight-loss',
                    'improve-strength': 'strength',
                    'improve-endurance': 'endurance',
                    'increase-flexibility': 'flexibility'
                };
                const workoutGoal = goalMap[profile.goals[0]] || 'general-fitness';
                document.getElementById('workout-goal').value = workoutGoal;
            }
            
            if (!document.getElementById('workouts-per-week').value && profile.workoutFrequency) {
                document.getElementById('workouts-per-week').value = profile.workoutFrequency;
            }
        }
    } catch (err) {
        console.error('Error loading user profile:', err);
    }
}

// Initialize Exercise Library
function initializeExerciseLibrary() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadExercises(this.dataset.category);
        });
    });
    
    // Load all exercises by default
    loadExercises('all');
}

// Load Exercises
async function loadExercises(category) {
    const exercisesGrid = document.getElementById('exercises-grid');
    exercisesGrid.innerHTML = '<div class="exercise-loading"><i class="fas fa-spinner fa-spin"></i> Loading exercises...</div>';
    
    try {
        // Use 'all' to get all exercises, or specific category
        const categoryParam = category === 'all' ? 'all' : category;
        const response = await cachedFetch(`/api/training/exercises/${categoryParam}`, {}, `exercises_${categoryParam}`, CACHE_TTL.exercises);
        const data = await response.json();
        
        console.log('Exercise API response:', data);
        
        if (!data.ok) {
            throw new Error(data.message || 'Failed to load exercises');
        }
        
        const exercises = data.exercises || [];
        console.log(`Loaded ${exercises.length} exercises for category: ${categoryParam}`);
        
        if (exercises.length === 0) {
            exercisesGrid.innerHTML = '<div class="exercise-empty"><p>No exercises found in database.</p></div>';
            return;
        }
        
        exercisesGrid.innerHTML = exercises.map(exercise => `
            <div class="exercise-card">
                <div class="exercise-card-header">
                    <h3>${exercise.name}</h3>
                    <span class="exercise-category-badge ${exercise.category}">${exercise.category}</span>
                </div>
                <div class="exercise-card-body">
                    <p class="exercise-description">${exercise.description || 'No description available'}</p>
                    <div class="exercise-meta">
                        ${exercise.muscleGroups && exercise.muscleGroups.length > 0 ? `
                            <div class="meta-item">
                                <i class="fas fa-dumbbell"></i>
                                <span>${exercise.muscleGroups.join(', ')}</span>
                            </div>
                        ` : ''}
                        <div class="meta-item">
                            <i class="fas fa-signal"></i>
                            <span>${exercise.difficulty || 'Beginner'}</span>
                        </div>
                        ${exercise.equipment ? `
                            <div class="meta-item">
                                <i class="fas fa-tools"></i>
                                <span>${exercise.equipment}</span>
                            </div>
                        ` : ''}
                    </div>
                    ${exercise.instructions && exercise.instructions.length > 0 ? `
                        <div class="exercise-instructions">
                            <h4>Instructions:</h4>
                            <ol>
                                ${exercise.instructions.map(inst => `<li>${inst}</li>`).join('')}
                            </ol>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading exercises:', err);
        exercisesGrid.innerHTML = `
            <div class="exercise-error">
                <p><strong>Error loading exercises:</strong> ${err.message || 'Unknown error'}</p>
            </div>
        `;
    }
}

