import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/layout';
import Pagination from '../../components/pagination/pagination';
import { authService } from '../../services/auth';
import { transactionService } from '../../services/transaction';
import './transaction.css';

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [convertToCurrency, setConvertToCurrency] = useState('');
  const [convertLoading, setConvertLoading] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState(() => {
    return localStorage.getItem('pennypal_base_currency') || 'IDR';
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const [addFormData, setAddFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    currency: 'IDR',
    source: 'manual',
    tags: [],
    date: new Date().toISOString().split('T')[0]
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    currency: 'IDR',
    source: 'manual',
    tags: [],
    date: new Date().toISOString().split('T')[0]
  });

  const [filters, setFilters] = useState({
    type: '',
    category: '',
    currency: '',
    startDate: '',
    endDate: '',
    searchTags: ''
  });

  const categories = [
    'Food & Dining', 'Salary', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Education', 'Travel',
    'Groceries', 'Gas', 'Other'
  ];

  const currencies = [
    'IDR', 'USD', 'EUR', 'JPY', 'SGD', 'MYR', 'AUD', 'GBP', 'CHF', 'CAD', 'KRW'
  ];



  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    
    const rates = {
      USD: 1, IDR: 15800, KRW: 1350, EUR: 0.85, JPY: 110,
      SGD: 1.35, MYR: 4.2, AUD: 1.4, GBP: 0.75, CHF: 0.92, CAD: 1.25
    };
    
    if (!rates[fromCurrency] || !rates[toCurrency]) return amount;
    
    const usdAmount = amount / rates[fromCurrency];
    return Math.round((usdAmount * rates[toCurrency]) * 100) / 100;
  };

  const parseDateFromOCR = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    const numbers = dateStr.match(/\d+/g);
    if (!numbers || numbers.length < 3) return new Date().toISOString().split('T')[0];
    
    let day, month, year;
    
    // Find year (4 digits or >31)
    const yearIndex = numbers.findIndex(n => n.length === 4 || parseInt(n) > 31);
    
    if (yearIndex !== -1) {
      year = parseInt(numbers[yearIndex]);
      if (year < 100) year += year > 50 ? 1900 : 2000;
      
      const remaining = numbers.filter((_, i) => i !== yearIndex).map(n => parseInt(n));
      if (remaining.length >= 2) {
        if (remaining[0] > 12) {
          day = remaining[0]; month = remaining[1];
        } else if (remaining[1] > 12) {
          day = remaining[1]; month = remaining[0];
        } else {
          day = remaining[0]; month = remaining[1];
        }
      }
    } else {
      day = parseInt(numbers[0]);
      month = parseInt(numbers[1]);
      year = parseInt(numbers[2]);
      if (year < 100) year += year > 50 ? 1900 : 2000;
    }
    
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return new Date().toISOString().split('T')[0];
  };

  const detectCategoryFromOCR = (text, storeName) => {
    const lowerText = (text + ' ' + storeName).toLowerCase();
    
    const categories = {
      'Food & Dining': ['restaurant', 'cafe', 'warung', 'resto', 'food', 'makanan', 'pizza', 'burger', 'nasi', 'ayam', 'bakso', 'mie', 'coffee', 'kopi'],
      'Groceries': ['supermarket', 'minimarket', 'indomaret', 'alfamart', 'hypermart', 'carrefour', 'giant', 'sayur', 'buah', 'beras', 'telur', 'susu'],
      'Transportation': ['grab', 'gojek', 'taxi', 'ojek', 'bus', 'kereta', 'toll', 'parking', 'parkir', 'bensin', 'pertamina', 'shell'],
      'Healthcare': ['pharmacy', 'apotek', 'kimia farma', 'guardian', 'watson', 'medicine', 'obat', 'vitamin', 'hospital', 'klinik'],
      'Shopping': ['mall', 'store', 'shop', 'toko', 'fashion', 'clothing', 'elektronik']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    return 'Other';
  };

  const generateTagsFromOCR = (text, storeName, category) => {
    const tags = [];
    const lowerText = (text + ' ' + storeName).toLowerCase();
    
    if (storeName) tags.push(storeName.toLowerCase());
    if (category !== 'Other') tags.push(category.toLowerCase());
    
    const commonTags = {
      'receipt': ['receipt', 'struk'],
      'cash': ['cash', 'tunai'],
      'card': ['card', 'kartu', 'debit', 'credit'],
      'discount': ['discount', 'diskon', 'promo'],
      'tax': ['tax', 'ppn', 'pajak']
    };
    
    for (const [tag, keywords] of Object.entries(commonTags)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        tags.push(tag);
      }
    }
    
    return [...new Set(tags)].slice(0, 5);
  };

  const fetchTransactions = async () => {
    if (!authService.isAuthenticated()) {
      setError('Please login to continue');
      return;
    }

    setLoading(true);
    try {
      const result = await transactionService.getTransactions();
      if (result.success) {
        setTransactions(result.data?.transactions || result.data || []);
      } else {
        setError(result.message || 'Failed to fetch transactions');
        setTransactions([]);
      }
    } catch (err) {
      setError('Network error - please check your connection');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await transactionService.createTransaction({
        ...addFormData,
        amount: parseFloat(addFormData.amount) || 0,
        tags: addFormData.tags.filter(tag => tag.trim() !== ''),
        timestamp: addFormData.date ? new Date(addFormData.date).toISOString() : new Date().toISOString()
      });
      
      if (result.success) {
        await fetchTransactions();
        setShowAddForm(false);
        setAddFormData({
          title: '',
          amount: '',
          type: 'expense',
          category: '',
          description: '',
          currency: 'IDR',
          source: 'manual',
          tags: [],
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        setError(result.message || 'Failed to add transaction');
      }
    } catch (err) {
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await transactionService.updateTransaction(editingTransaction._id, {
        ...editFormData,
        amount: parseFloat(editFormData.amount) || 0,
        tags: editFormData.tags.filter(tag => tag.trim() !== ''),
        timestamp: editFormData.date ? new Date(editFormData.date).toISOString() : new Date().toISOString()
      });
      
      if (result.success) {
        await fetchTransactions();
        setShowEditForm(false);
        setEditingTransaction(null);
      } else {
        setError(result.message || 'Failed to update transaction');
      }
    } catch (err) {
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await transactionService.deleteTransaction(id);
      if (result.success) {
        await fetchTransactions();
      } else {
        setError(result.message || 'Failed to delete transaction');
      }
    } catch (err) {
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (transaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      title: transaction.title || '',
      amount: transaction.amount?.toString() || '',
      type: transaction.type || 'expense',
      category: transaction.category || '',
      description: transaction.description || '',
      currency: transaction.currency || 'IDR',
      source: transaction.source || 'manual',
      tags: Array.isArray(transaction.tags) ? transaction.tags : [],
      date: transaction.timestamp ? new Date(transaction.timestamp).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0]
    });
    setShowEditForm(true);
  };

  const convertAllTransactions = async (targetCurrency) => {
    setConvertLoading(true);
    try {
      setBaseCurrency(targetCurrency);
      localStorage.setItem('pennypal_base_currency', targetCurrency);
    } catch (err) {
      setError('Failed to convert transactions');
    } finally {
      setConvertLoading(false);
      setShowCurrencyConverter(false);
    }
  };

  const formatCurrency = (amount, currency = 'IDR') => {
    const currencySymbols = {
      IDR: 'Rp',
      USD: '$',
      EUR: '€',
      JPY: '¥',
      SGD: 'S$',
      MYR: 'RM',
      AUD: 'A$',
      GBP: '£',
      CHF: 'CHF',
      CAD: 'C$',
      KRW: '₩',
      CNY: '¥',
      HKD: 'HK$',
      THB: '฿',
      PHP: '₱',
      VND: '₫',
      INR: '₹',
      BRL: 'R$'
    };
    
    const symbol = currencySymbols[currency] || currency;
    const numAmount = parseFloat(amount) || 0;
    
    // Currencies that don't use decimal places
    if (['IDR', 'KRW', 'JPY', 'VND'].includes(currency)) {
      return `${symbol} ${Math.round(numAmount).toLocaleString()}`;
    } else {
      return `${symbol} ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const filteredAndSearchedTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    
    if (filters.currency) {
      filtered = filtered.filter(t => t.currency === filters.currency);
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(t => new Date(t.timestamp || t.createdAt) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(t => new Date(t.timestamp || t.createdAt) <= new Date(filters.endDate));
    }
    
    if (filters.searchTags) {
      filtered = filtered.filter(t => 
        t.tags && t.tags.some(tag => 
          tag.toLowerCase().includes(filters.searchTags.toLowerCase())
        )
      );
    }
    
    return filtered;
  }, [transactions, filters]);

  const convertedTransactions = useMemo(() => {
    return filteredAndSearchedTransactions.map(transaction => {
      if (transaction.currency === baseCurrency) {
        return {
          ...transaction,
          convertedAmount: transaction.amount,
          convertedCurrency: baseCurrency,
          originalAmount: transaction.amount,
          originalCurrency: transaction.currency
        };
      }
      
      const convertedAmount = convertCurrency(transaction.amount, transaction.currency, baseCurrency);
      return {
        ...transaction,
        convertedAmount,
        convertedCurrency: baseCurrency,
        originalAmount: transaction.amount,
        originalCurrency: transaction.currency
      };
    });
  }, [filteredAndSearchedTransactions, baseCurrency]);

  const totalPages = Math.ceil(convertedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = convertedTransactions.slice(startIndex, endIndex);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      category: '',
      currency: '',
      startDate: '',
      endDate: '',
      searchTags: ''
    });
  };

  const processOCRResult = async (imageData, filename = 'receipt.jpg') => {
    setOcrLoading(true);
    try {
      const result = await transactionService.scanReceipt(imageData, filename);
      if (result.success && result.data) {
        setOcrResult(result.data);
        const receipt = result.data.receipt;
        const detectedCategory = detectCategoryFromOCR(result.data.text, receipt?.storeName);
        const generatedTags = generateTagsFromOCR(result.data.text, receipt?.storeName, detectedCategory);
        
        setAddFormData(prev => ({
          ...prev,
          title: receipt?.storeName || 'Receipt Purchase',
          amount: (receipt?.amount || receipt?.total || 0).toString(),
          category: detectedCategory,
          description: `Receipt from ${receipt?.storeName || 'Store'} - ${receipt?.date || 'Unknown date'}`,
          source: 'ocr',
          tags: generatedTags,
          date: parseDateFromOCR(receipt?.date)
        }));
      } else {
        setError(result.message || 'Failed to process receipt');
      }
    } catch (err) {
      setError('Network error - please check your connection');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size too large. Maximum size is 10MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        await processOCRResult(event.target.result, file.name);
        setShowOCR(false);
        setShowAddForm(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (err) {
      setError('Camera access denied or not available');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!cameraStream) return;
    
    const video = document.getElementById('camera-video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();
    
    await processOCRResult(imageData, 'camera-capture.jpg');
    setShowOCR(false);
    setShowAddForm(true);
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const AddTransactionForm = () => (
    <div className="form-container">
      <div className="form-header">
        <h3>➕ Add New Transaction</h3>
        <button className="close-btn" onClick={() => setShowAddForm(false)}>×</button>
      </div>
      <form onSubmit={addTransaction}>
        <div className="form-grid">
          <div className="form-group">
            <label>📝 Transaction Title</label>
            <input
              type="text"
              placeholder="Enter transaction title"
              value={addFormData.title}
              onChange={(e) => setAddFormData(prev => ({...prev, title: e.target.value}))}
              required
              autoComplete="off"
              className="enhanced-input"
            />
          </div>

          <div className="form-group amount-group">
            <label>💰 Amount</label>
            <div className="amount-input-container">
              <input
                type="number"
                placeholder="0.00"
                value={addFormData.amount}
                onChange={(e) => setAddFormData(prev => ({...prev, amount: e.target.value}))}
                required
                min="0"
                step="0.01"
                autoComplete="off"
                className="amount-input enhanced-input"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="form-group">
            <label>🔄 Transaction Type</label>
            <select
              value={addFormData.type}
              onChange={(e) => setAddFormData(prev => ({...prev, type: e.target.value}))}
              className="enhanced-select"
            >
              <option value="expense">💸 Expense</option>
              <option value="income">💵 Income</option>
            </select>
          </div>

          <div className="form-group">
            <label>📂 Category</label>
            <div className="category-input-container">
              <select
                value={addFormData.category}
                onChange={(e) => setAddFormData(prev => ({...prev, category: e.target.value}))}
                required
                className="enhanced-select"
              >
                <option value="">Choose a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {addFormData.title && (
                <button
                  type="button"
                  className="ai-categorize-btn"
                  onClick={async () => {
                    if (!addFormData.title.trim()) return;
                    setLoading(true);
                    try {
                      const result = await transactionService.categorizeExpenseAI(addFormData.title);
                      if (result.success) {
                        setAddFormData(prev => ({...prev, category: result.data.category}));
                      }
                    } catch (error) {
                      console.error('Auto-categorization failed:', error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || !addFormData.title.trim()}
                  title="Auto-categorize using AI"
                >
                  🤖 AI
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>💱 Currency</label>
            <select
              value={addFormData.currency}
              onChange={(e) => setAddFormData(prev => ({...prev, currency: e.target.value}))}
              className="enhanced-select"
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>📅 Transaction Date</label>
            <input
              type="date"
              value={addFormData.date}
              onChange={(e) => setAddFormData(prev => ({...prev, date: e.target.value}))}
              max={new Date().toISOString().split('T')[0]}
              className="enhanced-input"
            />
          </div>

          <div className="form-group full-width">
            <label>🏷️ Tags (Optional)</label>
            <input
              type="text"
              placeholder="food, restaurant, lunch (separate with commas)"
              value={Array.isArray(addFormData.tags) ? addFormData.tags.join(', ') : ''}
              onChange={(e) => setAddFormData(prev => ({
                ...prev, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
              }))}
              autoComplete="off"
              className="enhanced-input"
            />
          </div>

          <div className="form-group full-width">
            <label>📄 Description (Optional)</label>
            <textarea
              placeholder="Add any additional notes about this transaction..."
              value={addFormData.description}
              onChange={(e) => setAddFormData(prev => ({...prev, description: e.target.value}))}
              rows="4"
              className="enhanced-textarea"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Adding...' : '✅ Add Transaction'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
            ❌ Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const EditTransactionForm = () => (
    <div className="form-container">
      <div className="form-header">
        <h3>✏️ Edit Transaction</h3>
        <button className="close-btn" onClick={() => { setShowEditForm(false); setEditingTransaction(null); }}>×</button>
      </div>
      <form onSubmit={updateTransaction}>
        <div className="form-grid">
          <div className="form-group">
            <label>📝 Transaction Title</label>
            <input
              type="text"
              placeholder="Enter transaction title"
              value={editFormData.title}
              onChange={(e) => setEditFormData(prev => ({...prev, title: e.target.value}))}
              required
              autoComplete="off"
              className="enhanced-input"
            />
          </div>

          <div className="form-group amount-group">
            <label>💰 Amount</label>
            <div className="amount-input-container">
              <input
                type="number"
                placeholder="0.00"
                value={editFormData.amount}
                onChange={(e) => setEditFormData(prev => ({...prev, amount: e.target.value}))}
                required
                min="0"
                step="0.01"
                autoComplete="off"
                className="amount-input enhanced-input"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="form-group">
            <label>🔄 Transaction Type</label>
            <select
              value={editFormData.type}
              onChange={(e) => setEditFormData(prev => ({...prev, type: e.target.value}))}
              className="enhanced-select"
            >
              <option value="expense">💸 Expense</option>
              <option value="income">💵 Income</option>
            </select>
          </div>

          <div className="form-group">
            <label>📂 Category</label>
            <select
              value={editFormData.category}
              onChange={(e) => setEditFormData(prev => ({...prev, category: e.target.value}))}
              required
              className="enhanced-select"
            >
              <option value="">Choose a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>💱 Currency</label>
            <select
              value={editFormData.currency}
              onChange={(e) => setEditFormData(prev => ({...prev, currency: e.target.value}))}
              className="enhanced-select"
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>📅 Transaction Date</label>
            <input
              type="date"
              value={editFormData.date}
              onChange={(e) => setEditFormData(prev => ({...prev, date: e.target.value}))}
              max={new Date().toISOString().split('T')[0]}
              className="enhanced-input"
            />
          </div>

          <div className="form-group full-width">
            <label>🏷️ Tags (Optional)</label>
            <input
              type="text"
              placeholder="food, restaurant, lunch (separate with commas)"
              value={Array.isArray(editFormData.tags) ? editFormData.tags.join(', ') : ''}
              onChange={(e) => setEditFormData(prev => ({
                ...prev, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
              }))}
              autoComplete="off"
              className="enhanced-input"
            />
          </div>

          <div className="form-group full-width">
            <label>📄 Description (Optional)</label>
            <textarea
              placeholder="Add any additional notes about this transaction..."
              value={editFormData.description}
              onChange={(e) => setEditFormData(prev => ({...prev, description: e.target.value}))}
              rows="4"
              className="enhanced-textarea"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Updating...' : '✅ Update Transaction'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => { setShowEditForm(false); setEditingTransaction(null); }}>
            ❌ Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const CurrencyConverterModal = () => (
    <div className="converter-container">
      <div className="form-header">
        <h3>💱 Currency Converter</h3>
        <button className="close-btn" onClick={() => { setShowCurrencyConverter(false); setConvertToCurrency(''); }}>×</button>
      </div>
      
      <div className="converter-content">
        <div className="current-currency-info">
          <div className="info-card">
            <span className="info-label">Current Display Currency</span>
            <span className="currency-badge">{baseCurrency}</span>
          </div>
        </div>

        <div className="currency-warning">
          <div className="warning-card">
            <div className="warning-header">
              <span className="warning-icon">⚠️</span>
              <h4>Currency Conversion Notice</h4>
            </div>
            <div className="warning-content">
              <p>• This will change how all transactions are displayed</p>
              <p>• Exchange rates are approximate and for display only</p>
              <p>• Original transaction currencies remain unchanged</p>
              <p>• You can switch back anytime</p>
            </div>
          </div>
        </div>

        <div className="converter-form">
          <div className="form-group">
            <label>🎯 Convert all transactions to</label>
            <select
              value={convertToCurrency}
              onChange={(e) => setConvertToCurrency(e.target.value)}
              className="currency-select enhanced-select"
            >
              <option value="">Select Currency</option>
              {currencies.filter(curr => curr !== baseCurrency).map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="converter-actions">
          <button 
            onClick={() => {
              if (!convertToCurrency) {
                setError('Please select a currency to convert to');
                return;
              }
              convertAllTransactions(convertToCurrency);
            }}
            disabled={!convertToCurrency || convertLoading}
            className="btn-primary"
          >
            {convertLoading ? '🔄 Converting...' : `💱 Convert to ${convertToCurrency}`}
          </button>
          <button onClick={() => { setShowCurrencyConverter(false); setConvertToCurrency(''); }} className="btn-secondary">
            ❌ Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const OCRComponent = () => (
    <div className="ocr-container">
      <div className="form-header">
        <h3>🤖 Smart Receipt Scanner</h3>
        <button className="close-btn" onClick={() => { setShowOCR(false); setOcrResult(null); }}>×</button>
      </div>
      
      {ocrLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>🔍 Processing receipt... Please wait</p>
        </div>
      )}

      {ocrResult && (
        <div className="ocr-result-container">
          <div className="success-header">
            <span className="success-icon">✅</span>
            <h4>Receipt Processed Successfully!</h4>
          </div>
          <div className="receipt-summary">
            <div className="receipt-details">
              <div className="detail-item">
                <span className="detail-label">🏪 Store:</span>
                <span className="detail-value">{ocrResult.receipt?.storeName || 'Unknown'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">💰 Total:</span>
                <span className="detail-value">{formatCurrency(ocrResult.receipt?.amount || ocrResult.receipt?.total || 0)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">📂 Category:</span>
                <span className="detail-value">{detectCategoryFromOCR(ocrResult.text, ocrResult.receipt?.storeName)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">📅 Date:</span>
                <span className="detail-value">{ocrResult.receipt?.date || 'Unknown'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">🎯 Confidence:</span>
                <span className="detail-value">{Math.round(ocrResult.confidence || 0)}%</span>
              </div>
            </div>
          </div>
          
          <div className="result-actions">
            <button 
              className="btn-primary"
              onClick={() => {
                setShowOCR(false);
                setShowAddForm(true);
              }}
            >
              ➕ Add Transaction
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setOcrResult(null)}
            >
              📷 Scan Another
            </button>
          </div>
        </div>
      )}

      {!ocrLoading && !ocrResult && !showCamera && (
        <div className="ocr-options">
          <div className="camera-tips-banner">
            <div className="tips-header">
              <span className="tips-icon">📸</span>
              <h4>Camera OCR Tips</h4>
            </div>
            <div className="tips-grid">
              <div className="tip-item">
                <span className="tip-icon">💡</span>
                <span className="tip-text">Use bright, natural lighting</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">📏</span>
                <span className="tip-text">Keep receipt flat and straight</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🎯</span>
                <span className="tip-text">Align receipt within green frame</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🤚</span>
                <span className="tip-text">Hold device steady</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🚫</span>
                <span className="tip-text">Avoid shadows and glare</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🔍</span>
                <span className="tip-text">Ensure text is clearly visible</span>
              </div>
            </div>
          </div>

          <div className="scan-methods">
            <div className="method-card primary-method">
              <div className="method-header">
                <span className="method-icon">📷</span>
                <h5>Scan with Camera</h5>
                <span className="recommended-badge">Recommended</span>
              </div>
              <p className="method-description">Take a photo directly with your camera for best results</p>
              <button 
                className="method-btn camera-btn"
                onClick={startCamera}
                disabled={ocrLoading}
              >
                📷 Open Camera
              </button>
            </div>
            
            <div className="method-divider">
              <span className="divider-text">OR</span>
            </div>
            
            <div className="method-card">
              <div className="method-header">
                <span className="method-icon">📁</span>
                <h5>Upload from Gallery</h5>
              </div>
              <p className="method-description">Choose an existing photo from your device</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <button 
                className="method-btn upload-btn"
                onClick={() => document.getElementById('file-upload').click()}
                disabled={ocrLoading}
              >
                📁 Upload from Gallery
              </button>
              <div className="upload-specs">
                <span className="spec-item">Max 10MB</span>
                <span className="spec-item">JPEG, PNG, WebP</span>
              </div>
            </div>
          </div>
          
          <div className="scan-tips">
            <h6>🎯 For Best OCR Accuracy</h6>
            <ul className="tips-list">
              <li>• Use camera mode for live preview</li>
              <li>• Clean camera lens before scanning</li>
              <li>• Capture entire receipt including totals</li>
              <li>• Retake if text appears blurry</li>
            </ul>
          </div>
        </div>
      )}

      {showCamera && cameraStream && (
        <div className="camera-controls">
          <div className="camera-preview">
            <video
              id="camera-video"
              className="camera-video"
              autoPlay
              playsInline
              ref={(video) => {
                if (video && cameraStream) {
                  video.srcObject = cameraStream;
                }
              }}
            />
            <div className="camera-overlay">
              <div className="scan-frame">
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>
              <div className="scan-instruction">Position receipt within the frame</div>
            </div>
          </div>
          <div className="camera-buttons">
            <button className="capture-btn" onClick={capturePhoto}>
              📷 Capture Receipt
            </button>
            <button className="stop-btn" onClick={stopCamera}>
              ❌ Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="transaction-page">
        <div className="page-header">
          <div className="header-content">
            <h1>💳 Transactions</h1>
            <p className="header-subtitle">Manage your financial transactions</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-converter"
              onClick={() => setShowCurrencyConverter(true)}
            >
              💱 Convert Currency
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setShowOCR(true)}
            >
              📷 Scan Receipt
            </button>
            <button 
              className="btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              ➕ Add Transaction
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className="filters-section">
          <div className="filters-container">
            <div className="filters-row">
              <div className="filter-group">
                <label>Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({...prev, type: e.target.value}))}
                >
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({...prev, category: e.target.value}))}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Currency</label>
                <select
                  value={filters.currency}
                  onChange={(e) => setFilters(prev => ({...prev, currency: e.target.value}))}
                >
                  <option value="">All Currencies</option>
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Search Tags</label>
                <input
                  type="text"
                  placeholder="Search by tags..."
                  value={filters.searchTags}
                  onChange={(e) => setFilters(prev => ({...prev, searchTags: e.target.value}))}
                />
              </div>
            </div>
            
            <div className="filters-row">
              <div className="filter-group">
                <label>From Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({...prev, startDate: e.target.value}))}
                />
              </div>

              <div className="filter-group">
                <label>To Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({...prev, endDate: e.target.value}))}
                />
              </div>
              
              <div className="filter-actions">
                <button className="clear-filters-btn" onClick={clearFilters}>
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>

        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <AddTransactionForm />
            </div>
          </div>
        )}

        {showEditForm && editingTransaction && (
          <div className="modal-overlay">
            <div className="modal-content">
              <EditTransactionForm />
            </div>
          </div>
        )}

        {showCurrencyConverter && (
          <div className="modal-overlay">
            <div className="modal-content">
              <CurrencyConverterModal />
            </div>
          </div>
        )}

        {showOCR && (
          <div className="modal-overlay">
            <div className="modal-content">
              <OCRComponent />
            </div>
          </div>
        )}

        <div className="transaction-list">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading transactions...</p>
            </div>
          ) : convertedTransactions.length === 0 ? (
            <div className="empty-state">
              <h3>No transactions found</h3>
              <p>Start by adding your first transaction</p>
              <button 
                className="btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                Add Transaction
              </button>
            </div>
          ) : (
            <>
              <div className="transactions-grid">
                {currentTransactions.map(transaction => (
                  <div key={transaction._id} className={`transaction-card ${transaction.type}`}>
                    <div className="transaction-header">
                      <h3>{transaction.title}</h3>
                      <span className={`type-badge ${transaction.type}`}>
                        {transaction.type}
                      </span>
                    </div>
                    
                    <div className="transaction-details">
                      <div className="amount-section">
                        <div className="main-amount">
                          <span className="amount-label">💰 Amount:</span>
                          <span className="amount-value">{formatCurrency(transaction.convertedAmount || transaction.amount, transaction.convertedCurrency || baseCurrency)}</span>
                        </div>
                        {transaction.originalCurrency && transaction.originalCurrency !== (transaction.convertedCurrency || baseCurrency) && (
                          <div className="original-amount">
                            <span className="original-label">Original:</span>
                            <span className="original-value">{formatCurrency(transaction.originalAmount || transaction.amount, transaction.originalCurrency)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">📂 Category:</span>
                          <span className="detail-value">{transaction.category}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">🔗 Source:</span>
                          <span className="detail-value">{transaction.source}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">📅 Date:</span>
                          <span className="detail-value">{new Date(transaction.timestamp || transaction.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {transaction.description && (
                        <div className="description-section">
                          <span className="detail-label">📄 Description:</span>
                          <p className="description-text">{transaction.description}</p>
                        </div>
                      )}
                      
                      {transaction.tags && transaction.tags.length > 0 && (
                        <div className="tags-section">
                          <span className="detail-label">🏷️ Tags:</span>
                          <div className="tag-list">
                            {transaction.tags.map((tag, index) => (
                              <span key={index} className="tag">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="transaction-actions">
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => startEdit(transaction)}
                      >
                        ✏️ Edit
                      </button>
                      
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this transaction?')) {
                            deleteTransaction(transaction._id);
                          }
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination-wrapper">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalRecords={convertedTransactions.length}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    showInfo={true}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Transaction;