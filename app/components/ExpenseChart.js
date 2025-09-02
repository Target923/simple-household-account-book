/**
 * @file ExpenseList.js
 * @description 月または日付毎の支出を予算グラフと円グラフで集計するコンポーネント
 * FullCalendarの月切り替えと連携した予算管理機能を提供
 */

'use client';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';

import styles from './ExpenseChart.module.css';
import { CATEGORY_COLORS } from './colors';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { PieChart, Pie } from 'recharts';

/**
 * 支出とカテゴリーデータを基に、円グラフと予算グラフを表示するコンポーネント
 * @param {object} props - コンポーネントプロパティ
 * @param {Array<object>} props.expenses - 支出リスト
 * @param {function} props.setExpenses - 支出リスト更新関数
 * @param {Array<object>} props.categories - カテゴリーリスト
 * @param {Date} props.selectedDate - 選択された日付
 * @returns {JSX.Element} 支出チャートコンポーネント
 */
export default function ExpenseList({ expenses, setExpenses, categories, selectedDate, }) {
    /**
     * 日付文字列をISO形式に変換するユーティリティ関数
     * @param {string | Date} dateValue - 日付/日付文字列
     * @returns {string} YYYY-MM-DD形式の日付文字列
     */
    const getISODateString = (dateValue) => {
        if (dateValue instanceof Date) {
            return dateValue.toISOString().split('T')[0];
        }
        return dateValue.split('T')[0];
    };

    /**
     * 予算データの状態管理state
     * 各カテゴリの月別予算情報を管理
     * @type {[Array<object>, React.Dispatch<React.SetStateAction<Array<object>>>]}
     */
    const [budgets, setBudgets] = useState([]);

    /**
     * 円グラフの表示モード状態管理（'day' または 'month'）
     * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
     */
    const [displayMode, setDisplayMode] = useState('month');

    /**
     * 予算入力フォームの表示状態管理
     * @type {[string|null, React.Dispatch<React.SetStateAction<string|null>>]}
     */
    const [editingBudgetId, setEditingBudgetId] = useState(null);

    /**
     * 予算入力値の状態管理
     * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
     */
    const [budgetInputValue, setBudgetInputValue] = useState('');

    /**
     * 特定の月とカテゴリの支出合計を計算する関数
     * @param {string} categoryName - カテゴリ名
     * @param {string} targetMonth - 対象月（YYYY-MM形式）
     * @returns {number} 支出合計
     */
    const calculateCategoryExpenseForMonth = useCallback((categoryName, targetMonth) => {
        return expenses
            .filter(expense => {
                const expenseMonth = getISODateString(expense.date).substring(0, 7);
                return expense.selectedCategoryName === categoryName &&
                        expenseMonth === targetMonth;
            })
            .reduce((total, expense) => total + Number(expense.amount), 0);
    }, [expenses]);

    /**カテゴリの予算状況を計算する関数（メイン関数）
     * @param {string} targetMonth - 対象月
     * @returns {Array} カテゴリ毎の予算状況
     */
    const calculateBudgetStatus = useCallback((targetMonth) => {
        return categories.map(category => {
            const budget = budgets.find(b =>
                b.categoryId === category.id && b.month === targetMonth
            );

            if (!budget) {
                return {
                    categoryId: category.id,
                    categoryName: category.name,
                    color: category.color,
                    hasBudget: false,
                    budgetAmount: 0,
                    totalExpense: 0,
                    usagePercentage: 0,
                    remainingBudget: 0,
                };
            }

            const totalExpense = calculateCategoryExpenseForMonth(
                category.name, targetMonth
            );
            const usagePercentage = budget.amount === 0 ? 0 :
                Math.round(totalExpense / budget.amount * 100);
            const usagePercentageForGraph = budget.amount === 0 ? 0 :
                Math.min(100, Math.round(totalExpense / budget.amount * 100));
            const remainingBudget = budget.amount - totalExpense;

            return {
                categoryId: category.id,
                categoryName: category.name,
                color: category.color,
                hasBudget: true,
                budgetAmount: budget.amount,
                totalExpense: totalExpense,
                usagePercentage: usagePercentage,
                usagePercentageForGraph: usagePercentageForGraph,
                remainingBudget: remainingBudget,
            };
        });
    }, [budgets, categories, calculateCategoryExpenseForMonth]);

    /**
     * 予算をローカルストレージに保存
     * @param {Array<object>} newBudgets - 新予算データ
     */
    const saveBudgetsToLocalStorage = useCallback((newBudgets) => {
        setBudgets(newBudgets);
        localStorage.setItem('budgets', JSON.stringify(newBudgets));
    }, []);

    /**
     * 現在の月を取得
     * @type {string} YYYY-MM形式の現在月
     */
    const currentMonth = useMemo(() => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }, [selectedDate]);

    /**
     * 予算設定/更新関数
     * @param {string} categoryId - カテゴリID
     * @param {string} categoryName - カテゴリ名
     * @param {number} amount - 予算額
     */
    const handleSetBudget = useCallback((categoryId, categoryName, amount) => {
        const existingBudgetIndex = budgets.findIndex(b =>
            b.categoryId === categoryId && b.month === currentMonth
        );

        let newBudgets;
        if (existingBudgetIndex >= 0) {
            newBudgets = [...budgets];
            newBudgets[existingBudgetIndex] = {
                ...newBudgets[existingBudgetIndex],
                amount: amount
            };
        } else {
            const newBudget = {
                categoryId: categoryId,
                categoryName: categoryName,
                amount: amount,
                month: currentMonth
            };
            newBudgets = [...budgets, newBudget];
        }

        saveBudgetsToLocalStorage(newBudgets);
        setEditingBudgetId(null);
        setBudgetInputValue('');
    }, [budgets, currentMonth, saveBudgetsToLocalStorage]);

    /**
     * 予算編集開始
     * @param {string} categoryId - カテゴリID
     * @param {number} currentAmount - 現在の予算額
     */
    const startEditingBudget = useCallback((categoryId, currentAmount = '') => {
        setEditingBudgetId(categoryId);
        setBudgetInputValue(String(currentAmount));
    }, []);

    /**
     * 予算状態データを更新
     * @type {Array<object>} カテゴリ毎の予算状況
     */
    const budgetStatusData = useMemo(() => {
        return calculateBudgetStatus(currentMonth);
    }, [calculateBudgetStatus, currentMonth]);

    /**
     *  ローカルストレージから予算データ読み込み
     */
    useEffect(() => {
        const storedBudgets = localStorage.getItem('budgets');
        if (storedBudgets) {
            setBudgets(JSON.parse(storedBudgets));
        }
    }, []);

    /**
     * 予算グラフ用データ生成関数
     * @return {Array<object>} 予算グラフ用データ
     */
    const budgetChartData = useMemo(() => {
        return budgetStatusData
            .filter(status => status.hasBudget)
            .map(status => ({
                categoryId: status.categoryId,
                categoryName: status.categoryName,
                shortCategoryName: status.categoryName.substring(0, 2),
                budgetAmount: status.budgetAmount,
                totalExpense: status.totalExpense,
                usagePercentage: status.usagePercentage,
                usagePercentageForGraph: status.usagePercentageForGraph,
                remainingBudget: Math.max(0, status.remainingBudget),
                overExpense: Math.max(0, -status.remainingBudget),
                color: status.color,
                isOverBudget: status.remainingBudget < 0,
            }));
    }, [budgetStatusData]);

    /**
     * 予算グラフ描画用
     * @returns {JSX.Element} 予算棒グラフコンポーネント
     */
    const renderBudgetChart = () => {
        if (budgetChartData.length === 0) {
            return (
                <div>
                    <p>予算が設定されていません</p>
                </div>
            );
        }

        const handleBarClick = (data) => {
            if (data && data.payload) {
                const { categoryId, budgetAmount } = data.payload;
                startEditingBudget(categoryId, budgetAmount);
            }
        };

        return (
            <ResponsiveContainer width="100%" height="40%">
                <BarChart
                    data={budgetChartData}
                    layout="vertical"
                    margin={{ top: 20, right: 20, left: -55, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke='silver'/>
                    <XAxis
                        type="number"
                        domain={[0, 100]}
                        stroke='goldenrod'
                        fontWeight='bold'
                    />
                    <YAxis
                        type="category"
                        dataKey="shortCategoryName"
                        width={100}
                        fontSize={15}
                        stroke='silver'
                        fontWeight='bold'
                    />
                    <Tooltip
                        formatter={(value, name) => {
                            if (name === 'usagePercentageForGraph') return [`${value}%`, '使用率'];
                            return [value, name];
                        }}
                        labelFormatter={(label, payload) => {
                            if (payload && payload.length > 0) {
                                return payload[0].payload.categoryName;
                            }
                            return label;
                        }} 
                        labelStyle={{ color: 'azure', fontWeight: 'bold'}}
                        itemStyle={{ color: 'goldenrod', fontWeight: 'bold'}}
                        contentStyle={{ backgroundColor: '#555', border: 'none' }}
                    />
                    <legend />

                    <Bar dataKey="usagePercentageForGraph" onClick={handleBarClick} style={{ cursor: 'pointer' }}>
                        {
                            budgetChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                        }
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    };

    /**
     * 予算ボタンエリア描画関数
     * @returns {JSX.Element} 予算設定UI
     */
    const renderBudgetSettings = () => {
        return (
            <div className={styles.budgetsContainer}>
                <div>
                    <h4 className={styles.budgetsListTitle}>カテゴリ予算別設定</h4>
                </div>
                <div className={styles.budgetsListContainer}>
                    {categories.map(category => {
                        const budgetStatus = budgetStatusData.find(bs => bs.categoryId === category.id);
                        const isEditing = editingBudgetId === category.id;

                        return (
                            <div
                                key={category.id}
                                className={styles.budgetsForm}
                                style={{backgroundColor: category.color}}
                            >
                                <span className={styles.budgetsCategoryName}>
                                    {category.name}
                                </span>

                                {isEditing ? (
                                    <div className={styles.budgetDetails}>
                                        <input
                                            type="number"
                                            value={budgetInputValue}
                                            onChange={(e) => setBudgetInputValue(e.target.value)}
                                            placeholder="予算額"
                                        />
                                        <div
                                            className={styles.budgetDetailsButton}
                                            onClick={() => handleSetBudget(category.id, category.name, Number(budgetInputValue))}
                                        >
                                            保存
                                        </div>
                                        <div
                                            className={styles.budgetDetailsButton}
                                            onClick={() => setEditingBudgetId(null)}
                                        >
                                            キャンセル
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.budgetDetails}>
                                        {budgetStatus?.hasBudget ? (
                                            <>
                                                <div className={styles.budgetDetailsItem}>
                                                    予算: {budgetStatus.budgetAmount}円
                                                </div>
                                                <div className={styles.budgetDetailsItem}>
                                                    支出: {budgetStatus.totalExpense}円
                                                </div>
                                                <div
                                                    className={styles.budgetDetailsItem}
                                                    style={{color: budgetStatus.remainingBudget < 0 ? 'darkred' : 'black'}}
                                                >
                                                    使用率: {budgetStatus.usagePercentage}%
                                                </div>
                                                <div
                                                    className={styles.budgetDetailsButton}
                                                    onClick={() => startEditingBudget(category.id, budgetStatus.budgetAmount)}
                                                >
                                                    編集
                                                </div>
                                            </>
                                        ) : (
                                            <div
                                                className={styles.budgetDetailsButton}
                                                onClick={() => startEditingBudget(category.id)}
                                            >
                                                予算設定
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    /**
     * 選択された日付に一致する支出をフィルタリング（円グラフ用）
     * @type {Array<object>} 選択日の支出
     */
    const filteredExpenses = useMemo(() => {
        if (!selectedDate) {
            return [];
        }

        if (displayMode === 'month') {
            const selectedMonth = selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0');
            return expenses.filter(expenseData => {
                const expenseMonth = getISODateString(expenseData.date).substring(0, 7);
                return expenseMonth === selectedMonth;
            });
        }

        return expenses.filter(expenseData => {
                const expenseDate = new Date(expenseData.date);
                return expenseDate.getFullYear() === selectedDate.getFullYear() &&
                        expenseDate.getMonth() === selectedDate.getMonth() &&
                        expenseDate.getDate() === selectedDate.getDate();
        });
    }, [expenses, selectedDate, displayMode]);

    /**
     * カテゴリ毎の金額の集計データ（円グラフ用）
     * @type {Array<{name: string, value: number, color: string}>}
     */
    const aggregatedData = useMemo(() => {
        return filteredExpenses.reduce((acc, expenseData) => {
            const existingCategory = acc.find(item => item.name === expenseData.selectedCategoryName);
            const categoryColor = categories.find(cat => cat.name === expenseData.selectedCategoryName)?.color;

            const colorToUse = categoryColor || CATEGORY_COLORS[acc.length % CATEGORY_COLORS.length];

            if (existingCategory) {
                existingCategory.value += Number(expenseData.amount);
            } else {
                acc.push({
                    name: expenseData.selectedCategoryName,
                    value: Number(expenseData.amount),
                    color: colorToUse,
                });
            }

            return acc;
        }, []);
    }, [filteredExpenses, categories]);

    /**
     * 円グラフのカスタムラベル描画関数
     * @param {object} props - Rechartsが提供するプロパティ(中心座標、半径、割合、etc...)
     * @returns {JSX.Element|null} SVGの<text>要素またはnull
     */
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.65;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        const data = aggregatedData[index];
        if (!data) return null;

        const percentage = (percent * 100).toFixed(0);

        if (percentage === '0') return null;

        return (
            <text x={x} y={y} fill="black" textAnchor={"middle"} dominantBaseline="central">
            <tspan x={x} dy="-0.5em">{`${data.name} ${percentage}%`}</tspan>
            <tspan x={x} dy="1em">{`${data.value}円`}</tspan>
            </text>
        );
    };

    /**
     * 円グラフのサイズ管理
     */
    const pieChartRef = useRef(null);
    const [pieChartSize, setPieChartSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const handleResize = () => {
            if (pieChartRef.current) {
                setPieChartSize({
                    width: pieChartRef.current.clientWidth,
                    height: pieChartRef.current.clientHeight,
                });
            }
        };

        handleResize();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    /**
     * 円グラフ描画関数
     * @returns {JSX.Element} 円グラフコンポーネント
     */
    const renderPieChart = () => {
        if (filteredExpenses.length === 0) {
            return <h1>No Data</h1>;
        }

        const filteredData = aggregatedData.filter(d => d.value > 0);
        const { width, height } = pieChartSize;

        if (width === 0 || height === 0) {
            return null;
        }
        const outerRadius = Math.min(width, height * 0.85) / 2 - 25;

        return (
            <ResponsiveContainer width="100%" height="95%">
                <PieChart width={width} height={height} className={styles.customPieChart}>
                    <Pie
                        data={filteredData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={outerRadius}
                        fill="#8884d8"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        startAngle={-270}
                        endAngle={-630}
                    >
                        {
                            filteredData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                        }
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        );
    };

    /**
     * 支出削除関数()
     * @param {string} expenseId - 削除ID
     */
    function handleDeleteExpense(expenseDataId) {
        const updateExpenses = expenses.filter(expenseData => expenseData.id !== expenseDataId);
        setExpenses(updateExpenses);
        localStorage.setItem('expenses', JSON.stringify(updateExpenses));
    }

    /**
     * トグルボタンのクリックハンドラ
     * @returns {void}
     */
    const handleToggleClick = () => {
        setDisplayMode(prevMode => (prevMode === 'day' ? 'month' : 'day'));
    };

    return (
        <div className={styles.expenseListContainer}>
            <div className={styles.budgetsList}>
                <h3 className={styles.graphTitle}>予算管理グラフ {currentMonth}</h3>

                {renderBudgetChart()}
                {renderBudgetSettings()}
            </div>         
            <div ref={pieChartRef} className={styles.pieChart}>
                <div className={styles.chartTitleContainer}>
                    <h3 className={styles.graphTitle}>
                        支出内訳: {displayMode === 'day' ? selectedDate.toISOString().substring(0, 10) : currentMonth}
                    </h3>
                    <div
                        className={styles.toggleButton}
                        onClick={handleToggleClick}
                    >
                        {displayMode === 'day' ? '日別' : '月別'}
                    </div>
                </div>

                {renderPieChart()}
            </div>
        </div>
    );
}