let currentUser = 'user1';
let currentMealType = '';
let currentHistoryPeriod = 'week';
let currentUid = null;

// Firebase实例（通过ES模块在HTML中初始化）
let db = null;
let auth = null;

function initFirebase() {
    if (window.db && window.auth) {
        db = window.db;
        auth = window.auth;
        console.log('Firebase初始化成功');
        signInAnonymously();
    } else {
        console.error('Firebase未在HTML中初始化');
    }
}

// 匿名登录
function signInAnonymously() {
    if (!window.signInAnonymously || !auth) return;
    
    window.signInAnonymously(auth)
        .then((userCredential) => {
            currentUid = userCredential.user.uid;
            console.log('匿名登录成功，UID:', currentUid);
            loadFromFirestore();
        })
        .catch((error) => {
            console.error('匿名登录失败:', error);
        });
}

// 每日数据
let dailyData = {
    user1: {
        meals: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: []
        },
        exercises: []
    },
    user2: {
        meals: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: []
        },
        exercises: []
    }
};

// 历史记录数据
let historyData = {
    user1: [],
    user2: []
};

// 运动热量消耗（每30分钟）
const exerciseCalories = {
    running: 300, cycling: 250, swimming: 350, yoga: 100,
    weights: 200, cardio: 280, basketball: 270, badminton: 200, other: 150
};

// 获取今日日期字符串
function getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// 获取指定范围内的日期列表
function getDateRange(period) {
    const dates = [];
    const now = new Date();
    let startDate, endDate;
    
    switch(period) {
        case 'week':
            const dayOfWeek = now.getDay();
            const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - daysSinceMonday);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            break;
    }
    
    while (startDate <= endDate) {
        dates.push({
            date: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
            label: period === 'week' ? ['日', '一', '二', '三', '四', '五', '六'][startDate.getDay()] : 
                   period === 'month' ? `${startDate.getDate()}日` : 
                   `${startDate.getMonth() + 1}月`
        });
        startDate.setDate(startDate.getDate() + 1);
    }
    
    return dates;
}

// 切换用户
document.getElementById('user1Btn').addEventListener('click', () => {
    currentUser = 'user1';
    document.getElementById('user1Btn').classList.add('active');
    document.getElementById('user2Btn').classList.remove('active');
    updateAllContent();
});

document.getElementById('user2Btn').addEventListener('click', () => {
    currentUser = 'user2';
    document.getElementById('user2Btn').classList.add('active');
    document.getElementById('user1Btn').classList.remove('active');
    updateAllContent();
});

// 切换标签页
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'summary') {
            updateSummary();
        } else if (btn.dataset.tab === 'friend') {
            updateFriendContent();
        } else if (btn.dataset.tab === 'history') {
            updateHistory();
        }
    });
});

// 切换历史记录周期
document.querySelectorAll('.history-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.history-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentHistoryPeriod = btn.dataset.period;
        updateHistory();
    });
});

// 添加饮食
function addMeal(type) {
    currentMealType = type;
    document.getElementById('mealName').value = '';
    document.getElementById('mealWeight').value = '';
    document.getElementById('mealCalories').value = '';
    document.getElementById('manualCalories').checked = false;
    document.getElementById('mealCalories').style.display = 'none';
    document.getElementById('mealImage').value = '';
    document.getElementById('mealPreview').src = '';
    document.getElementById('mealPreview').style.display = 'none';
    
    if (type === 'snack') {
        document.getElementById('snackCaloriesInput').style.display = 'block';
    } else {
        document.getElementById('snackCaloriesInput').style.display = 'none';
    }
    
    document.getElementById('mealModal').style.display = 'block';
}

// 切换手动输入卡路里
function toggleManualCalories() {
    const checkbox = document.getElementById('manualCalories');
    const caloriesInput = document.getElementById('mealCalories');
    caloriesInput.style.display = checkbox.checked ? 'block' : 'none';
}

// 添加运动
function addExercise() {
    document.getElementById('exerciseType').value = '';
    document.getElementById('exerciseDuration').value = '';
    document.getElementById('exerciseDesc').value = '';
    document.getElementById('exerciseImage').value = '';
    document.getElementById('exercisePreview').src = '';
    document.getElementById('exercisePreview').style.display = 'none';
    document.getElementById('exerciseModal').style.display = 'block';
}

