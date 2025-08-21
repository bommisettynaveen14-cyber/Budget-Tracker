// Budget Tracker PWA - Main JavaScript File
class BudgetTracker {
    constructor() {
        this.data = {
            transactions: [],
            categories: [],
            budgets: {},
            settings: {
                theme: 'auto',
                language: 'en',
                dailyReminder: true,
                locationTracking: false,
                autoCategorize: true,
                installationDate: new Date().toISOString()
            }
        };
        
        this.currentEditingTransaction = null;
        this.currentEditingCategory = null;
        this.charts = {};
        this.selectedTimeRange = 30; // days
        this.selectedMonth = 'all'; // for monthly filter
        this.filterMode = 'monthly'; // 'monthly' or 'custom'
        this.customDateRange = { from: null, to: null };
        
        this.init();
    }
    
    // Initialize the application
    init() {
        this.loadData();
        this.setupEventListeners();
        this.initializeDefaultCategories();
        this.applyTheme();
        this.updateLanguage();
        this.updateDashboard();
        this.renderTransactions();
        this.renderCategories();
        this.renderCharts();
        this.showDailyReminder();
        this.registerServiceWorker();
        this.setupKeyboardShortcuts();
        this.updateAppInfo();
        this.initializeMonthFilters();
    }
    
    // Data Management
    loadData() {
        try {
            const savedData = localStorage.getItem('budgetTrackerData');
            if (savedData) {
                this.data = { ...this.data, ...JSON.parse(savedData) };
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showToast('Error loading saved data', 'error');
        }
    }
    
    saveData() {
        try {
            localStorage.setItem('budgetTrackerData', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data:', error);
            this.showToast('Error saving data', 'error');
        }
    }
    
    // Initialize default categories
    initializeDefaultCategories() {
        if (this.data.categories.length === 0) {
            const defaultCategories = [
                { id: 'food', name: 'Food', icon: '🍕', color: '#FF6B6B', type: 'expense' },
                { id: 'transport', name: 'Transport', icon: '🚗', color: '#4ECDC4', type: 'expense' },
                { id: 'shopping', name: 'Shopping', icon: '🛒', color: '#45B7D1', type: 'expense' },
                { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#96CEB4', type: 'expense' },
                { id: 'bills', name: 'Bills', icon: '📄', color: '#FFEAA7', type: 'expense' },
                { id: 'salary', name: 'Salary', icon: '💰', color: '#6C5CE7', type: 'income' },
                { id: 'freelance', name: 'Freelance', icon: '💼', color: '#A29BFE', type: 'income' }
            ];
            
            this.data.categories = defaultCategories;
            this.saveData();
        }
    }
    
    // Initialize month filters for new features
    initializeMonthFilters() {
        this.populateMonthFilter();
        this.setupMonthFilterEvents();
    }
    
    // Populate month filter dropdown with available months from transactions
    populateMonthFilter() {
        const monthFilter = document.getElementById('monthFilter');
        const chartMonthFilter = document.getElementById('chartMonthFilter');
        
        if (!monthFilter) return;
        
        // Clear existing options except "All Time"
        monthFilter.innerHTML = '<option value="all">All Time</option>';
        if (chartMonthFilter) {
            chartMonthFilter.innerHTML = '<option value="all">All Time</option>';
        }
        
        // Get unique months from transactions and add future months up to next 12 months
        const months = new Set();
        
        // Add months from existing transactions
        this.data.transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthKey);
        });
        
        // Add current month and next 11 months automatically
        const currentDate = new Date();
        for (let i = 0; i < 12; i++) {
            const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const monthKey = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthKey);
        }
        
