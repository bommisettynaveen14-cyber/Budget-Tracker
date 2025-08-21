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
            recent_transactions: 'Recent Transactions',
            view_all: 'View All',
            no_transactions: 'No transactions yet. Add your first transaction!',
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
            expense_distribution: 'Expense Distribution',
            monthly_summary: 'Monthly Summary',
            appearance: 'Appearance',
            theme: 'Theme:',
            theme_auto: 'Auto',
            theme_light: 'Light',
            theme_dark: 'Dark',
            language: 'Language:',
            notifications: 'Notifications',
            daily_reminder: 'Daily Reminder:',
            data_management: 'Data Management',
            export_csv: 'Export CSV',
            export_json: 'Export JSON',
            import_json: 'Import JSON',
            clear_data: 'Clear All Data',
            add_transaction: 'Add Transaction',
            edit_transaction: 'Edit Transaction',
            amount: 'Amount:',
            type: 'Type:',
            income: 'Income',
            expense: 'Expense',
            category: 'Category:',
            select_category: 'Select Category',
            date: 'Date:',
            notes: 'Notes:',
            tags: 'Tags:',
            tags_placeholder: 'Separate with commas',
            receipt: 'Receipt Image:',
            location: 'Location (Optional):',
            location_placeholder: 'Enter location or use GPS',
            get_location: '📍 GPS',
            cancel: 'Cancel',
            save: 'Save',
            name: 'Name:',
            icon: 'Icon (Emoji):',
            color: 'Color:',
            set_budget_limits: 'Set Budget Limits',
            weekly_budget: 'Weekly Budget:',
            monthly_budget: 'Monthly Budget:',
            quick_stats: 'Quick Stats',
            this_month: 'This Month',
            avg_daily: 'Daily Average',
            top_category: 'Top Category',
            time_range: 'Time Range:',
            last_7_days: 'Last 7 Days',
            last_30_days: 'Last 30 Days',
            last_3_months: 'Last 3 Months',
            last_year: 'Last Year',
            spending_trends: 'Spending Trends',
            category_comparison: 'Category Comparison',
            advanced_features: 'Advanced Features',
            location_tracking: 'Location Tracking:',
            auto_categorize: 'Auto-categorize Similar Transactions:',
            export_pdf: 'Export PDF Report',
            app_info: 'App Information',
            version: 'Version:',
            storage_used: 'Storage Used:',
            total_transactions: 'Total Transactions:',
            installation_date: 'Installation Date:'
        },
        te: {
            app_title: 'బడ్జెట్ ట్రాకర్',
            nav_dashboard: 'డాష్బోర్డ్',
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
            recent_transactions: 'ఇటీవలి లావాదేవీలు',
            view_all: 'అన్నీ చూడండి',
            no_transactions: 'ఇంకా లావాదేవీలు లేవు. మీ మొదటి లావాదేవీని జోడించండి!',
            search_placeholder: 'లావాదేవీలను వెతకండి...',
            filter_category: 'వర్గం:',
            all_categories: 'అన్ని వర్గాలు',
            filter_date_from: 'నుండి:',
            filter_date_to: 'వరకు:',
            clear_filters: 'క్లియర్',
            apply_filters: 'వర్తింపజేయండి',
            manage_categories: 'వర్గాలను నిర్వహించండి',
            add_category: 'వర్గం జోడించండి',
            no_categories: 'ఇంకా వర్గాలు లేవు. మీ మొదటి వర్గాన్ని సృష్టించండి!',
            expense_distribution: 'ఖర్చుల పంపిణీ',
            monthly_summary: 'నెలవారీ సారాంశం',
            appearance: 'రూపాన్ని',
            theme: 'థీమ్:',
            theme_auto: 'ఆటో',
            theme_light: 'లైట్',
            theme_dark: 'డార్క్',
            language: 'భాష:',
            notifications: 'నోటిఫికేషన్లు',
            daily_reminder: 'రోజువారీ రిమైండర్:',
            data_management: 'డేటా నిర్వహణ',
            export_csv: 'CSV ఎగుమతి',
            export_json: 'JSON ఎగుమతి',
            import_json: 'JSON దిగుమతి',
            clear_data: 'అన్ని డేటాను క్లియర్ చేయండి',
            add_transaction: 'లావాదేవీ జోడించండి',
            edit_transaction: 'లావాదేవీని సవరించండి',
            amount: 'మొత్తం:',
            type: 'రకం:',
            income: 'ఆదాయం',
            expense: 'ఖర్చు',
            category: 'వర్గం:',
            select_category: 'వర్గాన్ని ఎంచుకోండి',
            date: 'తేదీ:',
            notes: 'గమనికలు:',
            tags: 'ట్యాగులు:',
            tags_placeholder: 'కామాలతో వేరు చేయండి',
            receipt: 'రసీదు చిత్రం:',
            cancel: 'రద్దు చేయండి',
            save: 'భద్రపరచండి',
            name: 'పేరు:',
            icon: 'చిహ్నం (ఎమోజి):',
            color: 'రంగు:',
            set_budget_limits: 'బడ్జెట్ పరిమితులను సెట్ చేయండి',
            weekly_budget: 'వారపు బడ్జెట్:',
            monthly_budget: 'నెలవారీ బడ్జెట్:',
            location: 'స్థానం (ఐచ్చికం):',
            location_placeholder: 'స్థానాన్ని నమోదు చేయండి లేదా GPS ఉపయోగించండి',
            get_location: '📍 GPS',
            quick_stats: 'త్వరిత గణాంకాలు',
            this_month: 'ఈ నెల',
            avg_daily: 'రోజువారీ సగటు',
            top_category: 'టాప్ వర్గం',
            time_range: 'సమయ పరిధి:',
            last_7_days: 'గత 7 రోజులు',
            last_30_days: 'గత 30 రోజులు',
            last_3_months: 'గత 3 నెలలు',
            last_year: 'గత సంవత్సరం',
            spending_trends: 'ఖర్చు ధోరణులు',
            category_comparison: 'వర్గ పోలిక',
            advanced_features: 'అధునాతన లక్షణాలు',
            location_tracking: 'స్థాన ట్రాకింగ్:',
            auto_categorize: 'సారూప్య లావాదేవీలను స్వయంచాలకంగా వర్గీకరించండి:',
            export_pdf: 'PDF రిపోర్ట్ ఎగుమతి',
            app_info: 'యాప్ సమాచారం',
            version: 'వెర్షన్:',
            storage_used: 'వాడుకలో ఉన్న నిల్వ:',
            total_transactions: 'మొత్తం లావాదేవీలు:',
            installation_date: 'ఇన్‌స్టాలేషన్ తేదీ:'
        }
    };
    
    // Transaction Management
    openTransactionModal(transaction = null) {
        this.currentEditingTransaction = transaction;
        const modal = document.getElementById('transactionModal');
        const title = document.getElementById('transactionModalTitle');
        const form = document.getElementById('transactionForm');
        
        // Update modal title and populate category options
        if (transaction) {
            title.textContent = this.translations[this.data.settings.language].edit_transaction;
            this.populateTransactionForm(transaction);
        } else {
            title.textContent = this.translations[this.data.settings.language].add_transaction;
            form.reset();
            document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        }
        
        this.populateCategoryOptions();
        modal.classList.add('active');
    }
    
    closeTransactionModal() {
        const modal = document.getElementById('transactionModal');
        modal.classList.remove('active');
        this.currentEditingTransaction = null;
        document.getElementById('receiptPreview').innerHTML = '';
        document.getElementById('receiptPreview').classList.remove('active');
    }
    
    populateTransactionForm(transaction) {
        document.getElementById('transactionAmount').value = Math.abs(transaction.amount);
        document.getElementById('transactionType').value = transaction.amount >= 0 ? 'income' : 'expense';
        document.getElementById('transactionCategory').value = transaction.categoryId;
        document.getElementById('transactionDate').value = transaction.date;
        document.getElementById('transactionNotes').value = transaction.notes || '';
        document.getElementById('transactionTags').value = transaction.tags ? transaction.tags.join(', ') : '';
        
        const locationInput = document.getElementById('transactionLocation');
        if (locationInput) {
            locationInput.value = transaction.location || '';
        }
        
        if (transaction.receiptImage) {
            const preview = document.getElementById('receiptPreview');
            preview.innerHTML = `<img src="${transaction.receiptImage}" alt="Receipt">`;
            preview.classList.add('active');
        }
    }
    
    populateCategoryOptions() {
        const select = document.getElementById('transactionCategory');
        select.innerHTML = '<option value="" data-i18n="select_category">Select Category</option>';
        
        this.data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.icon} ${category.name}`;
            select.appendChild(option);
        });
    }
    
    saveTransaction() {
        const form = document.getElementById('transactionForm');
        const formData = new FormData(form);
        
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const type = document.getElementById('transactionType').value;
        const categoryId = document.getElementById('transactionCategory').value;
        const date = document.getElementById('transactionDate').value;
        const notes = document.getElementById('transactionNotes').value;
        const tags = document.getElementById('transactionTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const location = document.getElementById('transactionLocation')?.value || '';
        
        if (!amount || !categoryId || !date) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const transaction = {
            id: this.currentEditingTransaction ? this.currentEditingTransaction.id : Date.now().toString(),
            amount: type === 'income' ? amount : -amount,
            categoryId,
            date,
            notes,
            tags,
            location,
            createdAt: this.currentEditingTransaction ? this.currentEditingTransaction.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Add receipt image if available
        const receiptPreview = document.getElementById('receiptPreview');
        if (receiptPreview.classList.contains('active')) {
            const img = receiptPreview.querySelector('img');
            if (img) {
                transaction.receiptImage = img.src;
            }
        }
        
        if (this.currentEditingTransaction) {
            const index = this.data.transactions.findIndex(t => t.id === this.currentEditingTransaction.id);
            this.data.transactions[index] = transaction;
        } else {
            this.data.transactions.unshift(transaction);
        }
        
        this.saveData();
        this.updateDashboard();
        this.renderTransactions();
        this.renderCharts();
        this.closeTransactionModal();
        this.checkBudgetLimits();
        
        this.showToast(
            this.currentEditingTransaction ? 'Transaction updated successfully' : 'Transaction added successfully',
            'success'
        );
    }
    
    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.data.transactions = this.data.transactions.filter(t => t.id !== id);
            this.saveData();
            this.updateDashboard();
            this.renderTransactions();
            this.renderCharts();
            this.showToast('Transaction deleted successfully', 'success');
        }
    }
    
    // Category Management
    openCategoryModal(category = null) {
        this.currentEditingCategory = category;
        const modal = document.getElementById('categoryModal');
        const title = document.getElementById('categoryModalTitle');
        const form = document.getElementById('categoryForm');
        
        if (category) {
            title.textContent = 'Edit Category';
            document.getElementById('categoryName').value = category.name;
            document.getElementById('categoryIcon').value = category.icon;
            document.getElementById('categoryColor').value = category.color;
        } else {
            title.textContent = this.translations[this.data.settings.language].add_category;
            form.reset();
            document.getElementById('categoryColor').value = '#2196F3';
        }
        
        modal.classList.add('active');
    }
    
    closeCategoryModal() {
        const modal = document.getElementById('categoryModal');
        modal.classList.remove('active');
        this.currentEditingCategory = null;
    }
    
    saveCategory() {
        const name = document.getElementById('categoryName').value.trim();
        const icon = document.getElementById('categoryIcon').value.trim();
        const color = document.getElementById('categoryColor').value;
        
        if (!name || !icon) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const category = {
            id: this.currentEditingCategory ? this.currentEditingCategory.id : Date.now().toString(),
            name,
            icon,
            color,
            createdAt: this.currentEditingCategory ? this.currentEditingCategory.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (this.currentEditingCategory) {
            const index = this.data.categories.findIndex(c => c.id === this.currentEditingCategory.id);
            this.data.categories[index] = category;
        } else {
            this.data.categories.push(category);
        }
        
        this.saveData();
        this.renderCategories();
        this.populateCategoryOptions();
        this.closeCategoryModal();
        
        this.showToast(
            this.currentEditingCategory ? 'Category updated successfully' : 'Category added successfully',
            'success'
        );
    }
    
    deleteCategory(id) {
        // Check if category is being used
        const hasTransactions = this.data.transactions.some(t => t.categoryId === id);
        
        if (hasTransactions) {
            this.showToast('Cannot delete category that has transactions', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to delete this category?')) {
            this.data.categories = this.data.categories.filter(c => c.id !== id);
            this.saveData();
            this.renderCategories();
            this.populateCategoryOptions();
            this.showToast('Category deleted successfully', 'success');
        }
    }
    
    // Budget Management
    openBudgetModal() {
        const modal = document.getElementById('budgetModal');
        document.getElementById('weeklyBudget').value = this.data.budgets.weekly || '';
        document.getElementById('monthlyBudget').value = this.data.budgets.monthly || '';
        modal.classList.add('active');
    }
    
    closeBudgetModal() {
        const modal = document.getElementById('budgetModal');
        modal.classList.remove('active');
    }
    
    saveBudget() {
        const weekly = parseFloat(document.getElementById('weeklyBudget').value) || 0;
        const monthly = parseFloat(document.getElementById('monthlyBudget').value) || 0;
        
        this.data.budgets = { weekly, monthly };
        this.saveData();
        this.updateBudgetDisplay();
        this.closeBudgetModal();
        this.showToast('Budget limits saved successfully', 'success');
    }
    
    checkBudgetLimits() {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const weeklyExpenses = this.getExpensesForPeriod(weekStart);
        const monthlyExpenses = this.getExpensesForPeriod(monthStart);
        
        if (this.data.budgets.weekly && weeklyExpenses > this.data.budgets.weekly) {
            this.showToast('Weekly budget limit exceeded!', 'warning');
        }
        
        if (this.data.budgets.monthly && monthlyExpenses > this.data.budgets.monthly) {
            this.showToast('Monthly budget limit exceeded!', 'warning');
        }
    }
    
    getExpensesForPeriod(startDate) {
        return Math.abs(this.data.transactions
            .filter(t => t.amount < 0 && new Date(t.date) >= startDate)
            .reduce((sum, t) => sum + t.amount, 0));
    }
    
    // Receipt Management
    handleReceiptUpload(file) {
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showToast('Image size too large. Please choose a smaller image.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('receiptPreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Receipt">`;
            preview.classList.add('active');
        };
        reader.readAsDataURL(file);
    }
    
    // Rendering Methods
    updateDashboard() {
        const totalIncome = this.data.transactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = Math.abs(this.data.transactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0));
        
        const currentBalance = totalIncome - totalExpenses;
        
        document.getElementById('totalIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalExpenses').textContent = this.formatCurrency(totalExpenses);
        document.getElementById('currentBalance').textContent = this.formatCurrency(currentBalance);
        
        // Update recent transactions
        this.renderRecentTransactions();
        this.updateBudgetDisplay();
    }
    
    renderRecentTransactions() {
        const container = document.getElementById('recentTransactionsList');
        const sortedTransactions = [...this.data.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        const recentTransactions = sortedTransactions.slice(0, 5);
        
        if (recentTransactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p data-i18n="no_transactions">No transactions yet. Add your first transaction!</p></div>';
            return;
        }
        
        container.innerHTML = recentTransactions.map(transaction => 
            this.renderTransactionItem(transaction)
        ).join('');
    }
    
    renderTransactions() {
        const container = document.getElementById('transactionsList');
        let transactions = [...this.data.transactions];
        
        // Apply search and filters
        const searchTerm = document.getElementById('searchTransactions').value.toLowerCase();
        const filterCategory = document.getElementById('filterCategory').value;
        const filterDateFrom = document.getElementById('filterDateFrom').value;
        const filterDateTo = document.getElementById('filterDateTo').value;
        
        // Apply search filter
        if (searchTerm) {
            transactions = transactions.filter(t => {
                const category = this.getCategoryById(t.categoryId);
                return category.name.toLowerCase().includes(searchTerm) ||
                       t.notes?.toLowerCase().includes(searchTerm) ||
                       t.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
            });
        }
        
        // Apply category filter
        if (filterCategory) {
            transactions = transactions.filter(t => t.categoryId === filterCategory);
        }
        
        // Apply date range filter
        if (filterDateFrom || filterDateTo) {
            transactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
                const toDate = filterDateTo ? new Date(filterDateTo) : null;
                
                // Set time to start/end of day for proper comparison
                if (fromDate) {
                    fromDate.setHours(0, 0, 0, 0);
                }
                if (toDate) {
                    toDate.setHours(23, 59, 59, 999);
                }
                
                // Check if transaction date falls within range
                if (fromDate && toDate) {
                    return transactionDate >= fromDate && transactionDate <= toDate;
                } else if (fromDate) {
                    return transactionDate >= fromDate;
                } else if (toDate) {
                    return transactionDate <= toDate;
                }
                
                return true;
            });
        }
        
        // Sort transactions by date (most recent first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (transactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p data-i18n="no_transactions">No transactions found</p></div>';
            return;
        }
        
        container.innerHTML = transactions.map(transaction => 
            this.renderTransactionItem(transaction, true)
        ).join('');
    }
    
    renderTransactionItem(transaction, showActions = false) {
        const category = this.getCategoryById(transaction.categoryId);
        const isIncome = transaction.amount > 0;
        const formattedDate = new Date(transaction.date).toLocaleDateString();
        
        // Determine what to show as the main title
        const hasNotes = transaction.notes && transaction.notes.trim() !== '';
        const transactionTitle = hasNotes ? transaction.notes : category.name;
        const showCategoryInDetails = hasNotes; // Only show category in details if we have notes as title
        
        return `
            <div class="transaction-item" onclick="${showActions ? "this.querySelector('.transaction-actions').style.display = this.querySelector('.transaction-actions').style.display === 'flex' ? 'none' : 'flex'" : ''}">
                <div class="transaction-icon" style="background-color: ${category.color}">
                    ${category.icon}
                </div>
                <div class="transaction-info">
                    <div class="transaction-title">${transactionTitle}</div>
                    <div class="transaction-details">
                        ${formattedDate}${showCategoryInDetails ? ` • ${category.name}` : ''}
                        ${transaction.tags && transaction.tags.length > 0 ? ` • ${transaction.tags.join(', ')}` : ''}
                        ${transaction.location ? ` • 📍 ${transaction.location}` : ''}
                    </div>
                </div>
                <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                    ${isIncome ? '+' : ''}${this.formatCurrency(Math.abs(transaction.amount))}
                </div>
                ${showActions ? `
                    <div class="transaction-actions" style="display: none;">
                        <button class="icon-btn" onclick="event.stopPropagation(); app.openTransactionModal(${JSON.stringify(transaction).replace(/"/g, '&quot;')})" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="icon-btn" onclick="event.stopPropagation(); app.deleteTransaction('${transaction.id}')" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                            </svg>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderCategories() {
        const container = document.getElementById('categoriesGrid');
        
        if (this.data.categories.length === 0) {
            container.innerHTML = '<div class="empty-state"><p data-i18n="no_categories">No categories yet. Create your first category!</p></div>';
            return;
        }
        
        container.innerHTML = this.data.categories.map(category => {
            const transactionCount = this.data.transactions.filter(t => t.categoryId === category.id).length;
            
            return `
                <div class="category-card">
                    <div class="category-actions">
                        <button class="icon-btn" onclick="app.openCategoryModal(${JSON.stringify(category).replace(/"/g, '&quot;')})" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="icon-btn" onclick="app.deleteCategory('${category.id}')" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2,2h4a2,2,0,0,1,2,2v2"/>
                            </svg>
                        </button>
                    </div>
                    <div class="category-card-icon" style="background-color: ${category.color}">
                        ${category.icon}
                    </div>
                    <div class="category-card-name">${category.name}</div>
                    <div class="category-card-count">${transactionCount} transactions</div>
                </div>
            `;
        }).join('');
    }
    
    updateBudgetDisplay() {
        const container = document.getElementById('budgetProgress');
        
        if (!this.data.budgets.weekly && !this.data.budgets.monthly) {
            container.innerHTML = '<p data-i18n="no_budget_set">No budget limits set</p>';
            return;
        }
        
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const weeklyExpenses = this.getExpensesForPeriod(weekStart);
        const monthlyExpenses = this.getExpensesForPeriod(monthStart);
        
        let html = '';
        
        if (this.data.budgets.weekly) {
            const weeklyPercentage = Math.min((weeklyExpenses / this.data.budgets.weekly) * 100, 100);
            const weeklyStatus = weeklyPercentage > 100 ? 'danger' : weeklyPercentage > 80 ? 'warning' : '';
            
            html += `
                <div class="budget-item">
                    <div>
                        <strong>Weekly:</strong> ${this.formatCurrency(weeklyExpenses)} / ${this.formatCurrency(this.data.budgets.weekly)}
                    </div>
                    <div class="budget-bar">
                        <div class="budget-progress-fill ${weeklyStatus}" style="width: ${weeklyPercentage}%"></div>
                    </div>
                    <div>${weeklyPercentage.toFixed(1)}%</div>
                </div>
            `;
        }
        
        if (this.data.budgets.monthly) {
            const monthlyPercentage = Math.min((monthlyExpenses / this.data.budgets.monthly) * 100, 100);
            const monthlyStatus = monthlyPercentage > 100 ? 'danger' : monthlyPercentage > 80 ? 'warning' : '';
            
            html += `
                <div class="budget-item">
                    <div>
                        <strong>Monthly:</strong> ${this.formatCurrency(monthlyExpenses)} / ${this.formatCurrency(this.data.budgets.monthly)}
                    </div>
                    <div class="budget-bar">
                        <div class="budget-progress-fill ${monthlyStatus}" style="width: ${monthlyPercentage}%"></div>
                    </div>
                    <div>${monthlyPercentage.toFixed(1)}%</div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }
    
    // Charts
    renderCharts() {
        this.renderPieChart();
        this.renderBarChart();
    }
    
    renderPieChart() {
        const canvas = document.getElementById('pieChart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Get expense data by category
        const expensesByCategory = {};
        this.data.transactions
            .filter(t => t.amount < 0)
            .forEach(transaction => {
                const category = this.getCategoryById(transaction.categoryId);
                if (!expensesByCategory[category.id]) {
                    expensesByCategory[category.id] = {
                        name: category.name,
                        color: category.color,
                        amount: 0
                    };
                }
                expensesByCategory[category.id].amount += Math.abs(transaction.amount);
            });
        
        const categories = Object.values(expensesByCategory);
        
        if (categories.length === 0) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('No expense data available', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        let currentAngle = -Math.PI / 2;
        
        categories.forEach(category => {
            const sliceAngle = (category.amount / total) * 2 * Math.PI;
            
            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = category.color;
            ctx.fill();
            
            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${((category.amount / total) * 100).toFixed(1)}%`,
                labelX,
                labelY
            );
            
            currentAngle += sliceAngle;
        });
        
        // Draw legend
        const legendY = canvas.height - 80;
        let legendX = 10;
        
        categories.forEach((category, index) => {
            if (legendX + 120 > canvas.width) {
                legendX = 10;
                legendY += 20;
            }
            
            // Color box
            ctx.fillStyle = category.color;
            ctx.fillRect(legendX, legendY, 12, 12);
            
            // Label
            ctx.fillStyle = '#333';
            ctx.font = '11px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(category.name, legendX + 16, legendY + 9);
            
            legendX += 120;
        });
    }
    
    renderBarChart() {
        const canvas = document.getElementById('barChart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Get last 6 months data
        const monthlyData = this.getMonthlyData(6);
        
        if (monthlyData.length === 0) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        const barWidth = chartWidth / monthlyData.length;
        
        const maxAmount = Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses)));
        
        monthlyData.forEach((data, index) => {
            const x = padding + index * barWidth;
            const incomeHeight = (data.income / maxAmount) * chartHeight;
            const expenseHeight = (data.expenses / maxAmount) * chartHeight;
            
            // Draw income bar
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(x + 5, padding + chartHeight - incomeHeight, barWidth / 2 - 10, incomeHeight);
            
            // Draw expense bar
            ctx.fillStyle = '#F44336';
            ctx.fillRect(x + barWidth / 2, padding + chartHeight - expenseHeight, barWidth / 2 - 5, expenseHeight);
            
            // Draw month label
            ctx.fillStyle = '#333';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(data.month, x + barWidth / 2, canvas.height - 10);
        });
        
        // Draw legend
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(10, 10, 12, 12);
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Income', 26, 21);
        
        ctx.fillStyle = '#F44336';
        ctx.fillRect(80, 10, 12, 12);
        ctx.fillText('Expenses', 96, 21);
    }
    
    getMonthlyData(months) {
        const data = [];
        const now = new Date();
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            const year = date.getFullYear();
            const monthStart = new Date(year, date.getMonth(), 1);
            const monthEnd = new Date(year, date.getMonth() + 1, 0);
            
            const monthTransactions = this.data.transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= monthStart && transactionDate <= monthEnd;
            });
            
            const income = monthTransactions
                .filter(t => t.amount > 0)
                .reduce((sum, t) => sum + t.amount, 0);
            
            const expenses = Math.abs(monthTransactions
                .filter(t => t.amount < 0)
                .reduce((sum, t) => sum + t.amount, 0));
            
            data.push({ month, income, expenses });
        }
        
        return data;
    }
    
    // Filter and Search
    toggleFilterPanel() {
        const panel = document.getElementById('filterPanel');
        const btn = document.getElementById('filterBtn');
        
        panel.classList.toggle('active');
        btn.classList.toggle('active');
        
        if (panel.classList.contains('active')) {
            // Populate filter category options
            const select = document.getElementById('filterCategory');
            select.innerHTML = '<option value="" data-i18n="all_categories">All Categories</option>';
            this.data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = `${category.icon} ${category.name}`;
                select.appendChild(option);
            });
        }
    }
    
    applyFilters() {
        this.renderTransactions();
        this.toggleFilterPanel();
    }
    
    clearFilters() {
        document.getElementById('searchTransactions').value = '';
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        this.renderTransactions();
    }
    
    filterTransactions() {
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.renderTransactions();
        }, 300);
    }
    
    // Export/Import
    exportCSV() {
        const headers = ['Date', 'Category', 'Amount', 'Type', 'Notes', 'Tags'];
        const rows = this.data.transactions.map(transaction => {
            const category = this.getCategoryById(transaction.categoryId);
            return [
                transaction.date,
                category.name,
                Math.abs(transaction.amount),
                transaction.amount >= 0 ? 'Income' : 'Expense',
                transaction.notes || '',
                transaction.tags ? transaction.tags.join(', ') : ''
            ];
        });
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        this.downloadFile(csvContent, 'budget-tracker-transactions.csv', 'text/csv');
        this.showToast('Transactions exported successfully', 'success');
    }
    
    exportJSON() {
        const dataToExport = {
            ...this.data,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const jsonContent = JSON.stringify(dataToExport, null, 2);
        this.downloadFile(jsonContent, 'budget-tracker-backup.json', 'application/json');
        this.showToast('Data exported successfully', 'success');
    }
    
    importJSON(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (confirm('This will replace all your current data. Are you sure?')) {
                    this.data = {
                        transactions: importedData.transactions || [],
                        categories: importedData.categories || [],
                        budgets: importedData.budgets || {},
                        settings: { ...this.data.settings, ...importedData.settings }
                    };
                    
                    this.saveData();
                    this.updateDashboard();
                    this.renderTransactions();
                    this.renderCategories();
                    this.renderCharts();
                    this.applyTheme();
                    this.updateLanguage();
                    
                    this.showToast('Data imported successfully', 'success');
                }
            } catch (error) {
                this.showToast('Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        document.getElementById('importFileInput').value = '';
    }
    
    clearAllData() {
        if (confirm('This will delete ALL your data permanently. Are you sure?')) {
            if (confirm('This action cannot be undone. Are you absolutely sure?')) {
                localStorage.removeItem('budgetTrackerData');
                location.reload();
            }
        }
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    // Utility Methods
    getCategoryById(id) {
        return this.data.categories.find(c => c.id === id) || { 
            name: 'Unknown', 
            icon: '❓', 
            color: '#999' 
        };
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    // Daily Reminder
    showDailyReminder() {
        if (!this.data.settings.dailyReminder) return;
        
        const lastReminder = localStorage.getItem('lastDailyReminder');
        const today = new Date().toDateString();
        
        if (lastReminder !== today) {
            setTimeout(() => {
                this.showToast('Don\'t forget to track your expenses today!', 'info');
                localStorage.setItem('lastDailyReminder', today);
            }, 2000);
        }
    }
    
    // Service Worker Registration
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                    console.log('SW registered successfully');
                })
                .catch(error => {
                    console.log('SW registration failed');
                });
        }
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BudgetTracker();
});

