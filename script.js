// DOM Elements
const balanceEl = document.getElementById('balance');
const moneyPlusEl = document.getElementById('money-plus');
const moneyMinusEl = document.getElementById('money-minus');
const listEl = document.getElementById('list');
const formEl = document.getElementById('form');
const textEl = document.getElementById('text');
const amountEl = document.getElementById('amount');
const resetBtn = document.getElementById('reset-btn');
const submitBtn = document.getElementById('submit-btn');
const submitBtnText = submitBtn.querySelector('span');
const submitBtnIcon = submitBtn.querySelector('i');
const emptyStateEl = document.getElementById('empty-state');
const filterRadios = document.getElementsByName('filter');

// State Management
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let editMode = false;
let editId = null;

// Currency Formatter
const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    signDisplay: 'never' // We handle signs manually
});

// --- Functions ---

function init() {
    renderList();
    updateValues();
}

function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Add or Update Transaction
function handleTransactionSubmit(e) {
    e.preventDefault();

    if (textEl.value.trim() === '' || amountEl.value.trim() === '') {
        // Simple validation feedback (shake input)
        if(textEl.value.trim() === '') textEl.parentElement.classList.add('animate-pulse');
        if(amountEl.value.trim() === '') amountEl.parentElement.classList.add('animate-pulse');
        setTimeout(() => {
            textEl.parentElement.classList.remove('animate-pulse');
            amountEl.parentElement.classList.remove('animate-pulse');
        }, 500);
        return;
    }

    const type = document.querySelector('input[name="type"]:checked').value;

let amount = +amountEl.value;

// Fix: ensure correct sign
if (type === 'expense') {
    amount = -Math.abs(amount);
} else {
    amount = Math.abs(amount);
}

const transactionData = {
    id: editMode ? editId : generateID(),
    text: textEl.value,
    amount: amount,
    type: type,
    date: new Date().toLocaleDateString()
};

    if (editMode) {
        transactions = transactions.map(t => (t.id === editId ? transactionData : t));
        exitEditMode();
    } else {
        transactions.push(transactionData);
    }

    updateLocalStorage();
    renderList();
    updateValues();
    
    // Clear inputs unless editing (logic handled in exitEditMode)
    if (!editMode) {
        textEl.value = '';
        amountEl.value = '';
    }
}

// Render List based on Filter
function renderList() {
    listEl.innerHTML = '';
    
    // Get current filter
    const filterValue = Array.from(filterRadios).find(r => r.checked).value;

    const filtered = transactions.filter(t => {
        if (filterValue === 'income') return t.amount > 0;
        if (filterValue === 'expense') return t.amount < 0;
        return true;
    });

    if (filtered.length === 0) {
        emptyStateEl.classList.remove('hidden');
        emptyStateEl.classList.add('flex');
    } else {
        emptyStateEl.classList.add('hidden');
        emptyStateEl.classList.remove('flex');
        
        filtered.forEach(transaction => {
            const sign = transaction.amount < 0 ? '-' : '+';
            const isExpense = transaction.amount < 0;
            
            // Colors
            const borderClass = isExpense ? 'border-rose-500' : 'border-emerald-500';
            const textClass = isExpense ? 'text-rose-600' : 'text-emerald-600';
            const iconClass = isExpense ? 'fa-arrow-trend-down text-rose-100 bg-rose-500' : 'fa-arrow-trend-up text-emerald-100 bg-emerald-500';

            const item = document.createElement('li');
            item.className = `fade-in bg-slate-50 border-l-4 ${borderClass} rounded-r-lg p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow group`;

            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full ${isExpense ? 'bg-rose-100' : 'bg-emerald-100'} flex items-center justify-center">
                        <i class="fa-solid ${isExpense ? 'fa-minus text-rose-500' : 'fa-plus text-emerald-500'} text-xs"></i>
                    </div>
                    <div>
                        <p class="font-semibold text-slate-700 text-sm">${transaction.text}</p>
                        <p class="text-xs text-slate-400">${transaction.date || 'Just now'}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="font-bold ${textClass}">${sign}${formatter.format(Math.abs(transaction.amount))}</span>
                    <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="enterEditMode(${transaction.id})" class="text-slate-400 hover:text-amber-500 transition-colors" title="Edit">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onclick="removeTransaction(${transaction.id})" class="text-slate-400 hover:text-rose-500 transition-colors" title="Delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;

            listEl.appendChild(item);
        });
    }
}

// Update Totals
function updateValues() {
    const amounts = transactions.map(t => t.amount);
    
    const total = amounts.reduce((acc, item) => (acc += item), 0);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0);
    const expense = (amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1);

    balanceEl.innerText = formatter.format(total);
    moneyPlusEl.innerText = `+${formatter.format(income)}`;
    moneyMinusEl.innerText = `-${formatter.format(expense)}`;
}

// Actions
window.removeTransaction = function(id) {
    if(confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        if (editId === id) exitEditMode();
        updateLocalStorage();
        renderList();
        updateValues();
    }
};

window.enterEditMode = function(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    textEl.value = transaction.text;
    amountEl.value = Math.abs(transaction.amount);
    document.querySelector(`input[name="type"][value="${transaction.amount < 0 ? 'expense' : 'income'}"]`).checked = true;
    editMode = true;
    editId = id;

    // Update UI for Edit Mode
    submitBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
    submitBtn.classList.add('bg-amber-500', 'hover:bg-amber-600');
    submitBtnText.innerText = 'Update Transaction';
    submitBtnIcon.className = 'fa-solid fa-check';
    textEl.focus();
};

function exitEditMode() {
    editMode = false;
    editId = null;
    textEl.value = '';
    amountEl.value = '';
    
    // Reset UI
    submitBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
    submitBtn.classList.remove('bg-amber-500', 'hover:bg-amber-600');
    submitBtnText.innerText = 'Add Transaction';
    submitBtnIcon.className = 'fa-solid fa-plus';
}

// Event Listeners
formEl.addEventListener('submit', handleTransactionSubmit);

resetBtn.addEventListener('click', () => {
    exitEditMode();
    document.querySelector('input[name="type"][value="income"]').checked = true;
});

Array.from(filterRadios).forEach(radio => {
    radio.addEventListener('change', renderList);
});

// Initialize App
init();