        // Also add past 12 months
        for (let i = 1; i <= 12; i++) {
            const pastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthKey);
        }
        
        // Sort months in descending order (newest first)
        const sortedMonths = Array.from(months).sort().reverse();
        
        sortedMonths.forEach(monthKey => {
            const [year, month] = monthKey.split('-');
            const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
            });
            
            const option1 = document.createElement('option');
            option1.value = monthKey;
            option1.textContent = monthName;
            
            // Mark current month as default selection
            const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            if (monthKey === currentMonth) {
                option1.selected = true;
                this.selectedMonth = monthKey; // Auto-select current month
            }
            
            monthFilter.appendChild(option1);
            
            if (chartMonthFilter) {
                const option2 = document.createElement('option');
                option2.value = monthKey;
                option2.textContent = monthName;
                if (monthKey === currentMonth) {
                    option2.selected = true;
                }
                chartMonthFilter.appendChild(option2);
            }
        });
        
        // Auto-update monthly view if current month is selected
        if (this.selectedMonth !== 'all') {
            this.updateMonthlyView();
        }
    }
    
    // Setup month filter event listeners
    setupMonthFilterEvents() {
        const monthFilter = document.getElementById('monthFilter');
        const chartMonthFilter = document.getElementById('chartMonthFilter');
        
        // Monthly filter dropdown
        if (monthFilter) {
            monthFilter.addEventListener('change', (e) => {
                this.selectedMonth = e.target.value;
                this.filterMode = 'monthly';
                this.updateFilterView();
            });
        }
        
        // Chart filter dropdown
        if (chartMonthFilter) {
            chartMonthFilter.addEventListener('change', (e) => {
                this.renderCharts();
            });
        }
        
        // Filter mode toggle buttons
        const monthModeBtn = document.getElementById('monthModeBtn');
        const customRangeBtn = document.getElementById('customRangeBtn');
        
        if (monthModeBtn) {
            monthModeBtn.addEventListener('click', () => {
                this.switchFilterMode('monthly');
            });
        }
        
        if (customRangeBtn) {
            customRangeBtn.addEventListener('click', () => {
                this.switchFilterMode('custom');
            });
        }
        
        // Custom date range controls
        const applyCustomRange = document.getElementById('applyCustomRange');
        const clearCustomRange = document.getElementById('clearCustomRange');
        
        if (applyCustomRange) {
            applyCustomRange.addEventListener('click', () => {
                this.applyCustomDateRange();
            });
        }
        
        if (clearCustomRange) {
            clearCustomRange.addEventListener('click', () => {
                this.clearCustomDateRange();
            });
        }
    }
    
    // Switch between filter modes
    switchFilterMode(mode) {
        this.filterMode = mode;
        
        const monthModeBtn = document.getElementById('monthModeBtn');
        const customRangeBtn = document.getElementById('customRangeBtn');
        const monthFilterSection = document.getElementById('monthFilterSection');
        const customRangeSection = document.getElementById('customRangeSection');
        
        if (monthModeBtn && customRangeBtn && monthFilterSection && customRangeSection) {
            if (mode === 'monthly') {
                monthModeBtn.classList.add('active');
                customRangeBtn.classList.remove('active');
                monthFilterSection.style.display = 'block';
                customRangeSection.style.display = 'none';
            } else if (mode === 'custom') {
                monthModeBtn.classList.remove('active');
                customRangeBtn.classList.add('active');
                monthFilterSection.style.display = 'none';
                customRangeSection.style.display = 'block';
            }
        }
        
        this.updateFilterView();
    }
    
    // Apply custom date range filter
    applyCustomDateRange() {
        const fromDate = document.getElementById('customFromDate').value;
        const toDate = document.getElementById('customToDate').value;
        
        if (!fromDate || !toDate) {
            alert('Please select both From and To dates');
            return;
        }
        
        if (new Date(fromDate) > new Date(toDate)) {
            alert('From date cannot be later than To date');
            return;
        }
        
        this.customDateRange = { from: fromDate, to: toDate };
        this.filterMode = 'custom';
        this.updateFilterView();
        
        // Update summary text
        const summary = document.getElementById('customRangeSummary');
        if (summary) {
            const fromFormatted = new Date(fromDate).toLocaleDateString();
            const toFormatted = new Date(toDate).toLocaleDateString();
            summary.textContent = `Showing transactions from ${fromFormatted} to ${toFormatted}`;
        }
    }
    
    // Clear custom date range filter
    clearCustomDateRange() {
        document.getElementById('customFromDate').value = '';
        document.getElementById('customToDate').value = '';
        this.customDateRange = { from: null, to: null };
        
        const summary = document.getElementById('customRangeSummary');
        if (summary) {
            summary.textContent = '';
        }
        
        this.updateFilterView();
    }
    
    // Update filter view based on current mode
    updateFilterView() {
        let filteredTransactions;
        
        if (this.filterMode === 'monthly') {
            filteredTransactions = this.getTransactionsForMonth(this.selectedMonth);
            this.updateMonthlyView(filteredTransactions);
        } else if (this.filterMode === 'custom') {
            filteredTransactions = this.getTransactionsForCustomRange();
            this.updateCustomRangeView(filteredTransactions);
        }
    }
    
    // Update monthly view based on selected month
    updateMonthlyView(transactions = null) {
        const filteredTransactions = transactions || this.getTransactionsForMonth(this.selectedMonth);
        
        if (this.selectedMonth === 'all') {
            // Hide monthly summaries for "All Time"
            document.getElementById('monthlySummary').style.display = 'none';
            document.getElementById('categorySummarySection').style.display = 'none';
            document.getElementById('categoryTotalsSection').style.display = 'none';
            document.getElementById('dailyTotalsSection').style.display = 'none';
        } else {
            // Show monthly summaries
            document.getElementById('monthlySummary').style.display = 'grid';
            document.getElementById('categorySummarySection').style.display = 'block';
            document.getElementById('categoryTotalsSection').style.display = 'none'; // Hide for monthly view
            document.getElementById('dailyTotalsSection').style.display = 'block';
            
            this.updateMonthlySummaryCards(filteredTransactions);
            this.updateCategorySummary(filteredTransactions);
            this.updateDailyTotals(filteredTransactions);
        }
        
        // Update transaction list
        this.renderTransactions(filteredTransactions);
    }
    
    // Update custom range view
    updateCustomRangeView(transactions) {
        if (!transactions || transactions.length === 0) {
            // Hide summaries if no transactions
            document.getElementById('monthlySummary').style.display = 'none';
            document.getElementById('categorySummarySection').style.display = 'none';
            document.getElementById('categoryTotalsSection').style.display = 'none';
            document.getElementById('dailyTotalsSection').style.display = 'none';
            this.renderTransactions([]);
            return;
        }
        
        // Show summaries for custom range
        document.getElementById('monthlySummary').style.display = 'grid';
        document.getElementById('categorySummarySection').style.display = 'none'; // Hide category summary for custom range
        document.getElementById('categoryTotalsSection').style.display = 'block'; // Show category totals instead
        document.getElementById('dailyTotalsSection').style.display = 'block';
        
        // Update summary cards with custom range data
        this.updateCustomRangeSummaryCards(transactions);
        this.updateCategorySummary(transactions);
        this.updateCategoryTotals(transactions);
        this.updateDailyTotals(transactions);
        
        // Update transaction list
        this.renderTransactions(transactions);
    }
    
    // Update summary cards for custom date range (different from monthly)
    updateCustomRangeSummaryCards(transactions) {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const netBalance = totalIncome - totalExpenses;
        
        // Update the summary cards with custom range data
        const monthlyIncomeEl = document.getElementById('monthlyIncome');
        const monthlyExpensesEl = document.getElementById('monthlyExpenses');
        const monthlyBalanceEl = document.getElementById('monthlyBalance');
        
        if (monthlyIncomeEl) monthlyIncomeEl.textContent = this.formatCurrency(totalIncome);
        if (monthlyExpensesEl) monthlyExpensesEl.textContent = this.formatCurrency(totalExpenses);
        if (monthlyBalanceEl) {
            monthlyBalanceEl.textContent = this.formatCurrency(Math.abs(netBalance));
            monthlyBalanceEl.className = `balance-amount ${netBalance >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Update the headers to reflect custom range instead of "Monthly"
        const monthlyIncomeHeader = document.querySelector('[data-i18n="monthly_income"]');
        const monthlyExpensesHeader = document.querySelector('[data-i18n="monthly_expenses"]');
        const monthlyBalanceHeader = document.querySelector('[data-i18n="monthly_balance"]');
        
        if (monthlyIncomeHeader) monthlyIncomeHeader.textContent = 'Period Income';
        if (monthlyExpensesHeader) monthlyExpensesHeader.textContent = 'Period Expenses';
        if (monthlyBalanceHeader) monthlyBalanceHeader.textContent = 'Period Balance';
    }
    
    // Update category totals for filtered transactions
    updateCategoryTotals(transactions) {
        const categoryTotalsSection = document.getElementById('categoryTotalsSection');
        const categoryTotalsGrid = document.getElementById('categoryTotalsGrid');
        
        if (!categoryTotalsSection || !categoryTotalsGrid) return;
        
        // Group transactions by category and calculate totals
        const categoryTotals = {};
        
        transactions.forEach(transaction => {
            const category = this.data.categories.find(c => c.id === transaction.category);
            if (!category) return;
            
            if (!categoryTotals[transaction.category]) {
                categoryTotals[transaction.category] = {
                    category: category,
                    total: 0,
                    count: 0
                };
            }
            
            categoryTotals[transaction.category].total += parseFloat(transaction.amount);
            categoryTotals[transaction.category].count += 1;
        });
        
        if (Object.keys(categoryTotals).length === 0) {
            categoryTotalsSection.style.display = 'none';
            return;
        }
        
        // Show category totals section
        categoryTotalsSection.style.display = 'block';
        
        // Clear existing content
        categoryTotalsGrid.innerHTML = '';
        
        // Sort by total amount (descending)
        const sortedCategories = Object.entries(categoryTotals)
            .sort((a, b) => b[1].total - a[1].total);
        
        sortedCategories.forEach(([categoryId, data]) => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            
            card.innerHTML = `
                <div class="stat-icon" style="background-color: ${data.category.color}20; color: ${data.category.color};">
                    ${data.category.icon}
                </div>
                <div class="stat-info">
                    <h4>${data.category.name}</h4>
                    <p class="stat-count">${data.count} transactions</p>
                    <p class="stat-value ${data.category.type}" style="font-weight: 600; color: ${data.category.type === 'expense' ? 'var(--danger-color)' : 'var(--success-color)'};">
                        ${data.category.type === 'expense' ? '-' : '+'}${this.formatCurrency(data.total)}
                    </p>
                </div>
            `;
            
            categoryTotalsGrid.appendChild(card);
        });
    }
    
    // Get transactions for custom date range
    getTransactionsForCustomRange() {
        if (!this.customDateRange.from || !this.customDateRange.to) {
            return this.data.transactions;
        }
        
        const fromDate = new Date(this.customDateRange.from);
        const toDate = new Date(this.customDateRange.to);
        
        return this.data.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= fromDate && transactionDate <= toDate;
        });
    }
    
    // Get transactions for a specific month
    getTransactionsForMonth(monthKey) {
        if (monthKey === 'all') {
            return this.data.transactions;
        }
        
        const [year, month] = monthKey.split('-');
        return this.data.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate.getFullYear() === parseInt(year) && 
                   transactionDate.getMonth() === parseInt(month) - 1;
        });
    }
    
    // Update monthly summary cards
    updateMonthlySummaryCards(transactions) {
        const monthlyIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const monthlyExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const monthlyBalance = monthlyIncome - monthlyExpenses;
        
        document.getElementById('monthlyIncome').textContent = this.formatCurrency(monthlyIncome);
        document.getElementById('monthlyExpenses').textContent = this.formatCurrency(monthlyExpenses);
        document.getElementById('monthlyBalance').textContent = this.formatCurrency(monthlyBalance);
        
        // Update balance card colors
        const balanceCard = document.getElementById('monthlyBalance').closest('.balance-card');
        balanceCard.className = 'balance-card ' + (monthlyBalance >= 0 ? 'income' : 'expense');
    }
    
    // Update category-wise summary
    updateCategorySummary(transactions) {
        const categorySummary = {};
        
        // Group transactions by category
        transactions.forEach(transaction => {
            const categoryId = transaction.category;
            if (!categorySummary[categoryId]) {
                const category = this.data.categories.find(c => c.id === categoryId) || { name: 'Unknown', icon: '❓', color: '#999999' };
                categorySummary[categoryId] = {
                    category: category,
                    count: 0,
                    total: 0,
                    type: transaction.type
                };
            }
            categorySummary[categoryId].count++;
            categorySummary[categoryId].total += parseFloat(transaction.amount);
        });
        
        // Render category summary cards
        const grid = document.getElementById('categorySummaryGrid');
        grid.innerHTML = '';
        
        if (Object.keys(categorySummary).length === 0) {
            grid.innerHTML = '<div class="empty-state"><p>No transactions for selected month</p></div>';
            return;
        }
        
        // Sort categories by total amount (descending)
        const sortedCategories = Object.entries(categorySummary)
            .sort((a, b) => b[1].total - a[1].total);
            
        sortedCategories.forEach(([categoryId, data]) => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-icon" style="background-color: ${data.category.color}20; color: ${data.category.color};">
                    ${data.category.icon}
                </div>
                <div class="stat-info">
                    <h4>${data.category.name}</h4>
                    <p class="stat-value">${data.count} transactions</p>
                    <p class="stat-value ${data.type}">${this.formatCurrency(data.total)}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    }
    
    // Update daily totals
    updateDailyTotals(transactions) {
        const dailyTotals = {};
        
        // Group transactions by date
        transactions.forEach(transaction => {
            const date = new Date(transaction.date).toLocaleDateString();
            if (!dailyTotals[date]) {
                dailyTotals[date] = {
                    totalIncome: 0,
                    totalExpense: 0,
                    incomeCategories: {},
                    expenseCategories: {},
                    transactions: []
                };
            }
            
            const amount = parseFloat(transaction.amount);
            const categoryName = this.getCategoryName(transaction.category);
            
            if (transaction.type === 'income') {
                dailyTotals[date].totalIncome += amount;
                if (!dailyTotals[date].incomeCategories[categoryName]) {
                    dailyTotals[date].incomeCategories[categoryName] = 0;
                }
                dailyTotals[date].incomeCategories[categoryName] += amount;
            } else {
                dailyTotals[date].totalExpense += amount;
                if (!dailyTotals[date].expenseCategories[categoryName]) {
                    dailyTotals[date].expenseCategories[categoryName] = 0;
                }
                dailyTotals[date].expenseCategories[categoryName] += amount;
            }
            
            dailyTotals[date].transactions.push(transaction);
        });
        
        // Render daily totals
        const list = document.getElementById('dailyTotalsList');
        list.innerHTML = '';
        
        if (Object.keys(dailyTotals).length === 0) {
            list.innerHTML = '<div class="empty-state"><p>No transactions for selected month</p></div>';
            return;
        }
        
        // Sort dates in descending order (newest first)
        const sortedDates = Object.keys(dailyTotals).sort((a, b) => new Date(b) - new Date(a));
        
        sortedDates.forEach(date => {
            const data = dailyTotals[date];
            const item = document.createElement('div');
            item.className = 'daily-total-item';
            
            // Create income category breakdown
            const incomeCategories = Object.entries(data.incomeCategories)
                .map(([category, amount]) => `${category}: +${this.formatCurrency(amount)}`)
                .join(', ');
            
            // Create expense category breakdown
            const expenseCategories = Object.entries(data.expenseCategories)
                .map(([category, amount]) => `${category}: -${this.formatCurrency(amount)}`)
                .join(', ');
            
            // Calculate net total
            const netTotal = data.totalIncome - data.totalExpense;
            
            // Create separate cards for income and expenses
            const dateContainer = document.createElement('div');
            dateContainer.className = 'daily-date-container';
            dateContainer.style.marginBottom = '1rem';
            
            // Date header
            const dateHeader = document.createElement('div');
            dateHeader.className = 'daily-date-header';
            dateHeader.style.cssText = 'font-weight: 700; font-size: 1.1rem; color: var(--text-primary); margin-bottom: 0.75rem; padding: 0.5rem; background-color: var(--bg-tertiary); border-radius: var(--border-radius); text-align: center;';
            dateHeader.innerHTML = `📅 ${date}`;
            dateContainer.appendChild(dateHeader);
            
            // Income section
            if (data.totalIncome > 0) {
                const incomeCard = document.createElement('div');
                incomeCard.className = 'daily-income-card';
                incomeCard.style.cssText = 'background-color: var(--bg-secondary); border: 2px solid var(--success-color); border-radius: var(--border-radius); padding: 1rem; margin-bottom: 0.75rem;';
                incomeCard.innerHTML = `
                    <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                        <div style="background-color: var(--success-color)20; color: var(--success-color); padding: 0.5rem; border-radius: 50%; margin-right: 0.75rem; font-size: 1.2rem;">💰</div>
                        <div>
                            <div style="font-weight: 600; color: var(--success-color); font-size: 1rem;">Daily Income</div>
                            <div style="font-size: 1.2rem; font-weight: 700; color: var(--success-color);">+${this.formatCurrency(data.totalIncome)}</div>
                        </div>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                        ${Object.entries(data.incomeCategories).map(([cat, amt]) => 
                            `<div style="margin: 0.25rem 0; padding: 0.25rem; background-color: var(--success-color)10; border-radius: 4px;">
                                ${cat}: <span style="font-weight: 600; color: var(--success-color);">+${this.formatCurrency(amt)}</span>
                            </div>`
                        ).join('')}
                    </div>
                `;
                dateContainer.appendChild(incomeCard);
            }
            
            // Expense section
            if (data.totalExpense > 0) {
                const expenseCard = document.createElement('div');
                expenseCard.className = 'daily-expense-card';
                expenseCard.style.cssText = 'background-color: var(--bg-secondary); border: 2px solid var(--danger-color); border-radius: var(--border-radius); padding: 1rem; margin-bottom: 0.75rem;';
                expenseCard.innerHTML = `
                    <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                        <div style="background-color: var(--danger-color)20; color: var(--danger-color); padding: 0.5rem; border-radius: 50%; margin-right: 0.75rem; font-size: 1.2rem;">💸</div>
                        <div>
                            <div style="font-weight: 600; color: var(--danger-color); font-size: 1rem;">Daily Expenses</div>
                            <div style="font-size: 1.2rem; font-weight: 700; color: var(--danger-color);">-${this.formatCurrency(data.totalExpense)}</div>
                        </div>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                        ${Object.entries(data.expenseCategories).map(([cat, amt]) => 
                            `<div style="margin: 0.25rem 0; padding: 0.25rem; background-color: var(--danger-color)10; border-radius: 4px;">
                                ${cat}: <span style="font-weight: 600; color: var(--danger-color);">-${this.formatCurrency(amt)}</span>
                            </div>`
                        ).join('')}
                    </div>
                `;
                dateContainer.appendChild(expenseCard);
            }
            
            // Net summary (only if both income and expenses exist)
            if (data.totalIncome > 0 && data.totalExpense > 0) {
                const netCard = document.createElement('div');
                netCard.className = 'daily-net-card';
                netCard.style.cssText = `background-color: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 0.75rem; text-align: center; font-weight: 600; color: ${netTotal >= 0 ? 'var(--success-color)' : 'var(--danger-color)'};`;
                netCard.innerHTML = `
                    <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 0.25rem;">Net Balance for ${date}</div>
                    <div style="font-size: 1.1rem; font-weight: 700;">${netTotal >= 0 ? '+' : ''}${this.formatCurrency(Math.abs(netTotal))}</div>
                `;
                dateContainer.appendChild(netCard);
            }
            
            list.appendChild(dateContainer);
        });
    }
    
    // Get category name by ID
    getCategoryName(categoryId) {
        const category = this.data.categories.find(c => c.id === categoryId);
        return category ? category.name : 'Unknown';
    }
    
    // Event Listeners Setup
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Language toggle
        document.getElementById('langToggle').addEventListener('click', () => {
            this.toggleLanguage();
        });
        
        // FAB
        document.getElementById('addTransactionFab').addEventListener('click', () => {
            this.openTransactionModal();
        });
        
        // Transaction Modal
        document.getElementById('closeTransactionModal').addEventListener('click', () => {
            this.closeTransactionModal();
        });
        
        document.getElementById('cancelTransaction').addEventListener('click', () => {
            this.closeTransactionModal();
        });
        
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });
        
        // Category Modal
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.openCategoryModal();
        });
        
        document.getElementById('closeCategoryModal').addEventListener('click', () => {
            this.closeCategoryModal();
        });
        
        document.getElementById('cancelCategory').addEventListener('click', () => {
            this.closeCategoryModal();
        });
        
        // Monthly Spending Overview Toggle
        document.getElementById('showLastSixMonthsBtn').addEventListener('click', () => {
            this.toggleMonthlySpendingView('lastSix');
        });
        
        document.getElementById('showAllMonthsBtn').addEventListener('click', () => {
            this.toggleMonthlySpendingView('all');
        });
        
        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });
        
        // Budget Modal
        document.getElementById('setBudgetBtn').addEventListener('click', () => {
            this.openBudgetModal();
        });
        
        document.getElementById('closeBudgetModal').addEventListener('click', () => {
            this.closeBudgetModal();
        });
        
        document.getElementById('cancelBudget').addEventListener('click', () => {
            this.closeBudgetModal();
        });
        
        document.getElementById('budgetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBudget();
        });
        
        // Search and Filter
        document.getElementById('searchTransactions').addEventListener('input', (e) => {
            this.filterTransactions();
        });
        
        document.getElementById('filterBtn').addEventListener('click', () => {
            this.toggleFilterPanel();
        });
        
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });
        
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });
        
        // Settings
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.data.settings.theme = e.target.value;
            this.saveData();
            this.applyTheme();
        });
        
        document.getElementById('languageSelect').addEventListener('change', (e) => {
            this.data.settings.language = e.target.value;
            this.saveData();
            this.updateLanguage();
        });
        
        document.getElementById('dailyReminder').addEventListener('change', (e) => {
            this.data.settings.dailyReminder = e.target.checked;
            this.saveData();
        });
        
        // Export/Import
        document.getElementById('exportCsvBtn').addEventListener('click', () => {
            this.exportCSV();
        });
        
        document.getElementById('exportJsonBtn').addEventListener('click', () => {
            this.exportJSON();
        });
        
        document.getElementById('importJsonBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });
        
        document.getElementById('importFileInput').addEventListener('change', (e) => {
            this.importJSON(e.target.files[0]);
        });
        
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearAllData();
        });
        
        // Receipt upload
        document.getElementById('transactionReceipt').addEventListener('change', (e) => {
            this.handleReceiptUpload(e.target.files[0]);
        });
        
        // Location tracking
        document.getElementById('getCurrentLocation').addEventListener('click', () => {
            this.getCurrentLocation();
        });
        
        // Advanced settings
        document.getElementById('locationTracking').addEventListener('change', (e) => {
            this.data.settings.locationTracking = e.target.checked;
            this.saveData();
        });
        
        document.getElementById('autoCategorize').addEventListener('change', (e) => {
            this.data.settings.autoCategorize = e.target.checked;
            this.saveData();
        });
        
        // Chart time range
        document.getElementById('chartTimeRange').addEventListener('change', (e) => {
            this.selectedTimeRange = parseInt(e.target.value);
            this.renderCharts();
        });
        
        // Export PDF
        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            this.exportPDF();
        });
        
        // View all transactions
        document.getElementById('viewAllTransactions').addEventListener('click', () => {
            this.switchTab('transactions');
        });
        
        // Close modals on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }
    
    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        this.openTransactionModal();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportCSV();
                        break;
                    case 'i':
                        e.preventDefault();
                        document.getElementById('importFileInput').click();
                        break;
                }
            } else if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    // Tab Management
    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        
        // Refresh data for specific tabs
        if (tabName === 'charts') {
            this.renderCharts();
        }
        
        // Refresh month filters when switching to transactions
        if (tabName === 'transactions') {
            this.populateMonthFilter();
        }
    }
    
    // Theme Management
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.data.settings.theme = theme;
        this.saveData();
    }
    
    applyTheme() {
        const theme = this.data.settings.theme;
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        
        document.getElementById('themeSelect').value = theme;
    }
    
    // Language Management
    toggleLanguage() {
        const currentLang = this.data.settings.language;
        const newLang = currentLang === 'en' ? 'te' : 'en';
        this.data.settings.language = newLang;
        this.saveData();
        this.updateLanguage();
    }
    
    updateLanguage() {
        const lang = this.data.settings.language;
        document.getElementById('languageSelect').value = lang;
        
        // Update all translatable elements
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (this.translations[lang] && this.translations[lang][key]) {
                element.textContent = this.translations[lang][key];
            }
        });
        
        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (this.translations[lang] && this.translations[lang][key]) {
                element.placeholder = this.translations[lang][key];
            }
        });
    }
    
    // Translation Dictionary
    translations = {
        en: {
            app_title: 'Budget Tracker',
            nav_dashboard: 'Dashboard',
            nav_transactions: 'Transactions',
            nav_categories: 'Categories',
            nav_charts: 'Charts',
            nav_settings: 'Settings',
            total_income: 'Total Income',
            total_expenses: 'Total Expenses',
            current_balance: 'Current Balance',
            budget_limits: 'Budget Limits',
            set_budget: 'Set Budget',
            no_budget_set: 'No budget limits set',
            quick_stats: 'Quick Stats',
            this_month: 'This Month',
            avg_daily: 'Daily Average',
            top_category: 'Top Category',
            recent_transactions: 'Recent Transactions',
            view_all: 'View All',
            no_transactions: 'No transactions yet. Add your first transaction!',
            monthly_view: 'Monthly View',
            monthly_income: 'Monthly Income',
            monthly_expenses: 'Monthly Expenses',
            monthly_balance: 'Net Balance',
            category_summary: 'Category Summary',
            daily_totals: 'Daily Totals',
            search_placeholder: 'Search transactions...',
            filter_category: 'Category:',
            all_categories: 'All Categories',
            filter_date_from: 'From:',
            filter_date_to: 'To:',
            clear_filters: 'Clear',
            apply_filters: 'Apply',
            manage_categories: 'Manage Categories',
            add_category: 'Add Category',
            no_categories: 'No categories yet. Create your first category!',
            time_range: 'Time Range:',
            last_7_days: 'Last 7 Days',
            last_30_days: 'Last 30 Days',
            last_3_months: 'Last 3 Months',
            last_year: 'Last Year',
            chart_month_filter: 'Month:',
            expense_distribution: 'Expense Distribution',
            category_spending: 'Category Spending',
            monthly_summary: 'Monthly Summary',
            spending_trends: 'Spending Trends',
            daily_expenses: 'Daily Expenses',
            appearance: 'Appearance',
            theme: 'Theme:',
            theme_auto: 'Auto',
            theme_light: 'Light',
            theme_dark: 'Dark',
            language: 'Language:',
            preferences: 'Preferences',
            daily_reminder: 'Daily Reminder:',
            location_tracking: 'Location Tracking:',
            auto_categorize: 'Auto Categorize:',
            data_management: 'Data Management',
            export_csv: 'Export CSV',
            export_json: 'Export JSON',
            export_pdf: 'Export PDF',
            import_json: 'Import JSON',
            clear_data: 'Clear All Data',
            about: 'About',
            version: 'Version:',
            install_date: 'Install Date:',
            total_transactions: 'Total Transactions:',
            add_transaction: 'Add Transaction',
            description: 'Description:',
            amount: 'Amount:',
            type: 'Type:',
            expense: 'Expense',
            income: 'Income',
            category: 'Category:',
            date: 'Date:',
            notes: 'Notes:',
            receipt: 'Receipt:',
            location: 'Location:',
            get_location: 'Get Current Location',
            cancel: 'Cancel',
            save: 'Save',
            name: 'Name:',
            icon: 'Icon:',
            color: 'Color:',
            budget_amount: 'Budget Amount:',
            period: 'Period:',
            monthly: 'Monthly',
            weekly: 'Weekly',
            yearly: 'Yearly'
        },
        te: {
            app_title: 'బడ్జెట్ ట్రాకర్',
            nav_dashboard: 'డాష్‌బోర్డ్',
            nav_transactions: 'లావాదేవీలు',
            nav_categories: 'వర్గాలు',
            nav_charts: 'చార్టులు',
            nav_settings: 'సెట్టింగులు',
            total_income: 'మొత్తం ఆదాయం',
            total_expenses: 'మొత్తం ఖర్చులు',
            current_balance: 'ప్రస్తుత బ్యాలెన్స్',
            budget_limits: 'బడ్జెట్ పరిమితులు',
            set_budget: 'బడ్జెట్ సెట్ చేయండి',
            no_budget_set: 'బడ్జెట్ పరిమితులు సెట్ చేయలేదు',
            quick_stats: 'త్వరిత గణాంకాలు',
            this_month: 'ఈ నెల',
            avg_daily: 'రోజువారీ సగటు',
            top_category: 'టాప్ కేటగరీ',
            recent_transactions: 'ఇటీవలి లావాదేవీలు',
            view_all: 'అన్నీ చూడండి',
            no_transactions: 'ఇంకా లావాదేవీలు లేవు. మీ మొదటి లావాదేవీని జోడించండి!',
            search_placeholder: 'లావాదేవీలను వెతకండి...',
            filter_category: 'వర్గం:',
            all_categories: 'అన్ని వర్గాలు',
            filter_date_from: 'నుంచి:',
            filter_date_to: 'వరకు:',
            clear_filters: 'క్లియర్',
            apply_filters: 'వర్తింపజేయండి',
            manage_categories: 'వర్గాలను నిర్వహించండి',
            add_category: 'వర్గం జోడించండి',
            no_categories: 'ఇంకా వర్గాలు లేవు. మీ మొదటి వర్గాన్ని సృష్టించండి!',
            appearance: 'రూపం',
            theme: 'థీమ్:',
            theme_auto: 'ఆటో',
            theme_light: 'లైట్',
            theme_dark: 'డార్క్',
            language: 'భాష:',
            add_transaction: 'లావాదేవీ జోడించండి',
            description: 'వివరణ:',
            amount: 'మొత్తం:',
            type: 'రకం:',
            expense: 'ఖర్చు',
            income: 'ఆదాయం',
            category: 'వర్గం:',
            date: 'తేదీ:',
            notes: 'గమనికలు:',
            cancel: 'రద్దు',
            save: 'సేవ్'
        }
    };
    
    // Transaction Management
    openTransactionModal() {
        document.getElementById('transactionModal').classList.add('active');
        this.populateTransactionCategories();
        
        // Set default date to today
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        
        // Clear form if not editing
        if (!this.currentEditingTransaction) {
            document.getElementById('transactionForm').reset();
            document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        }
    }
    
    closeTransactionModal() {
        document.getElementById('transactionModal').classList.remove('active');
        this.currentEditingTransaction = null;
        document.getElementById('transactionForm').reset();
    }
    
    populateTransactionCategories() {
        const select = document.getElementById('transactionCategory');
        const type = document.getElementById('transactionType').value;
        
        select.innerHTML = '';
        
        const filteredCategories = this.data.categories.filter(cat => cat.type === type);
        filteredCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.icon} ${category.name}`;
            select.appendChild(option);
        });
        
        // Update categories when type changes
        document.getElementById('transactionType').addEventListener('change', () => {
            this.populateTransactionCategories();
        });
    }
    
    saveTransaction() {
        const form = document.getElementById('transactionForm');
        const formData = new FormData(form);
        
        const transaction = {
            id: this.currentEditingTransaction ? this.currentEditingTransaction.id : this.generateId(),
            description: document.getElementById('transactionDescription').value,
            amount: parseFloat(document.getElementById('transactionAmount').value),
            type: document.getElementById('transactionType').value,
            category: document.getElementById('transactionCategory').value,
            date: document.getElementById('transactionDate').value,
            notes: document.getElementById('transactionNotes').value || '',
            location: document.getElementById('transactionLocation').value || '',
            timestamp: new Date().toISOString()
        };
        
        if (this.currentEditingTransaction) {
            // Update existing transaction
            const index = this.data.transactions.findIndex(t => t.id === this.currentEditingTransaction.id);
            if (index !== -1) {
                this.data.transactions[index] = transaction;
            }
        } else {
            // Add new transaction
            this.data.transactions.push(transaction);
        }
        
        this.saveData();
        this.updateDashboard();
        this.renderTransactions();
        this.renderCharts();
        this.closeTransactionModal();
        this.populateMonthFilter(); // Update month filter when new transaction is added
        this.showToast('Transaction saved successfully!', 'success');
    }
    
    deleteTransaction(transactionId) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.data.transactions = this.data.transactions.filter(t => t.id !== transactionId);
            this.saveData();
            this.updateDashboard();
            this.renderTransactions();
            this.renderCharts();
            this.populateMonthFilter(); // Update month filter when transaction is deleted
            this.showToast('Transaction deleted successfully!', 'success');
        }
    }
    
    editTransaction(transactionId) {
        const transaction = this.data.transactions.find(t => t.id === transactionId);
        if (!transaction) return;
        
        this.currentEditingTransaction = transaction;
        
        // Populate form
        document.getElementById('transactionDescription').value = transaction.description;
        document.getElementById('transactionAmount').value = transaction.amount;
        document.getElementById('transactionType').value = transaction.type;
        document.getElementById('transactionDate').value = transaction.date;
        document.getElementById('transactionNotes').value = transaction.notes || '';
        document.getElementById('transactionLocation').value = transaction.location || '';
        
        this.populateTransactionCategories();
        document.getElementById('transactionCategory').value = transaction.category;
        
        this.openTransactionModal();
    }
    
    // Category Management
    openCategoryModal() {
        document.getElementById('categoryModal').classList.add('active');
        
        if (!this.currentEditingCategory) {
            document.getElementById('categoryForm').reset();
            document.getElementById('categoryColor').value = '#2196F3';
        }
    }
    
    closeCategoryModal() {
        document.getElementById('categoryModal').classList.remove('active');
        this.currentEditingCategory = null;
        document.getElementById('categoryForm').reset();
    }
    
    saveCategory() {
        const category = {
            id: this.currentEditingCategory ? this.currentEditingCategory.id : this.generateId(),
            name: document.getElementById('categoryName').value,
            icon: document.getElementById('categoryIcon').value || '📝',
            color: document.getElementById('categoryColor').value,
            type: document.getElementById('categoryType').value
        };
        
        if (this.currentEditingCategory) {
            // Update existing category
            const index = this.data.categories.findIndex(c => c.id === this.currentEditingCategory.id);
            if (index !== -1) {
                this.data.categories[index] = category;
            }
        } else {
            // Add new category
            this.data.categories.push(category);
        }
        
        this.saveData();
        this.renderCategories();
        this.closeCategoryModal();
        this.showToast('Category saved successfully!', 'success');
    }
    
    deleteCategory(categoryId) {
        // Check if category is used in transactions
        const hasTransactions = this.data.transactions.some(t => t.category === categoryId);
        
        if (hasTransactions) {
            alert('Cannot delete category that has transactions. Please reassign or delete the transactions first.');
            return;
        }
        
        if (confirm('Are you sure you want to delete this category?')) {
            this.data.categories = this.data.categories.filter(c => c.id !== categoryId);
            delete this.data.budgets[categoryId];
            this.saveData();
            this.renderCategories();
            this.showToast('Category deleted successfully!', 'success');
        }
    }
    
    editCategory(categoryId) {
        const category = this.data.categories.find(c => c.id === categoryId);
        if (!category) return;
        
        this.currentEditingCategory = category;
        
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryIcon').value = category.icon;
        document.getElementById('categoryColor').value = category.color;
        document.getElementById('categoryType').value = category.type;
        
        this.openCategoryModal();
    }
    
    // Budget Management
    openBudgetModal() {
        document.getElementById('budgetModal').classList.add('active');
        this.populateBudgetCategories();
    }
    
    closeBudgetModal() {
        document.getElementById('budgetModal').classList.remove('active');
        document.getElementById('budgetForm').reset();
    }
    
    populateBudgetCategories() {
        const select = document.getElementById('budgetCategory');
        select.innerHTML = '';
        
        // Only expense categories can have budgets
        const expenseCategories = this.data.categories.filter(cat => cat.type === 'expense');
        expenseCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.icon} ${category.name}`;
            select.appendChild(option);
        });
    }
    
    saveBudget() {
        const categoryId = document.getElementById('budgetCategory').value;
        const amount = parseFloat(document.getElementById('budgetAmount').value);
        const period = document.getElementById('budgetPeriod').value;
        
        this.data.budgets[categoryId] = {
            amount: amount,
            period: period,
            createdAt: new Date().toISOString()
        };
        
        this.saveData();
        this.updateDashboard();
        this.closeBudgetModal();
        this.showToast('Budget saved successfully!', 'success');
    }
    
    // Dashboard Updates
    updateDashboard() {
        this.updateBalanceCards();
        this.updateBudgetProgress();
        this.updateQuickStats();
        this.updateRecentTransactions();
    }
    
    updateBalanceCards() {
        const income = this.data.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const expenses = this.data.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const balance = income - expenses;
        
        document.getElementById('totalIncome').textContent = this.formatCurrency(income);
        document.getElementById('totalExpenses').textContent = this.formatCurrency(expenses);
        document.getElementById('currentBalance').textContent = this.formatCurrency(balance);
    }
    
    updateBudgetProgress() {
        const container = document.getElementById('budgetProgress');
        
        if (Object.keys(this.data.budgets).length === 0) {
            container.innerHTML = '<p data-i18n="no_budget_set">No budget limits set</p>';
            return;
        }
        
        container.innerHTML = '';
        
        Object.entries(this.data.budgets).forEach(([categoryId, budget]) => {
            const category = this.data.categories.find(c => c.id === categoryId);
            if (!category) return;
            
            // Calculate spent amount for this category this month
            const now = new Date();
            const thisMonth = this.data.transactions.filter(t => {
                const tDate = new Date(t.date);
                return t.category === categoryId && 
                       t.type === 'expense' &&
                       tDate.getMonth() === now.getMonth() &&
                       tDate.getFullYear() === now.getFullYear();
            });
            
            const spent = thisMonth.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const percentage = Math.min((spent / budget.amount) * 100, 100);
            
            let progressClass = 'budget-progress-fill';
            if (percentage > 80) progressClass += ' danger';
            else if (percentage > 60) progressClass += ' warning';
            
            const item = document.createElement('div');
            item.className = 'budget-item';
            item.innerHTML = `
                <span>${category.icon} ${category.name}</span>
                <div class="budget-bar">
                    <div class="${progressClass}" style="width: ${percentage}%"></div>
                </div>
                <span>${this.formatCurrency(spent)} / ${this.formatCurrency(budget.amount)}</span>
            `;
            
            container.appendChild(item);
        });
    }
    
    updateQuickStats() {
        const now = new Date();
        const thisMonth = this.data.transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === now.getMonth() &&
                   tDate.getFullYear() === now.getFullYear();
        });
        
        const thisMonthExpenses = thisMonth
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const dailyAvg = thisMonth.length > 0 ? thisMonthExpenses / now.getDate() : 0;
        
        // Get top category
        const categoryTotals = {};
        thisMonth.filter(t => t.type === 'expense').forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
        });
        
        const topCategoryId = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b, '');
        const topCategory = topCategoryId ? this.data.categories.find(c => c.id === topCategoryId) : null;
        
        document.getElementById('thisMonthExpenses').textContent = this.formatCurrency(thisMonthExpenses);
        document.getElementById('dailyAverage').textContent = this.formatCurrency(dailyAvg);
        document.getElementById('topCategory').textContent = topCategory ? topCategory.name : 'None';
    }
    
    updateRecentTransactions() {
        const container = document.getElementById('recentTransactionsList');
        const recentTransactions = this.data.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
            
        if (recentTransactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p data-i18n="no_transactions">No transactions yet. Add your first transaction!</p></div>';
            return;
        }
        
        container.innerHTML = '';
        recentTransactions.forEach(transaction => {
            const category = this.data.categories.find(c => c.id === transaction.category);
            const item = document.createElement('div');
            item.className = 'transaction-item';
            
            item.innerHTML = `
                <div class="transaction-icon" style="background-color: ${category?.color}20; color: ${category?.color};">
                    ${category?.icon || '📝'}
                </div>
                <div class="transaction-info">
                    <div class="transaction-title">${transaction.description}</div>
                    <div class="transaction-details">${new Date(transaction.date).toLocaleDateString()} • ${category?.name || 'Unknown'}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="icon-btn" onclick="app.editTransaction('${transaction.id}')" title="Edit">✏️</button>
                    <button class="icon-btn" onclick="app.deleteTransaction('${transaction.id}')" title="Delete">🗑️</button>
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    // Render Functions
    renderTransactions(transactionsToRender = null) {
        const container = document.getElementById('transactionsList');
        const transactions = transactionsToRender || this.data.transactions;
        
        if (transactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p data-i18n="no_transactions">No transactions found</p></div>';
            return;
        }
        
        // Sort by date (newest first)
        const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        container.innerHTML = '';
        sortedTransactions.forEach(transaction => {
            const category = this.data.categories.find(c => c.id === transaction.category);
            const item = document.createElement('div');
            item.className = 'transaction-item';
            
            item.innerHTML = `
                <div class="transaction-icon" style="background-color: ${category?.color}20; color: ${category?.color};">
                    ${category?.icon || '📝'}
                </div>
                <div class="transaction-info">
                    <div class="transaction-title">${transaction.description}</div>
                    <div class="transaction-details">${new Date(transaction.date).toLocaleDateString()} • ${category?.name || 'Unknown'}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="icon-btn" onclick="app.editTransaction('${transaction.id}')" title="Edit">✏️</button>
                    <button class="icon-btn" onclick="app.deleteTransaction('${transaction.id}')" title="Delete">🗑️</button>
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    renderCategories() {
        const container = document.getElementById('categoriesGrid');
        
        if (this.data.categories.length === 0) {
            container.innerHTML = '<div class="empty-state"><p data-i18n="no_categories">No categories yet. Create your first category!</p></div>';
            return;
        }
        
        // Render monthly spending overview first
        this.renderMonthlySpendingOverview('lastSix');
        
        container.innerHTML = '';
        this.data.categories.forEach(category => {
            const categoryTransactions = this.data.transactions.filter(t => t.category === category.id);
            const transactionCount = categoryTransactions.length;
            
            // Calculate total amount spent in this category
            const totalAmount = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
            const card = document.createElement('div');
            card.className = 'category-card';
            
            card.innerHTML = `
                <div class="category-icon" style="background-color: ${category.color}20; color: ${category.color};">
                    ${category.icon}
                </div>
                <div class="category-info">
                    <h3>${category.name}</h3>
                    <div class="category-details">${category.type} • ${transactionCount} transactions</div>
                    <div class="category-total" style="font-weight: 600; color: ${category.type === 'expense' ? 'var(--danger-color)' : 'var(--success-color)'}; margin-top: 0.25rem;">
                        Total: ${category.type === 'expense' ? '-' : '+'}${this.formatCurrency(totalAmount)}
                    </div>
                </div>
                <div class="category-actions">
                    <button class="icon-btn" onclick="app.editCategory('${category.id}')" title="Edit">✏️</button>
                    <button class="icon-btn" onclick="app.deleteCategory('${category.id}')" title="Delete">🗑️</button>
                </div>
            `;
            
            container.appendChild(card);
        });
    }
    
    // Toggle monthly spending overview view
    toggleMonthlySpendingView(viewType) {
        const lastSixBtn = document.getElementById('showLastSixMonthsBtn');
        const allBtn = document.getElementById('showAllMonthsBtn');
        
        if (viewType === 'lastSix') {
            lastSixBtn.classList.add('active');
            allBtn.classList.remove('active');
        } else {
            lastSixBtn.classList.remove('active');
            allBtn.classList.add('active');
        }
        
        this.renderMonthlySpendingOverview(viewType);
    }
    
    // Render monthly spending overview
    renderMonthlySpendingOverview(viewType = 'lastSix') {
        const container = document.getElementById('monthlySpendingGrid');
        if (!container) return;
        
        // Calculate monthly totals
        const monthlyTotals = {};
        
        this.data.transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyTotals[monthKey]) {
                monthlyTotals[monthKey] = {
                    income: 0,
                    expense: 0,
                    net: 0
                };
            }
            
            const amount = parseFloat(transaction.amount);
            if (transaction.type === 'income') {
                monthlyTotals[monthKey].income += amount;
            } else {
                monthlyTotals[monthKey].expense += amount;
            }
            monthlyTotals[monthKey].net = monthlyTotals[monthKey].income - monthlyTotals[monthKey].expense;
        });
        
        // Filter months based on view type
        let sortedMonths = Object.keys(monthlyTotals).sort().reverse();
        
        if (viewType === 'lastSix') {
            sortedMonths = sortedMonths.slice(0, 6);
        }
        
        if (sortedMonths.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No transactions found</p></div>';
            return;
        }
        
        container.innerHTML = '';
        sortedMonths.forEach(monthKey => {
            const data = monthlyTotals[monthKey];
            const [year, month] = monthKey.split('-');
            const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
            });
            
            const card = document.createElement('div');
            card.className = 'stat-card monthly-spending-card';
            
            card.innerHTML = `
                <div class="stat-icon" style="background-color: var(--primary-color)20; color: var(--primary-color);">
                    📅
                </div>
                <div class="stat-info">
                    <h4>${monthName}</h4>
                    <div class="monthly-breakdown" style="margin-top: 0.5rem;">
                        <div class="income-line" style="color: var(--success-color); font-size: 0.9rem;">
                            Income: +${this.formatCurrency(data.income)}
                        </div>
                        <div class="expense-line" style="color: var(--danger-color); font-size: 0.9rem;">
                            Expenses: -${this.formatCurrency(data.expense)}
                        </div>
                        <div class="net-line" style="font-weight: 600; margin-top: 0.25rem; color: ${data.net >= 0 ? 'var(--success-color)' : 'var(--danger-color)'};">
                            Net: ${data.net >= 0 ? '+' : ''}${this.formatCurrency(Math.abs(data.net))}
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    }
    
    // Charts
    renderCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }
        
        this.renderPieChart();
        this.renderCategoryBarChart();
        this.renderBarChart();
        this.renderLineChart();
        this.renderDailyExpensesChart();
    }
    
    renderPieChart() {
        const ctx = document.getElementById('pieChart');
        if (!ctx) return;
        
        if (this.charts.pie) {
            this.charts.pie.destroy();
        }
        
        const chartMonthFilter = document.getElementById('chartMonthFilter');
        const selectedMonth = chartMonthFilter ? chartMonthFilter.value : 'all';
        const transactions = this.getTransactionsForMonth(selectedMonth);
        
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        
        if (expenseTransactions.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }
        
        const categoryTotals = {};
        expenseTransactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
        });
        
        const labels = [];
        const data = [];
        const colors = [];
        
        Object.entries(categoryTotals).forEach(([categoryId, total]) => {
            const category = this.data.categories.find(c => c.id === categoryId);
            if (category) {
                labels.push(category.name);
                data.push(total);
                colors.push(category.color);
            }
        });
        
        this.charts.pie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color + '80'),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    renderCategoryBarChart() {
        const ctx = document.getElementById('categoryBarChart');
        if (!ctx) return;
        
        if (this.charts.categoryBar) {
            this.charts.categoryBar.destroy();
        }
        
        const chartMonthFilter = document.getElementById('chartMonthFilter');
        const selectedMonth = chartMonthFilter ? chartMonthFilter.value : 'all';
        const transactions = this.getTransactionsForMonth(selectedMonth);
        
        const categoryTotals = {};
        transactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
        });
        
        const labels = [];
        const data = [];
        const colors = [];
        
        Object.entries(categoryTotals).forEach(([categoryId, total]) => {
            const category = this.data.categories.find(c => c.id === categoryId);
            if (category) {
                labels.push(category.name);
                data.push(total);
                colors.push(category.color);
            }
        });
        
        this.charts.categoryBar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Amount',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    renderBarChart() {
        const ctx = document.getElementById('barChart');
        if (!ctx) return;
        
        if (this.charts.bar) {
            this.charts.bar.destroy();
        }
        
        // Get last 6 months data
        const months = [];
        const incomeData = [];
        const expenseData = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthTransactions = this.getTransactionsForMonth(monthKey);
            
            const income = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                
            const expenses = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                
            months.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
            incomeData.push(income);
            expenseData.push(expenses);
        }
        
        this.charts.bar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: '#4CAF50',
                        borderColor: '#4CAF50',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: '#F44336',
                        borderColor: '#F44336',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    renderLineChart() {
        const ctx = document.getElementById('lineChart');
        if (!ctx) return;
        
        if (this.charts.line) {
            this.charts.line.destroy();
        }
        
        const chartMonthFilter = document.getElementById('chartMonthFilter');
        const selectedMonth = chartMonthFilter ? chartMonthFilter.value : 'all';
        const transactions = this.getTransactionsForMonth(selectedMonth);
        
        // Group by date and calculate cumulative spending
        const dailyTotals = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const date = t.date;
            dailyTotals[date] = (dailyTotals[date] || 0) + parseFloat(t.amount);
        });
        
        const sortedDates = Object.keys(dailyTotals).sort();
        const labels = [];
        const data = [];
        let cumulative = 0;
        
        sortedDates.forEach(date => {
            cumulative += dailyTotals[date];
            labels.push(new Date(date).toLocaleDateString());
            data.push(cumulative);
        });
        
        this.charts.line = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cumulative Expenses',
                    data: data,
                    borderColor: '#2196F3',
                    backgroundColor: '#2196F3',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    renderDailyExpensesChart() {
        const ctx = document.getElementById('dailyExpensesChart');
        if (!ctx) return;
        
        if (this.charts.dailyExpenses) {
            this.charts.dailyExpenses.destroy();
        }
        
        const chartMonthFilter = document.getElementById('chartMonthFilter');
        const selectedMonth = chartMonthFilter ? chartMonthFilter.value : 'all';
        const transactions = this.getTransactionsForMonth(selectedMonth);
        
        // Group expenses by date
        const dailyExpenses = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const date = t.date;
            dailyExpenses[date] = (dailyExpenses[date] || 0) + parseFloat(t.amount);
        });
        
        const sortedDates = Object.keys(dailyExpenses).sort();
        const labels = sortedDates.map(date => new Date(date).toLocaleDateString());
        const data = sortedDates.map(date => dailyExpenses[date]);
        
        this.charts.dailyExpenses = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Expenses',
                    data: data,
                    borderColor: '#FF9800',
                    backgroundColor: '#FF9800',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Filter and Search
    toggleFilterPanel() {
        const panel = document.getElementById('filterPanel');
        const button = document.getElementById('filterBtn');
        
        panel.classList.toggle('active');
        button.classList.toggle('active');
        
        if (panel.classList.contains('active')) {
            this.populateFilterCategories();
        }
    }
    
    populateFilterCategories() {
        const select = document.getElementById('filterCategory');
        select.innerHTML = '<option value="" data-i18n="all_categories">All Categories</option>';
        
        this.data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.icon} ${category.name}`;
            select.appendChild(option);
        });
    }
    
    applyFilters() {
        const category = document.getElementById('filterCategory').value;
        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;
        
        let filtered = [...this.data.transactions];
        
        if (category) {
            filtered = filtered.filter(t => t.category === category);
        }
        
        if (dateFrom) {
            filtered = filtered.filter(t => t.date >= dateFrom);
        }
        
        if (dateTo) {
            filtered = filtered.filter(t => t.date <= dateTo);
        }
        
        this.renderTransactions(filtered);
        this.toggleFilterPanel();
    }
    
    clearFilters() {
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        
        this.renderTransactions();
        this.toggleFilterPanel();
    }
    
    filterTransactions() {
        const query = document.getElementById('searchTransactions').value.toLowerCase();
        
        if (!query) {
            // Refresh current filter view
            this.updateFilterView();
            return;
        }
        
        // Get base transactions based on current filter mode
        let baseTransactions;
        if (this.filterMode === 'monthly') {
            baseTransactions = this.getTransactionsForMonth(this.selectedMonth);
        } else if (this.filterMode === 'custom') {
            baseTransactions = this.getTransactionsForCustomRange();
        } else {
            baseTransactions = this.data.transactions;
        }
        
        const filtered = baseTransactions.filter(t => {
            const category = this.data.categories.find(c => c.id === t.category);
            return t.description.toLowerCase().includes(query) ||
                   (category && category.name.toLowerCase().includes(query)) ||
                   (t.notes && t.notes.toLowerCase().includes(query));
        });
        
        this.renderTransactions(filtered);
    }
    
    // Export/Import Functions
    exportCSV() {
        const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Notes'];
        const rows = [headers];
        
        this.data.transactions.forEach(t => {
            const category = this.data.categories.find(c => c.id === t.category);
            rows.push([
                t.date,
                t.description,
                category ? category.name : 'Unknown',
                t.type,
                t.amount,
                t.notes || ''
            ]);
        });
        
        const csvContent = rows.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
        
        this.downloadFile(csvContent, 'budget-tracker-export.csv', 'text/csv');
        this.showToast('Data exported successfully!', 'success');
    }
    
    exportJSON() {
        const dataToExport = {
            exportDate: new Date().toISOString(),
            version: '1.0.0',
            data: this.data
        };
        
        const jsonContent = JSON.stringify(dataToExport, null, 2);
        this.downloadFile(jsonContent, 'budget-tracker-export.json', 'application/json');
        this.showToast('Data exported successfully!', 'success');
    }
    
    importJSON(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                
                if (imported.data && imported.data.transactions && imported.data.categories) {
                    const confirmed = confirm(
                        'This will replace all your current data. Are you sure you want to continue?'
                    );
                    
                    if (confirmed) {
                        this.data = imported.data;
                        this.saveData();
                        this.updateDashboard();
                        this.renderTransactions();
                        this.renderCategories();
                        this.renderCharts();
                        this.populateMonthFilter();
                        this.showToast('Data imported successfully!', 'success');
                    }
                } else {
                    this.showToast('Invalid file format!', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showToast('Error importing file!', 'error');
            }
        };
        
        reader.readAsText(file);
    }
    
    exportPDF() {
        // Basic PDF export - you might want to use a library like jsPDF for better formatting
        const content = `