// Request notification permission
if ('Notification' in window && navigator.serviceWorker) {
    Notification.requestPermission();
}

// Add enhanced methods to the BudgetTracker prototype
BudgetTracker.prototype.updateQuickStats = function() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const thisMonthTransactions = this.data.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= thisMonthStart && transactionDate <= thisMonthEnd;
    });
    
    const thisMonthExpenses = Math.abs(thisMonthTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0));
    
    const daysInMonth = thisMonthEnd.getDate();
    const dailyAverage = thisMonthExpenses / daysInMonth;
    
    const categoryTotals = {};
    thisMonthTransactions.filter(t => t.amount < 0).forEach(t => {
        const category = this.getCategoryById(t.categoryId);
        if (category) {
            categoryTotals[category.name] = (categoryTotals[category.name] || 0) + Math.abs(t.amount);
        }
    });
    
    const topCategory = Object.keys(categoryTotals).length > 0 
        ? Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b)
        : 'None';
    
    const thisMonthEl = document.getElementById('thisMonthExpenses');
    const dailyAvgEl = document.getElementById('dailyAverage');
    const topCatEl = document.getElementById('topCategory');
    
    if (thisMonthEl) thisMonthEl.textContent = this.formatCurrency(thisMonthExpenses);
    if (dailyAvgEl) dailyAvgEl.textContent = this.formatCurrency(dailyAverage);
    if (topCatEl) topCatEl.textContent = topCategory;
};

