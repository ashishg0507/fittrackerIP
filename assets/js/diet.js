// Diet Page JavaScript Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the diet calculator
    initializeDietCalculator();
    
    // Initialize smooth scrolling for navigation
    initializeSmoothScrolling();
    
    // Initialize animations on scroll
    initializeScrollAnimations();
    
    // Initialize diet plan interactions
    initializeDietPlanInteractions();
});

// Diet Calculator Functionality
function initializeDietCalculator() {
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsSection = document.getElementById('results-section');
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            if (validateForm()) {
                calculateNutrition();
            }
        });
    }
    
    // Add real-time validation
    const formInputs = document.querySelectorAll('.calculator-form input, .calculator-form select');
    formInputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

// Form Validation
function validateForm() {
    const requiredFields = ['age', 'gender', 'weight', 'height', 'activity', 'goal'];
    let isValid = true;
    
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';
    
    // Clear previous error state
    clearFieldError(field);
    
    // Required field validation
    if (!value) {
        errorMessage = `${getFieldLabel(fieldName)} is required`;
        isValid = false;
    } else {
        // Specific validations
        switch (fieldName) {
            case 'age':
                const age = parseInt(value);
                if (age < 16 || age > 100) {
                    errorMessage = 'Age must be between 16 and 100';
                    isValid = false;
                }
                break;
                
            case 'weight':
                const weight = parseFloat(value);
                if (weight < 30 || weight > 200) {
                    errorMessage = 'Weight must be between 30 and 200 kg';
                    isValid = false;
                }
                break;
                
            case 'height':
                const height = parseInt(value);
                if (height < 120 || height > 250) {
                    errorMessage = 'Height must be between 120 and 250 cm';
                    isValid = false;
                }
                break;
        }
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        showFieldSuccess(field);
    }
    
    return isValid;
}

function clearFieldError(field) {
    field.parentElement.classList.remove('error');
    const errorMsg = field.parentElement.querySelector('.error-message');
    if (errorMsg) {
        errorMsg.remove();
    }
}

function showFieldError(field, message) {
    field.parentElement.classList.add('error');
    field.parentElement.classList.remove('success');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentElement.appendChild(errorDiv);
}

function showFieldSuccess(field) {
    field.parentElement.classList.add('success');
    field.parentElement.classList.remove('error');
}

function getFieldLabel(fieldName) {
    const labels = {
        'age': 'Age',
        'gender': 'Gender',
        'weight': 'Weight',
        'height': 'Height',
        'activity': 'Activity Level',
        'goal': 'Fitness Goal'
    };
    return labels[fieldName] || fieldName;
}

// Nutrition Calculation
function calculateNutrition() {
    const formData = {
        age: parseInt(document.getElementById('age').value),
        gender: document.getElementById('gender').value,
        weight: parseFloat(document.getElementById('weight').value),
        height: parseInt(document.getElementById('height').value),
        activity: document.getElementById('activity').value,
        goal: document.getElementById('goal').value
    };
    
    // Show loading state
    showLoadingState();
    
    // Simulate calculation delay for better UX
    setTimeout(() => {
        const results = performNutritionCalculation(formData);
        displayResults(results);
        hideLoadingState();
    }, 1500);
}

function performNutritionCalculation(data) {
    // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
    let bmr;
    if (data.gender === 'male') {
        bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age + 5;
    } else {
        bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age - 161;
    }
    
    // Activity multipliers
    const activityMultipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very-active': 1.9
    };
    
    // Calculate TDEE (Total Daily Energy Expenditure)
    const tdee = bmr * activityMultipliers[data.activity];
    
    // Adjust calories based on goal
    let targetCalories;
    switch (data.goal) {
        case 'lose':
            targetCalories = tdee - 500; // 500 calorie deficit for 1 lb/week loss
            break;
        case 'maintain':
            targetCalories = tdee;
            break;
        case 'gain':
            targetCalories = tdee + 300; // 300 calorie surplus for gradual gain
            break;
        default:
            targetCalories = tdee;
    }
    
    // Calculate macronutrients based on target calories
    const proteinGrams = Math.round((data.weight * 2.2) * 1.2); // 1.2g per kg body weight
    const proteinCalories = proteinGrams * 4;
    
    const fatGrams = Math.round((targetCalories * 0.25) / 9); // 25% of calories from fat
    const fatCalories = fatGrams * 9;
    
    const carbCalories = targetCalories - proteinCalories - fatCalories;
    const carbGrams = Math.round(carbCalories / 4);
    
    return {
        calories: Math.round(targetCalories),
        protein: proteinGrams,
        carbs: carbGrams,
        fats: fatGrams,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee)
    };
}

