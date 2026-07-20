let currentUser = 'user1';
let currentMealType = '';
let currentHistoryPeriod = 'week';

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

// 食物热量数据库
const foodCalories = {
    '米饭': 130, '面条': 110, '馒头': 280, '面包': 250,
    '鸡蛋': 140, '牛奶': 54, '豆浆': 30, '粥': 60,
    '鸡胸肉': 165, '瘦牛肉': 250, '鱼肉': 120, '虾': 90,
    '西兰花': 34, '菠菜': 23, '黄瓜': 16, '番茄': 18,
    '苹果': 52, '香蕉': 91, '橙子': 47, '草莓': 32,
    '蛋糕': 350, '薯片': 536, '巧克力': 546, '饼干': 400,
    '沙拉': 150, '汉堡': 540, '披萨': 285, '炸鸡': 275,
    '豆腐': 70, '瘦肉': 200, '鸡蛋羹': 80, '炒饭': 180,
    '水饺': 280, '包子': 250, '油条': 380, '煎饼': 220,
    '酸奶': 80, '坚果': 600, '蜂蜜': 304, '燕麦': 389
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
    let startDate = new Date(now);
    
    switch(period) {
        case 'week':
            startDate.setDate(startDate.getDate() - 6);
            break;
        case 'month':
            startDate.setDate(1);
            break;
        case 'year':
            startDate.setMonth(0);
            startDate.setDate(1);
            break;
    }
    
    while (startDate <= now) {
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
    document.getElementById('mealDesc').value = '';
    document.getElementById('mealImage').value = '';
    document.getElementById('mealPreview').src = '';
    document.getElementById('mealPreview').style.display = 'none';
    document.getElementById('mealModal').style.display = 'block';
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

// 估算热量
function estimateCalories(name, desc) {
    let calories = 0;
    const text = (name + ' ' + desc).toLowerCase();
    
    for (let food in foodCalories) {
        if (text.includes(food.toLowerCase())) {
            calories += foodCalories[food];
        }
    }
    
    if (calories === 0) {
        const descLength = desc.length;
        if (descLength < 10) calories = 100;
        else if (descLength < 30) calories = 200;
        else calories = 300;
    }
    
    if (desc.includes('大份') || desc.includes('多') || desc.includes('大量')) {
        calories *= 1.5;
    } else if (desc.includes('小份') || desc.includes('少') || desc.includes('少量')) {
        calories *= 0.7;
    }
    
    return Math.round(calories);
}

// 保存饮食
function saveMeal() {
    const name = document.getElementById('mealName').value;
    const desc = document.getElementById('mealDesc').value;
    const imageInput = document.getElementById('mealImage');
    
    let imageSrc = '';
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageSrc = e.target.result;
            saveMealData(name, desc, imageSrc);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        saveMealData(name, desc, '');
    }
}

function saveMealData(name, desc, imageSrc) {
    const calories = estimateCalories(name, desc);
    const meal = {
        id: Date.now(),
        name: name || '未命名食物',
        desc: desc,
        image: imageSrc,
        calories: calories,
        time: new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})
    };
    
    dailyData[currentUser].meals[currentMealType].push(meal);
    closeModal('mealModal');
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
                    ${meal.image ? `<img src="${meal.image}" alt="${meal.name}">` : ''}
                    <h4>${meal.name}</h4>
                    ${meal.desc ? `<p>${meal.desc}</p>` : ''}
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
    const friendName = currentUser === 'user1' ? '用户B' : '用户A';
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
        {id: 1, name: '全麦面包', desc: '2片', image: '', calories: 250, time: '07:30'}
    ];
    dailyData.user1.meals.lunch = [
        {id: 2, name: '鸡胸肉沙拉', desc: '鸡胸肉100g，蔬菜适量', image: '', calories: 280, time: '12:00'}
    ];
    dailyData.user1.exercises = [
        {id: 3, type: 'running', name: '跑步', duration: 30, desc: '慢跑', image: '', calories: 300, time: '08:00'}
    ];
    
    dailyData.user2.meals.breakfast = [
        {id: 4, name: '鸡蛋+牛奶', desc: '1个鸡蛋，1杯牛奶', image: '', calories: 194, time: '07:00'}
    ];
    dailyData.user2.exercises = [
        {id: 5, type: 'yoga', name: '瑜伽', duration: 45, desc: '晨间瑜伽', image: '', calories: 150, time: '07:30'}
    ];
    
    updateAllContent();
    addSampleHistoryData();
}

addSampleData();

// 页面关闭前保存数据
window.addEventListener('beforeunload', () => {
    saveToHistory();
});