BudgetTracker.prototype.getCurrentLocation = function() {
    if (!navigator.geolocation) {
        this.showToast('Geolocation is not supported by this browser', 'error');
        return;
    }
    
    const locationInput = document.getElementById('transactionLocation');
    if (locationInput) {
        locationInput.value = 'Getting location...';
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                locationInput.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                this.showToast('Location captured successfully', 'success');
            },
            (error) => {
                locationInput.value = '';
                this.showToast('Unable to get location: ' + error.message, 'error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }
};

BudgetTracker.prototype.renderLineChart = function() {
    const canvas = document.getElementById('lineChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const data = this.getTimeRangeData(this.selectedTimeRange);
    
    if (data.length === 0) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    const maxExpense = Math.max(...data.map(d => d.expenses));
    const maxIncome = Math.max(...data.map(d => d.income));
    const maxValue = Math.max(maxExpense, maxIncome);
    
    if (maxValue === 0) return;
    
    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();
    
    // Draw expense line
    ctx.strokeStyle = '#F44336';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((point, index) => {
        const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth;
        const y = padding + chartHeight - (point.expenses / maxValue) * chartHeight;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Draw income line
    ctx.strokeStyle = '#4CAF50';
    ctx.beginPath();
    data.forEach((point, index) => {
        const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth;
        const y = padding + chartHeight - (point.income / maxValue) * chartHeight;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Draw legend
    ctx.fillStyle = '#F44336';
    ctx.fillRect(10, 10, 12, 12);
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Expenses', 26, 21);
    
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(80, 10, 12, 12);
    ctx.fillText('Income', 96, 21);
};

BudgetTracker.prototype.getTimeRangeData = function(days, previous = false) {
    const endDate = previous 
        ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        : new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const transactions = this.data.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    const data = [];
    const interval = Math.max(1, Math.ceil(days / 10));
    
    for (let i = 0; i < days; i += interval) {
        const periodStart = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const periodEnd = new Date(Math.min(periodStart.getTime() + interval * 24 * 60 * 60 * 1000, endDate.getTime()));
        
        const periodTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= periodStart && transactionDate < periodEnd;
        });
        
        const income = periodTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = Math.abs(periodTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0));
        
        data.push({ date: periodStart, income, expenses });
    }
    
    return data;
};

BudgetTracker.prototype.exportPDF = function() {
    this.generateHTMLReport();
};

BudgetTracker.prototype.generateHTMLReport = function() {
    const reportWindow = window.open('', '_blank');
    const reportHTML = this.generateReportHTML();
    
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
    reportWindow.print();
};

BudgetTracker.prototype.generateReportHTML = function() {
    const totalIncome = this.calculateTotalIncome();
    const totalExpenses = this.calculateTotalExpenses();
    const balance = totalIncome + totalExpenses;
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Budget Tracker Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                .summary-card { padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
                .transactions { margin-top: 30px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f5f5f5; }
                .income { color: #4CAF50; }
                .expense { color: #F44336; }
                @media print { .no-print { display: none !important; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Budget Tracker Report</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="summary">
                <div class="summary-card">
                    <h3>Total Income</h3>
                    <p class="income">${this.formatCurrency(totalIncome)}</p>
                </div>
                <div class="summary-card">
                    <h3>Total Expenses</h3>
                    <p class="expense">${this.formatCurrency(Math.abs(totalExpenses))}</p>
                </div>
                <div class="summary-card">
                    <h3>Current Balance</h3>
                    <p>${this.formatCurrency(balance)}</p>
                </div>
            </div>
            
            <div class="transactions">
                <h2>Recent Transactions</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.data.transactions.slice(-20).reverse().map(t => {
                            const category = this.getCategoryById(t.categoryId);
                            return `
                                <tr>
                                    <td>${new Date(t.date).toLocaleDateString()}</td>
                                    <td>${category ? `${category.icon} ${category.name}` : 'Unknown'}</td>
                                    <td>${t.notes || 'No description'}</td>
                                    <td class="${t.amount >= 0 ? 'income' : 'expense'}">${this.formatCurrency(Math.abs(t.amount))}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;
};

BudgetTracker.prototype.updateAppInfo = function() {
    const storageUsed = this.calculateStorageUsed();
    const totalTransactions = this.data.transactions.length;
    const installationDate = new Date(this.data.settings.installationDate).toLocaleDateString();
    
    const storageEl = document.getElementById('storageUsed');
    const transactionsEl = document.getElementById('totalTransactionsCount');
    const installDateEl = document.getElementById('installationDate');
    const locationEl = document.getElementById('locationTracking');
    const autoCatEl = document.getElementById('autoCategorize');
    
    if (storageEl) storageEl.textContent = storageUsed;
    if (transactionsEl) transactionsEl.textContent = totalTransactions;
    if (installDateEl) installDateEl.textContent = installationDate;
    if (locationEl) locationEl.checked = this.data.settings.locationTracking;
    if (autoCatEl) autoCatEl.checked = this.data.settings.autoCategorize;
};

BudgetTracker.prototype.calculateStorageUsed = function() {
    const dataStr = JSON.stringify(this.data);
    const sizeInBytes = new Blob([dataStr]).size;
    
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Override the original updateDashboard and renderCharts methods
BudgetTracker.prototype.originalUpdateDashboard = BudgetTracker.prototype.updateDashboard;
BudgetTracker.prototype.updateDashboard = function() {
    this.originalUpdateDashboard();
    this.updateQuickStats();
};

BudgetTracker.prototype.originalRenderCharts = BudgetTracker.prototype.renderCharts;
BudgetTracker.prototype.renderCharts = function() {
    this.originalRenderCharts();
    this.renderLineChart();
};