function displayResults(results) {
    const resultsSection = document.getElementById('results-section');
    
    // Animate the results section into view
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Animate the result values
    animateValue('calories', 0, results.calories, 2000);
    animateValue('protein', 0, results.protein, 2000);
    animateValue('carbs', 0, results.carbs, 2000);
    animateValue('fats', 0, results.fats, 2000);
    
    // Add success animation to result cards
    setTimeout(() => {
        const resultCards = document.querySelectorAll('.result-card');
        resultCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('success');
            }, index * 200);
        });
    }, 1000);
}

function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startTime = performance.now();
    
    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(start + (end - start) * easeOutQuart);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }
    
    requestAnimationFrame(updateValue);
}

function showLoadingState() {
    const calculateBtn = document.getElementById('calculate-btn');
    calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';
    calculateBtn.disabled = true;
}

function hideLoadingState() {
    const calculateBtn = document.getElementById('calculate-btn');
    calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> Calculate My Nutrition Plan';
    calculateBtn.disabled = false;
}

// Smooth Scrolling
function initializeSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Scroll Animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.diet-plan-card, .meal-planning-card, .tip-card, .result-card');
    animatedElements.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
}

// Diet Plan Interactions
function initializeDietPlanInteractions() {
    const planButtons = document.querySelectorAll('.plan-btn');
    
    planButtons.forEach(button => {
        button.addEventListener('click', function() {
            const planCard = this.closest('.diet-plan-card');
            const planName = planCard.querySelector('h3').textContent;
            
            // Show modal or navigate to detailed plan page
            showPlanDetails(planName);
        });
    });
}

function showPlanDetails(planName) {
    // Create a simple modal for plan details
    const modal = document.createElement('div');
    modal.className = 'plan-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${planName} - Detailed Information</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>This is a detailed view of the ${planName}. Here you would find:</p>
                <ul>
                    <li>Detailed meal plans</li>
                    <li>Recipe suggestions</li>
                    <li>Shopping lists</li>
                    <li>Progress tracking</li>
                    <li>Expert tips and advice</li>
                </ul>
                <p>This feature would be expanded in a full implementation with backend integration.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary">Start This Plan</button>
                <button class="btn btn-secondary modal-close">Close</button>
            </div>
        </div>
    `;
    
    // Add modal styles
    const modalStyles = `
        .plan-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        }
        
        .modal-content {
            background: white;
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            animation: slideInUp 0.3s ease;
        }
        
        .modal-header {
            padding: 2rem 2rem 1rem;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h2 {
            margin: 0;
            color: var(--secondary-color);
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: var(--text-muted);
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-body {
            padding: 2rem;
        }
        
        .modal-body ul {
            margin: 1rem 0;
            padding-left: 1.5rem;
        }
        
        .modal-body li {
            margin-bottom: 0.5rem;
            color: var(--text-muted);
        }
        
        .modal-footer {
            padding: 1rem 2rem 2rem;
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    
    // Add styles if not already added
    if (!document.getElementById('modal-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'modal-styles';
        styleSheet.textContent = modalStyles;
        document.head.appendChild(styleSheet);
    }
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeModal = () => {
        modal.remove();
    };
    
    modal.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to meal list items
    const mealItems = document.querySelectorAll('.meal-list li');
    mealItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(10px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
    
    // Add click to copy functionality for result values
    const resultValues = document.querySelectorAll('.result-value');
    resultValues.forEach(value => {
        value.addEventListener('click', function() {
            const text = this.textContent;
            navigator.clipboard.writeText(text).then(() => {
                // Show a brief success message
                const originalText = this.textContent;
                this.textContent = 'Copied!';
                this.style.color = '#27ae60';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.color = '';
                }, 1000);
            });
        });
        
        // Add cursor pointer to indicate clickability
        value.style.cursor = 'pointer';
        value.title = 'Click to copy';
    });
});

// Export functions for potential external use
window.DietCalculator = {
    calculateNutrition: performNutritionCalculation,
    validateForm: validateForm,
    showPlanDetails: showPlanDetails
};
