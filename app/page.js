'use client';
import '../app/globals.css'
import React, { useState, useEffect } from "react";
import { useQuery, QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { SessionProvider, useSession, signOut } from "next-auth/react";

import CategoryForm from "./components/CategoryForm";
import ExpenseForm from "./components/ExpenseForm";
import CustomCalendar from "./components/CustomCalendar";
import ExpenseChart from "./components/ExpenseChart";
import LoginForm from './components/LoginForm';

import { CATEGORY_COLORS } from "../../components/category_colors";

/**
 * QueryClientインスタンス作成
 */
const queryClient = new QueryClient();

/**
 * Providersコンポーネントを直接組み込む
 */
const AppProviders = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
};

/**
 * データ取得ロジックの関数定義
 */
async function fetchCategories() {
  const res = await fetch('/api/categories');
  if (!res.ok) {
    throw new Error('カテゴリーの取得に失敗しました');
  }
  return res.json();
}

async function fetchExpenses() {
  const res = await fetch('/api/expenses');
  if (!res.ok) {
    throw new Error('支出の取得に失敗しました');
  }
  const expenseData = await res.json();
  return expenseData.map(exp => ({
    ...exp,
    date: new Date(exp.date),
  }));
}

async function fetchBudgets() {
  const res = await fetch('/api/budgets');
  if (!res.ok) {
    throw new Error('予算データの取得に失敗しました');
  }
  return res.json();
}

/**
 * ホームコンポーネントロジック
 * @returns {JSX.Element} アプリケーションのJSXエレメント
 */
function HomeContent() {
  const { data: session, status } = useSession();

  const { data: categories, isPending: isCategoriesPending, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    enabled: status === 'authenticated', // 認証済みの場合
  });
  const { data: expenses, isPending: isExpensesPending, error: expensesError } = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
    enabled: status === 'authenticated',
  });
  const { data: budgets, isPending: isBudgetsPending, error: budgetsError } = useQuery({
    queryKey: ['budgets'],
    queryFn: fetchBudgets,
    enabled: status === 'authenticated',
  });

  /**
   * 支出データ管理state
   * @type {[Array<object>, React.Dispatch<React.SetStateAction<Array<object>>>]}
   */
  const [expenseData, setExpenseData] = useState({
    date: new Date(),
    amount: '',
    memo: '',
    selectedCategory: '',
    color: '',
  });

  /**
   * カレンダー選択日管理state
   * @type {[Date, React.Dispatch<React.SetStateAction<Date>>]}
   */
  const [selectedDate, setSelectedDate] = useState(new Date());

  /**
   * 編集中の支出データ管理state
   * @type {[object|null, React.Dispatch<React.SetStateAction<object|null>>]}
   */
  const [editingExpense, setEditingExpense] = useState(null);

  /**
   * 編集モードフラグ管理state
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
   */
  const [isEditMode, setIsEditMode] = useState(false);

  const createInititalCategoriesMutation = useMutation({
    mutationFn: async (initialCategories) => {
      await Promise.all(initialCategories.map(cat =>
        fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cat),
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
    }
  });

  useEffect(() => {
    if (status === 'authenticated' && !isCategoriesPending && categories && categories.length === 0) {
      const initialCategories = [
        { name: '食費', color: CATEGORY_COLORS[0], sortOrder: 0 },
        { name: '交通費', color: CATEGORY_COLORS[1], sortOrder: 1 },
        { name: '日用品', color: CATEGORY_COLORS[2], sortOrder: 2 },
      ];
      createInititalCategoriesMutation.mutate(initialCategories);
    }
  }, [status, isCategoriesPending, categories, createInititalCategoriesMutation]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  if (status === 'unauthenticated') {
    return (
      <main><LoginForm /></main>
    );
  }

  if (isCategoriesPending || isExpensesPending || isBudgetsPending) {
    return <div>データを読み込み中...</div>;
  }
  if (categoriesError || expensesError || budgetsError) {
    return <div>エラーが発生しました: {categoriesError?.message || expensesError?.message}</div>;
  }

  return (
    <main>
      <div className='header'>
        <h1>理想の家計簿</h1>
        <button onClick={() => signOut()}>ログアウト</button>
      </div>
      <hr />
      <CategoryForm
        categories={categories}
        budgets={budgets}
        expenseData={expenseData} setExpenseData={setExpenseData }
        editingExpense={editingExpense} setEditingExpense={setEditingExpense}
        isEditMode={isEditMode} setIsEditMode={setIsEditMode} />
      <ExpenseForm 
        categories={categories}
        expenses={expenses} 
        // setExpenses={setExpenses}
        expenseData={expenseData} setExpenseData={setExpenseData}
        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
        editingExpense={editingExpense} setEditingExpense={setEditingExpense}
        isEditMode={isEditMode} setIsEditMode={setIsEditMode} />
      <CustomCalendar
        expenses={expenses}
        categories={categories}
        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
        setEditingExpense={setEditingExpense} setIsEditMode={setIsEditMode} />
      <ExpenseChart
        expenses={expenses}
        // setExpenses={setExpenses}
        categories={categories}
        selectedDate={selectedDate} />
    </main>
  );
}

export default function Home() {
  return (
    <AppProviders>
      <HomeContent />
    </AppProviders>
  );
}