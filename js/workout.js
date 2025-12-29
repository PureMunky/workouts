// Workout activities with metadata
const activities = {
    run: {
        name: 'Run',
        icon: '🏃',
        easy: false,
        type: 'cardio',
        intensity: 'high',
        muscleGroups: ['legs', 'cardio']
    },
    swim: {
        name: 'Swim',
        icon: '🏊',
        easy: false,
        seasonal: true,
        type: 'cardio',
        intensity: 'high',
        muscleGroups: ['fullbody', 'cardio']
    },
    weights: {
        name: 'Lift Weights',
        icon: '🏋️',
        easy: false,
        type: 'strength',
        intensity: 'high',
        muscleGroups: ['fullbody', 'strength']
    },
    bag: {
        name: 'Punching Bag',
        icon: '🥊',
        easy: false,
        type: 'cardio',
        intensity: 'high',
        muscleGroups: ['arms', 'cardio']
    },
    yoga: {
        name: 'Yoga',
        icon: '🧘',
        easy: true,
        type: 'recovery',
        intensity: 'low',
        muscleGroups: ['flexibility']
    },
    tabletennis: {
        name: 'Table Tennis',
        icon: '🏓',
        easy: true,
        type: 'cardio',
        intensity: 'low',
        muscleGroups: ['arms', 'cardio']
    }
};

// Simple seeded random number generator
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// Generate a seed from a date
function dateSeed(date) {
    return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

// Check if it's summer (June, July, August)
function isSummer(date) {
    const month = date.getMonth();
    return month >= 5 && month <= 7; // 5=June, 6=July, 7=August
}

// Get available activities for a given date
function getAvailableActivities(date) {
    const summer = isSummer(date);
    return Object.entries(activities).filter(([key, activity]) => {
        if (activity.seasonal) {
            return summer;
        }
        return true;
    });
}

// Check if activity is suitable after previous day's workout
function isActivitySuitable(activityKey, activity, previousWorkout) {
    if (!previousWorkout || previousWorkout.length === 0) return true;

    // Get previous day's primary activity
    const prevPrimary = previousWorkout[0];

    // RULE 1: Don't do high-intensity strength training on consecutive days
    if (activity.type === 'strength' && activity.intensity === 'high' &&
        prevPrimary.type === 'strength' && prevPrimary.intensity === 'high') {
        return false;
    }

    // RULE 2: Don't do the same exact activity two days in a row
    if (activityKey === prevPrimary.key) {
        return false;
    }

    // RULE 3: After high-intensity cardio (legs), avoid running the next day
    if (activityKey === 'run' && prevPrimary.key === 'run') {
        return false;
    }

    return true;
}

// Generate workout for a specific date with best practices
function generateWorkout(date, previousWorkout = null) {
    const availableActivities = getAvailableActivities(date);
    const seed = dateSeed(date);

    // Use seed to pick activities
    const rand1 = seededRandom(seed);
    const rand2 = seededRandom(seed + 1);
    const rand3 = seededRandom(seed + 2);
    const rand4 = seededRandom(seed + 3);

    // Filter activities based on best practices
    let suitableActivities = availableActivities.filter(([key, activity]) =>
        isActivitySuitable(key, activity, previousWorkout)
    );

    // If no suitable activities (shouldn't happen), use all available
    if (suitableActivities.length === 0) {
        suitableActivities = availableActivities;
    }

    // Every 7th day (based on day of week), prioritize recovery
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) { // Sunday
        const recoveryActivities = suitableActivities.filter(([key, act]) =>
            act.intensity === 'low'
        );
        if (recoveryActivities.length > 0) {
            suitableActivities = recoveryActivities;
        }
    }

    // Pick primary activity from suitable activities
    const primaryIndex = Math.floor(rand1 * suitableActivities.length);
    const [primaryKey, primaryActivity] = suitableActivities[primaryIndex];

    const selectedActivities = [{ key: primaryKey, ...primaryActivity }];

    // Decide if we should add a secondary activity
    // 40% chance if primary is high intensity, 60% if low intensity
    const secondaryChance = primaryActivity.intensity === 'high' ? 0.6 : 0.4;
    const addSecondary = rand3 > secondaryChance;

    if (addSecondary) {
        // If primary is high intensity, add a low intensity activity
        // If primary is low intensity, we can add another low or medium activity
        let secondaryOptions;

        if (primaryActivity.intensity === 'high') {
            // Add recovery/stretching after intense workout
            secondaryOptions = availableActivities.filter(([key, act]) =>
                act.intensity === 'low' && key !== primaryKey
            );
        } else {
            // Can add another low-intensity activity
            secondaryOptions = availableActivities.filter(([key, act]) =>
                act.intensity === 'low' && key !== primaryKey
            );
        }

        if (secondaryOptions.length > 0) {
            const secondaryIndex = Math.floor(rand2 * secondaryOptions.length);
            const [secondaryKey, secondaryActivity] = secondaryOptions[secondaryIndex];
            selectedActivities.push({ key: secondaryKey, ...secondaryActivity });
        }
    }

    return selectedActivities;
}