BUDGET TRACKER REPORT
Generated: ${new Date().toLocaleDateString()}

SUMMARY:
Total Income: ${this.formatCurrency(this.data.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0))}
Total Expenses: ${this.formatCurrency(this.data.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0))}

TRANSACTIONS:
${this.data.transactions.map(t => {
    const category = this.data.categories.find(c => c.id === t.category);
    return `${t.date} - ${t.description} - ${category ? category.name : 'Unknown'} - ${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}`;
}).join('\n')}
        `;
        
        this.downloadFile(content, 'budget-tracker-report.txt', 'text/plain');
        this.showToast('Report exported successfully!', 'success');
    }
    
    clearAllData() {
        const confirmed = confirm(
            'This will permanently delete all your data. This action cannot be undone. Are you sure?'
        );
        
        if (confirmed) {
            const doubleConfirmed = confirm(
                'Are you absolutely sure? All transactions, categories, and budgets will be lost forever.'
            );
            
            if (doubleConfirmed) {
                localStorage.removeItem('budgetTrackerData');
                location.reload();
            }
        }
    }
    
    // Helper Functions
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        
        this.currentEditingTransaction = null;
        this.currentEditingCategory = null;
    }
    
    // Receipt handling
    handleReceiptUpload(file) {
        if (!file) return;
        
        // For now, just show a success message
        // In a real app, you might want to store the image or extract text
        this.showToast('Receipt uploaded successfully!', 'success');
    }
    
    // Location services
    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showToast('Geolocation is not supported by this browser.', 'error');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                document.getElementById('transactionLocation').value = `${lat}, ${lng}`;
                this.showToast('Location retrieved successfully!', 'success');
            },
            (error) => {
                console.error('Geolocation error:', error);
                this.showToast('Unable to retrieve location.', 'error');
            }
        );
    }
    
    // Daily reminder
    showDailyReminder() {
        if (!this.data.settings.dailyReminder) return;
        
        const lastReminder = localStorage.getItem('lastDailyReminder');
        const today = new Date().toDateString();
        
        if (lastReminder !== today) {
            setTimeout(() => {
                if (confirm('Daily Reminder: Have you recorded your expenses today?')) {
                    this.openTransactionModal();
                }
                localStorage.setItem('lastDailyReminder', today);
            }, 2000);
        }
    }
    
    // Service Worker registration
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }
    
    // App info
    updateAppInfo() {
        document.getElementById('appVersion').textContent = '1.0.0';
        document.getElementById('installDate').textContent = new Date(this.data.settings.installationDate).toLocaleDateString();
        document.getElementById('totalTransactions').textContent = this.data.transactions.length;
    }
}

// Initialize the app
const app = new BudgetTracker();