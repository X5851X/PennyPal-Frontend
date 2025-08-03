import React, { useState, useEffect } from 'react';
import { 
  DollarSignIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CreditCardIcon,
  PiggyBankIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  CalendarIcon,
  FilterIcon,
  DownloadIcon,
  EyeIcon,
  MoreHorizontalIcon
} from 'lucide-react';
import { BarChart, LineChart, PieChart, WeeklyLineChart } from '../../components/chart/chart';
import Layout from '../../components/layout';
import { authService } from '../../services/auth';
import './transaction.css';

const Transaction = () => {

  return (
    <Layout>
      <div className="transaction">
        <h1>Transaction</h1>
      </div>
    </Layout>
  );
}

export default Transaction;