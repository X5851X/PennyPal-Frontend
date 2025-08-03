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
import './analytic.css';

const analytic = () => {

  return (
    <Layout>
      <div className="analytic">
        <h1>Analytic</h1>
      </div>
    </Layout>
  );
}

export default analytic;