// 关闭弹窗
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 预览图片
function previewImage(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 按重量估算热量（数据来源：香港食物安全中心营养资料查询系统）
function estimateCaloriesByWeight(name, weight) {
    let calories = 0;
    const text = name.toLowerCase();
    
    for (let food in foodCalories) {
        if (text.includes(food.toLowerCase())) {
            calories += foodCalories[food];
        }
    }
    
    if (calories === 0) {
        calories = 50;
    }
    
    const calculatedCalories = Math.round((calories / 100) * weight);
    return calculatedCalories;
}

// 保存饮食
function saveMeal() {
    const name = document.getElementById('mealName').value;
    const weight = parseInt(document.getElementById('mealWeight').value) || 100;
    const imageInput = document.getElementById('mealImage');
    
    if (!name) {
        alert('请输入食物名称');
        return;
    }
    
    let calories = 0;
    const isManualCalories = document.getElementById('manualCalories').checked;
    
    if (isManualCalories) {
        const kjPer100g = parseInt(document.getElementById('mealCalories').value) || 0;
        calories = Math.round((kjPer100g / 100) * weight / 4.184);
    } else {
        calories = estimateCaloriesByWeight(name, weight);
    }
    
    let imageSrc = '';
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageSrc = e.target.result;
            saveMealData(name, weight, calories, imageSrc);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        saveMealData(name, weight, calories, '');
    }
}

function saveMealData(name, weight, calories, imageSrc) {
    const meal = {
        id: Date.now(),
        name: name || '未命名食物',
        weight: weight,
        image: imageSrc,
        calories: calories,
        time: new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})
    };
    
    dailyData[currentUser].meals[currentMealType].push(meal);
    closeModal('mealModal');
    updateMealContent();
    updateSummary();
}

// 删除饮食记录
function deleteMeal(mealType, mealId) {
    dailyData[currentUser].meals[mealType] = dailyData[currentUser].meals[mealType].filter(meal => meal.id !== mealId);
    updateMealContent();
    updateSummary();
}

// 保存运动
function saveExercise() {
    const type = document.getElementById('exerciseType').value;
    const duration = parseInt(document.getElementById('exerciseDuration').value) || 30;
    const desc = document.getElementById('exerciseDesc').value;
    const imageInput = document.getElementById('exerciseImage');
    
    if (!type) {
        alert('请选择运动类型');
        return;
    }
    
    let imageSrc = '';
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageSrc = e.target.result;
            saveExerciseData(type, duration, desc, imageSrc);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        saveExerciseData(type, duration, desc, '');
    }
}

function saveExerciseData(type, duration, desc, imageSrc) {
    const baseCalories = exerciseCalories[type] || 150;
    const calories = Math.round((baseCalories / 30) * duration);
    
    const exerciseNames = {
        running: '跑步', cycling: '骑行', swimming: '游泳', yoga: '瑜伽',
        weights: '力量训练', cardio: '有氧操', basketball: '篮球', 
        badminton: '羽毛球', other: '其他运动'
    };
    
    const exercise = {
        id: Date.now(),
        type: type,
        name: exerciseNames[type],
        duration: duration,
        desc: desc,
        image: imageSrc,
        calories: calories,
        time: new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})
    };
    
    dailyData[currentUser].exercises.push(exercise);
    closeModal('exerciseModal');
    updateExerciseContent();
    updateSummary();
}

// 更新饮食内容
function updateMealContent() {
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    
    mealTypes.forEach(type => {
        const content = document.getElementById(type + 'Content');
        const meals = dailyData[currentUser].meals[type];
        
        if (meals.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <p>暂无记录</p>
                </div>
            `;
        } else {
            content.innerHTML = meals.map(meal => `
                <div class="food-item">
                    <button class="delete-btn" onclick="deleteMeal('${type}', ${meal.id})">×</button>
                    ${meal.image ? `<img src="${meal.image}" alt="${meal.name}">` : ''}
                    <h4>${meal.name}</h4>
                    <p>${meal.weight} 克</p>
                    <p class="calories">${meal.calories} 千卡</p>
                    <p class="time">${meal.time}</p>
                </div>
            `).join('');
        }
    });
}

// 更新运动内容
function updateExerciseContent() {
    const content = document.getElementById('exerciseList');
    const exercises = dailyData[currentUser].exercises;
    
    if (exercises.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-dumbbell"></i>
                <p>暂无运动记录</p>
            </div>
        `;
    } else {
        content.innerHTML = exercises.map(exercise => `
            <div class="exercise-item">
                ${exercise.image ? `<img src="${exercise.image}" alt="${exercise.name}">` : ''}
                <h4>${exercise.name}</h4>
                <p class="duration"><i class="fas fa-clock"></i> ${exercise.duration} 分钟</p>
                ${exercise.desc ? `<p>${exercise.desc}</p>` : ''}
                <p class="burned">消耗: ${exercise.calories} 千卡</p>
                <p class="time">${exercise.time}</p>
            </div>
        `).join('');
    }
}

// 更新总结
function updateSummary() {
    const meals = dailyData[currentUser].meals;
    const exercises = dailyData[currentUser].exercises;
    
    let caloriesIn = 0;
    Object.values(meals).forEach(mealList => {
        mealList.forEach(meal => {
            caloriesIn += meal.calories;
        });
    });
    
    let caloriesOut = 0;
    exercises.forEach(exercise => {
        caloriesOut += exercise.calories;
    });
    
    const netCalories = caloriesIn - caloriesOut;
    const target = 500;
    
    document.getElementById('caloriesIn').textContent = caloriesIn;
    document.getElementById('caloriesOut').textContent = caloriesOut;
    document.getElementById('netCalories').textContent = netCalories;
    
    const progress = Math.min(100, (caloriesOut / target) * 100);
    document.getElementById('progressFill').style.width = progress + '%';
    
    const remaining = Math.max(0, target - caloriesOut);
    if (remaining === 0) {
        document.getElementById('progressText').textContent = '🎉 恭喜！今日目标达成！';
    } else {
        document.getElementById('progressText').textContent = `距离目标还差 ${remaining} 千卡`;
    }
}

// 更新朋友动态
function updateFriendContent() {
    const friendUser = currentUser === 'user1' ? 'user2' : 'user1';
    const friendName = currentUser === 'user1' ? 
        document.getElementById('user2Name').value || '用户B' : 
        document.getElementById('user1Name').value || '用户A';
    const data = dailyData[friendUser];
    
    const meals = data.meals;
    const exercises = data.exercises;
    
    let mealsHtml = '';
    const mealNames = {breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐'};
    
    Object.keys(meals).forEach(type => {
        if (meals[type].length > 0) {
            mealsHtml += `
                <div class="friend-meals">
                    <h4>${mealNames[type]}</h4>
                    ${meals[type].map(meal => `
                        <div class="friend-meal-item">
                            <strong>${meal.name}</strong> - ${meal.calories}千卡
                            ${meal.time ? `<span style="float:right">${meal.time}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
    });
    
    let exercisesHtml = '';
    if (exercises.length > 0) {
        exercisesHtml += `
            <div class="friend-exercises">
                <h4>运动</h4>
                ${exercises.map(exercise => `
                    <div class="friend-exercise-item">
                        <strong>${exercise.name}</strong> - ${exercise.duration}分钟
                        <span style="float:right">消耗 ${exercise.calories}千卡</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    const totalCaloriesIn = Object.values(meals).reduce((sum, list) => 
        sum + list.reduce((s, m) => s + m.calories, 0), 0);
    const totalCaloriesOut = exercises.reduce((sum, e) => sum + e.calories, 0);
    const netCalories = totalCaloriesIn - totalCaloriesOut;
    
    document.getElementById('friendContent').innerHTML = `
        <div class="friend-section">
            <h3>${friendName} 的今日打卡</h3>
            ${mealsHtml || '<p style="color:#999">暂无饮食记录</p>'}
            ${exercisesHtml || '<p style="color:#999">暂无运动记录</p>'}
            <div style="margin-top:20px; padding-top:15px; border-top:1px solid #ddd;">
                <p><strong>摄入:</strong> ${totalCaloriesIn}千卡</p>
                <p><strong>消耗:</strong> ${totalCaloriesOut}千卡</p>
                <p><strong>净热量:</strong> ${netCalories}千卡</p>
            </div>
        </div>
    `;
}

// 更新历史记录
function updateHistory() {
    const dates = getDateRange(currentHistoryPeriod);
    const history = historyData[currentUser];
    
    // 显示日期范围
    const dateRangeElement = document.getElementById('historyDateRange');
    if (dates.length > 0) {
        const startDate = dates[0].date;
        const endDate = dates[dates.length - 1].date;
        let rangeText = '';
        switch(currentHistoryPeriod) {
            case 'week':
                rangeText = `日期范围：${startDate} 至 ${endDate}`;
                break;
            case 'month':
                rangeText = `日期范围：${startDate} 至 ${endDate}`;
                break;
            case 'year':
                rangeText = `日期范围：${startDate} 至 ${endDate}`;
                break;
        }
        dateRangeElement.textContent = rangeText;
    }
    
    // 计算统计数据
    let totalDays = 0;
    let totalCaloriesIn = 0;
    let totalCaloriesOut = 0;
    const dailyStats = [];
    
    dates.forEach(dateInfo => {
        const dayData = history.find(h => h.date === dateInfo.date);
        if (dayData) {
            totalDays++;
            totalCaloriesIn += dayData.caloriesIn;
            totalCaloriesOut += dayData.caloriesOut;
        }
        dailyStats.push({
            date: dateInfo.date,
            label: dateInfo.label,
            caloriesIn: dayData ? dayData.caloriesIn : 0
        });
    });
    
    const avgNetCalories = totalDays > 0 ? Math.round((totalCaloriesIn - totalCaloriesOut) / totalDays) : 0;
    
    // 更新统计卡片
    document.getElementById('historyDays').textContent = totalDays;
    document.getElementById('historyCaloriesIn').textContent = totalCaloriesIn;
    document.getElementById('historyCaloriesOut').textContent = totalCaloriesOut;
    document.getElementById('historyNetAvg').textContent = avgNetCalories;
    
    // 更新图表
    updateChart(dailyStats);
    
    // 更新详细记录
    updateDetailList(history, dates);
}

// 更新图表
function updateChart(dailyStats) {
    const chartContainer = document.getElementById('caloriesChart').parentNode;
    
    if (dailyStats.length === 0) {
        chartContainer.innerHTML = '<div class="empty-history"><i class="fas fa-chart-bar"></i><p>暂无数据</p></div>';
        return;
    }
    
    const maxValue = Math.max(...dailyStats.map(d => d.caloriesIn), 1);
    
    chartContainer.innerHTML = `
        <div class="chart-bars">
            ${dailyStats.map(day => `
                <div class="chart-bar" style="height: ${(day.caloriesIn / maxValue) * 100}%">
                    <span class="chart-bar-value">${day.caloriesIn}</span>
                    <span class="chart-bar-label">${day.label}</span>
                </div>
            `).join('')}
        </div>
        <div class="chart-axis"></div>
    `;
}

// 更新详细记录列表
function updateDetailList(history, dates) {
    const detailList = document.getElementById('detailList');
    
    const filteredHistory = history.filter(h => {
        const dateStr = h.date;
        return dates.some(d => d.date === dateStr);
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredHistory.length === 0) {
        detailList.innerHTML = '<div class="empty-history"><i class="fas fa-calendar"></i><p>暂无记录</p></div>';
        return;
    }
    
    detailList.innerHTML = filteredHistory.map(day => {
        const dateObj = new Date(day.date);
        const month = dateObj.getMonth() + 1;
        const date = dateObj.getDate();
        const weekDay = ['日', '一', '二', '三', '四', '五', '六'][dateObj.getDay()];
        
        return `
            <div class="detail-item">
                <span class="detail-date">${month}月${date}日 (周${weekDay})</span>
                <div class="detail-calories">
                    <span>摄入: ${day.caloriesIn}千卡</span>
                    <span>消耗: ${day.caloriesOut}千卡</span>
                </div>
            </div>
        `;
    }).join('');
}

// 保存今日数据到历史记录
function saveToHistory() {
    const today = getTodayString();
    const meals = dailyData[currentUser].meals;
    const exercises = dailyData[currentUser].exercises;
    
    let caloriesIn = 0;
    Object.values(meals).forEach(mealList => {
        mealList.forEach(meal => {
            caloriesIn += meal.calories;
        });
    });
    
    let caloriesOut = 0;
    exercises.forEach(exercise => {
        caloriesOut += exercise.calories;
    });
    
    const existingIndex = historyData[currentUser].findIndex(h => h.date === today);
    const dayData = {
        date: today,
        caloriesIn: caloriesIn,
        caloriesOut: caloriesOut,
        meals: JSON.parse(JSON.stringify(meals)),
        exercises: JSON.parse(JSON.stringify(exercises))
    };
    
    if (existingIndex >= 0) {
        historyData[currentUser][existingIndex] = dayData;
    } else {
        historyData[currentUser].push(dayData);
    }
    
    saveToFirestore();
}

// 保存数据到Firestore
async function saveToFirestore() {
    if (!db || !currentUid) return;
    
    try {
        const today = getTodayString();
        await db.collection('users').doc(currentUid).set({
            dailyData: dailyData[currentUser],
            userName: document.getElementById(currentUser === 'user1' ? 'user1Name' : 'user2Name')?.value || currentUser,
            lastUpdated: new Date()
        }, { merge: true });
        
        await db.collection('history').doc(`${currentUid}_${today}`).set({
            date: today,
            caloriesIn: historyData[currentUser].find(h => h.date === today)?.caloriesIn || 0,
            caloriesOut: historyData[currentUser].find(h => h.date === today)?.caloriesOut || 0,
            meals: dailyData[currentUser].meals,
            exercises: dailyData[currentUser].exercises,
            uid: currentUid,
            createdAt: new Date()
        });
        
        console.log('数据已同步到Firestore');
    } catch (error) {
        console.error('保存到Firestore失败:', error);
    }
}

// 从Firestore加载数据
async function loadFromFirestore() {
    if (!db || !currentUid) {
        console.log('Firebase未初始化或未登录，使用本地数据');
        return;
    }
    
    try {
        const userDoc = await db.collection('users').doc(currentUid).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            if (data.dailyData) {
                dailyData[currentUser] = data.dailyData;
                console.log('从Firestore加载每日数据成功');
            }
            if (data.userName) {
                const nameInput = document.getElementById(currentUser === 'user1' ? 'user1Name' : 'user2Name');
                if (nameInput) nameInput.value = data.userName;
            }
        }
        
        const historySnapshot = await db.collection('history')
            .where('uid', '==', currentUid)
            .get();
        
        const cloudHistory = [];
        historySnapshot.forEach(doc => {
            const data = doc.data();
            cloudHistory.push({
                date: data.date,
                caloriesIn: data.caloriesIn,
                caloriesOut: data.caloriesOut,
                meals: data.meals,
                exercises: data.exercises
            });
        });
        
        if (cloudHistory.length > 0) {
            historyData[currentUser] = cloudHistory;
            console.log('从Firestore加载历史数据成功');
        }
        
        updateAllContent();
    } catch (error) {
        console.error('从Firestore加载数据失败:', error);
    }
}

// 更新所有内容
function updateAllContent() {
    updateMealContent();
    updateExerciseContent();
    updateSummary();
    updateFriendContent();
    updateHistory();
}

// 点击外部关闭弹窗
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// 添加模拟历史数据
function addSampleHistoryData() {
    const now = new Date();
    
    // 为用户1添加过去几天的数据
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        historyData.user1.push({
            date: dateStr,
            caloriesIn: 1500 + Math.floor(Math.random() * 500),
            caloriesOut: 300 + Math.floor(Math.random() * 400),
            meals: {},
            exercises: []
        });
    }
    
    // 为用户2添加过去几天的数据
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        historyData.user2.push({
            date: dateStr,
            caloriesIn: 1400 + Math.floor(Math.random() * 400),
            caloriesOut: 250 + Math.floor(Math.random() * 350),
            meals: {},
            exercises: []
        });
    }
    
    // 添加本月其他日期数据
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    while (firstDay < now) {
        if (!historyData.user1.some(h => h.date === `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`)) {
            const dateStr = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`;
            historyData.user1.push({
                date: dateStr,
                caloriesIn: 1400 + Math.floor(Math.random() * 600),
                caloriesOut: 200 + Math.floor(Math.random() * 500),
                meals: {},
                exercises: []
            });
            historyData.user2.push({
                date: dateStr,
                caloriesIn: 1300 + Math.floor(Math.random() * 500),
                caloriesOut: 180 + Math.floor(Math.random() * 450),
                meals: {},
                exercises: []
            });
        }
        firstDay.setDate(firstDay.getDate() + 1);
    }
    
    updateHistory();
}

// 初始化
updateAllContent();

// 添加一些示例数据
function addSampleData() {
    dailyData.user1.meals.breakfast = [
        {id: 1, name: '鸡蛋', weight: 50, image: '', calories: 72, time: '07:30'},
        {id: 2, name: '牛奶', weight: 200, image: '', calories: 128, time: '07:30'}
    ];
    dailyData.user1.meals.lunch = [
        {id: 3, name: '白饭', weight: 150, image: '', calories: 174, time: '12:00'},
        {id: 4, name: '鸡胸肉', weight: 100, image: '', calories: 165, time: '12:00'},
        {id: 5, name: '西兰花', weight: 100, image: '', calories: 33, time: '12:00'},
        {id: 6, name: '胡萝卜', weight: 50, image: '', calories: 21, time: '12:00'}
    ];
    dailyData.user1.meals.dinner = [
        {id: 7, name: '包菜', weight: 200, image: '', calories: 44, time: '18:30'},
        {id: 8, name: '番茄', weight: 100, image: '', calories: 18, time: '18:30'},
        {id: 9, name: '鸡蛋', weight: 100, image: '', calories: 143, time: '18:30'}
    ];
    dailyData.user1.meals.snack = [
        {id: 10, name: '苹果', weight: 150, image: '', calories: 89, time: '15:00'},
        {id: 11, name: '黄瓜', weight: 100, image: '', calories: 10, time: '10:30'}
    ];
    dailyData.user1.exercises = [
        {id: 12, type: 'running', name: '跑步', duration: 30, desc: '慢跑', image: '', calories: 300, time: '08:00'}
    ];
    
    dailyData.user2.meals.breakfast = [
        {id: 13, name: '燕麦', weight: 50, image: '', calories: 195, time: '07:00'},
        {id: 14, name: '香蕉', weight: 100, image: '', calories: 89, time: '07:00'}
    ];
    dailyData.user2.meals.lunch = [
        {id: 15, name: '白饭', weight: 100, image: '', calories: 116, time: '12:30'},
        {id: 16, name: '瘦牛肉', weight: 100, image: '', calories: 105, time: '12:30'},
        {id: 17, name: '菠菜', weight: 100, image: '', calories: 21, time: '12:30'},
        {id: 18, name: '生菜', weight: 50, image: '', calories: 6, time: '12:30'}
    ];
    dailyData.user2.meals.dinner = [
        {id: 19, name: '冬瓜', weight: 200, image: '', calories: 26, time: '18:00'},
        {id: 20, name: '豆腐', weight: 100, image: '', calories: 70, time: '18:00'},
        {id: 21, name: '白萝卜', weight: 100, image: '', calories: 18, time: '18:00'}
    ];
    dailyData.user2.meals.snack = [
        {id: 22, name: '草莓', weight: 100, image: '', calories: 32, time: '15:00'},
        {id: 23, name: '橙子', weight: 150, image: '', calories: 71, time: '14:00'}
    ];
    dailyData.user2.exercises = [
        {id: 24, type: 'yoga', name: '瑜伽', duration: 45, desc: '晨间瑜伽', image: '', calories: 150, time: '07:30'}
    ];
    
    updateAllContent();
    addSampleHistoryData();
}

addSampleData();

// 页面关闭前保存数据
window.addEventListener('beforeunload', () => {
    saveToHistory();
});

// 显示当前日期
function showCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekDay = weekDays[now.getDay()];
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = `${year}-${month}-${day} ${weekDay}`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    showCurrentDate();
    initFirebase();
});