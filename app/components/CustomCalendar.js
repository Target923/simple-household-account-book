'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';

import styles from './CustomCalendar.module.css';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import { IoTrashBin, IoCreate, IoMenu } from 'react-icons/io5';

/**
 * カスタムカレンダーコンポーネント
 * @param {object} props コンポーネントプロパティ
 * @param {Array<object>} props.expenses - 支出リスト
 * @param {function} props.setExpenses - 支出リスト更新関数
 * @param {Array<object>} props.categories - カテゴリリスト
 * @returns {JSX.Element} カレンダーコンポーネントのJSXエレメント
 */
export default function CustomCalendar({ expenses, setExpenses, categories, selectedDate, setSelectedDate, setEditingExpense, setIsEditMode }) {
    /**
     * 日付文字列をISO形式に変換するユーティリティ関数
     * @param {string | Date} dateValue - 日付/日付文字列
     * @returns {string} YYYY-MM-DD形式の日付文字列
     */
    const getISODateString = (dateValue) => {
        if (!dateValue) return '';
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    /**
     * 選択日付の支出リスト管理state
     * @type {[Array<object>, React.Dispatch<React.SetStateAction<Array>>]}
     */
    const [selectedDateExpenses, setSelectedDateExpenses] = useState(() => {
        if (!selectedDate) return [];
        const selectedDateStr = getISODateString(selectedDate);
        return expenses.filter(exp => getISODateString(exp.date) === selectedDateStr);
    });

    /**
     * フィルタリング用state
     */
    const [displayFilter, setDisplayFilter] = useState({
        type: 'total',
        categoryName: null,
    });

    /**
     * 展開中の支出ID管理state
     * @type {[string|null, React.Dispatch<React.SetStateAction<string|null>>]}
     */
    const [expandedExpenseId, setExpandedExpenseId] = useState(null);

    /**
     * ソート設定管理state
     */
    const [sortConfig, setSortConfig] = useState({
        field: 'date',
        direction: 'desc',
    });

    /**
     * ソート対象のインデックス
     */
    const [draggedExpenseIndex, setDraggedExpenseIndex] = useState(null);

    /**
     * ドラッグオーバー中の一時的な並べ替えリスト管理state
     */
    const [reorderedExpenses, setReorderedExpenses] = useState(selectedDateExpenses);

    const calendarRef = useRef(null);
    const externalEventRef = useRef(null);
    
    /**
     * カテゴリのカラーマップ管理Memo
     * @type {object}
     */
    const categoryColors = useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat.name] = cat.color;
            return acc;
        }, {});
    }, [categories]);

    /**
     * 支出編集開始ハンドラ
     * @param {object} expense - 編集対象の支出データ
     */
    const handleStartEdit = (expense) => {
        setEditingExpense(expense);
        setIsEditMode(true);

        const categorySection = document.querySelector('[data-category-form]');
        if (categorySection) {
            categorySection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    };

    /**
     * 支出リスト自動更新
     */
    useEffect(() => {
        if (!selectedDate) return;

        const selectedDateStr = getISODateString(selectedDate);
        const updatedList = expenses.filter( exp => {
            const expenseDateStr = getISODateString(exp.date);

            if (expenseDateStr !== selectedDateStr) return false;

            if (displayFilter.type === 'category' && displayFilter.categoryName) {
                return exp.selectedCategoryName.substring(0, 2) === displayFilter.categoryName;
            }

            return true;
        });

        updatedList.sort((a, b) => {
            const aSortOrder = a.sortOrder + 1 || Number.MAX_SAFE_INTEGER;
            const bSortOrder = b.sortOrder + 1 || Number.MAX_SAFE_INTEGER;
            return aSortOrder - bSortOrder;
        });

        setSelectedDateExpenses(updatedList);
        setReorderedExpenses(updatedList);
    }, [expenses, selectedDate, displayFilter, sortConfig]);

    /**
     * ソート切り替えUI
     */
    const renderSortControls = () => {
        const handleSortChange = (field) => {
            setSortConfig(prev => ({
                field,
                direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
            }));
        };
    };

    /**
     * 支出リストのドラッグ&ドロップハンドラ一覧
     */
    const handleExpenseDragStart = (e, index) => {
        setDraggedExpenseIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();

        e.dataTransfer.setData('text/plain', ''); // 空データでカレンダードロップを無効化
    };
    const handleExpenseDragOver = (e, dropIndex) => {
        e.preventDefault();

        if (draggedExpenseIndex === null || draggedExpenseIndex === dropIndex) {
            return;
        }

        const newExpenses = [...selectedDateExpenses];
        const draggedExpense = newExpenses[draggedExpenseIndex];

        newExpenses.splice(draggedExpenseIndex, 1);

        let newDropIndex = dropIndex;
        if (draggedExpenseIndex < dropIndex) {
            newDropIndex = dropIndex - 1;
        }

        newExpenses.splice(newDropIndex, 0, draggedExpense);

        setReorderedExpenses(newExpenses);
    };
    const handleExpenseDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const updatedAllExpenses = expenses.map(exp => {
            const foundIndex = reorderedExpenses.findIndex(newExp => newExp.id === exp.id);
            if (foundIndex !== -1) {
                return { ...reorderedExpenses[foundIndex], sortOrder: foundIndex };
            }
            return exp;
        });

        setExpenses(updatedAllExpenses);
        localStorage.setItem('expenses', JSON.stringify(updatedAllExpenses));
        setDraggedExpenseIndex(null);
        setReorderedExpenses(selectedDateExpenses);
    };
    const handleExpenseDragEnd = () => {
        setDraggedExpenseIndex(null);
    };

    /**
     * 合計/支出データを統合し、FullCalendarイベント形式に変換
     * @type {Array<object>}
     */
    const calendarEvents = useMemo(() => {
        const dailyTotals = expenses.reduce((acc, expense) => {
            const date = getISODateString(expense.date);
            if (date) {
                acc[date] = (acc[date] || 0) + Number(expense.amount);
            }
            return acc;
        }, {});
        const dailyTotalEvents = Object.keys(dailyTotals).map(date => ({
            id: `total-${date}`,
            title: `${dailyTotals[date]}円`,
            date: date,
            backgroundColor: 'azure',
            textColor: 'black',
            eventType: 'total',
            editable: false,
        }));

        const categoryTotals = expenses.reduce((acc, expense) => {
            const date = getISODateString(expense.date);
            const categoryName = expense.selectedCategoryName;

            if (date) {
                const key = `${date}-${expense.selectedCategoryName}`;
                if(acc[key]) {
                    acc[key].amount += Number(expense.amount);
                } else {
                    acc[key] = {
                        date: expense.date,
                        name: expense.selectedCategoryName,
                        amount: Number(expense.amount),
                        color: categoryColors[categoryName] || '#333',
                        id: key,
                        ids: [expense.id],
                    };
                }
            }
            return acc;
        }, {});
        const categoryTotalEvents = Object.values(categoryTotals).map(cat => ({
            id: cat.id,
            title: `${cat.name.substring(0, 2)}: ${cat.amount}円`,
            date: getISODateString(cat.date),
            backgroundColor: cat.color,
            textColor: 'black',
            eventType: 'category',
            editable: false,
        }));


        return [...dailyTotalEvents, ...categoryTotalEvents];
    }, [expenses, categoryColors]);

    /**
     * FullCalendarイベントソースを動的に更新
     */
    useEffect(() => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            setTimeout(() => {
                calendarApi.removeAllEvents();
                calendarApi.addEventSource(calendarEvents);
            }, 0);
        }
    }, [calendarEvents]);

    /**
     * イベントのドラッグ&ドロップハンドラ
     * @param {object} eventDropInfo - ドラッグ&ドロップイベント情報
     */
    const handleEventDrop = (eventDropInfo) => {
        if (eventDropInfo.event.extendedProps.eventType === 'total') {
            const newDate = eventDropInfo.event.startStr;
            const eventExpenseIds = eventDropInfo.event.extendedProps.ids;

            const updatedExpenses = expenses.map(exp => {
                if (eventExpenseIds.includes(exp.id)) {
                    return {
                        ...exp,
                        date: newDate,
                    }
                }
                return exp;
            });

            setExpenses(updatedExpenses);
            localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
        } else {
            eventDropInfo.revert();
            return;
        }
    };

    /**
     * 外部イベントをドラッグ可能にする
     */
    useEffect(() => {
        if (externalEventRef.current) {
            const draggable = new Draggable(externalEventRef.current, {
                itemSelector: '.draggable-expense',
                eventData: function(eventEl) {
                    try {
                        const parentLi = eventEl.closest('[data-expense]');
                        const data = JSON.parse(parentLi.getAttribute('data-expense'));
                        return {
                            ...data,
                            id: crypto.randomUUID(),
                            title: `${data.selectedCategoryName}: ${data.amount}円`,
                            editable: true,
                            eventType: 'total',
                        };
                    } catch (e) {
                        console.error('Failed to parse event data:', e);
                        return {};
                    }
                }
            });

            return () => draggable.destroy();
        }
    }, [externalEventRef]);

    /**
     * ドロップイベントハンドラ
     * FullCalendarへのドロップ時、
     * ドロップされた要素から支出データを取得し、新支出としてstateへ追加
     */
    const handleDrop = (dropInfo) => {
        const droppedElement = dropInfo.draggedEl;

        const expenseElement = droppedElement.closest('[data-expense]');

        const expenseData = JSON.parse(expenseElement.getAttribute('data-expense'));
        const newExpense = {
            ...expenseData,
            id: crypto.randomUUID(),
            date: dropInfo.dateStr,
        };

        const originalId = expenseData.id;
        const ExpensesWithoutOriginal = expenses.filter(exp => exp.id !== originalId);
        const updatedExpenses = [...ExpensesWithoutOriginal, newExpense];

        setExpenses(updatedExpenses);
        localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
    }

    /**
     * 日付クリックハンドラ
     * グラフ表示用
     * @param {object} dateClickInfo - 日付クリック情報
     */
    const handleDateClick = (dateClickInfo) => {
        const clickedDate = dateClickInfo.date;
        setSelectedDate(clickedDate);
        setDisplayFilter({ type: 'all', category: null });
    }

    /**
     * イベントクリックハンドラ
     * @param {object} eventClickInfo - イベントクリック情報
     */
    const handleEventClick = (eventClickInfo) => {
        const clickedEvent = eventClickInfo.event;
        const eventType = clickedEvent.extendedProps.eventType;

        setSelectedDate(clickedEvent.start);

        if (eventType === 'category') {
            const categoryName = clickedEvent.title.split(':')[0].trim();
            setDisplayFilter({ type: 'category', categoryName: categoryName })
        } else {
            setDisplayFilter({ type: 'total', categoryName: null });
        }
    };

    /**
     * 支出削除ハンドラ
     * @param {string} expenseId - 支出ID
     */
    const handleDeleteExpense = (expenseId) => {
        const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
        setExpenses(updatedExpenses);
        localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
    };

    /**
     * 合計と支出を一つのコンポーネントにまとめて描画
     * @param {object} eventInfo - イベント情報
     */
    const renderEventContent = (eventInfo) => {
        const { event } = eventInfo;
        const isTotal = event.extendedProps.eventType === 'total';

        return (
            <div
                className={styles.events}
                style={{
                    backgroundColor: isTotal ? 'azure' : event.backgroundColor,
                    borderColor: isTotal ? 'gold' : 'silver',
                    fontWeight: isTotal ? 'bold' : 'normal',
                    fontSize: isTotal ? '1.25em' : '1.1em',
                }}
                title={isTotal ? '内訳表示' : '詳細表示'}
            >
                {event.title}
            </div>
        );
    };

    /**
     * 選択日に適用するスタイルを渡す
     * @param {} arg - 
     * @returns 選択日付用CSSクラス
     */
    const applyDateCellClassName = (arg) => {
        if (selectedDate && arg.date) {
            const isSameDay = selectedDate.getFullYear() === arg.date.getFullYear() &&
                                selectedDate.getMonth() === arg.date.getMonth() &&
                                selectedDate.getDate() === arg.date.getDate();

            if (isSameDay) {
                return [styles['is-selected-date']];
            }
        }
        return [];
    };

    /**
     * アコーディオンの開閉制御
     * @param {string} expenseId - 支出Id
     */
    const handleToggleExpanded = (expenseId) => {
        setExpandedExpenseId(expandedExpenseId === expenseId ? null : expenseId);
    };

    /**
     * 支出一覧項目の描画関数
     * @param {object} exp - 支出データ
     * @returns {JSX.Element} 支出項目のJSX
     */
    const renderExpenseItem = (exp, index) => {
        const isExpanded = expandedExpenseId === exp.id;
        const hasMemo = exp.memo && exp.memo.trim() !== '';

        return (
            <li
                key={exp.id}
                className={`${styles.detailsItem} ${isExpanded ? styles.Expanded : ''}`}
                onClick={() => hasMemo && handleToggleExpanded(exp.id)}
                style={{
                    backgroundColor: categoryColors[exp.selectedCategoryName] || '#555',
                    cursor: hasMemo ? 'pointer' : 'default'
                }}
                data-expense={JSON.stringify(exp)}
                title={!isExpanded && hasMemo ? 'メモ確認' : ''}
                // draggable={true}
                // onDragStart={(e) => handleExpenseDragStart(e, index)}
                // onDragOver={(e) => handleExpenseDragOver(e, index)}
                // onDrop={handleExpenseDrop}
                // onDragEnd={handleExpenseDragEnd}
            >
                <div className={styles.detailsExpense}>
                    <div className={`${styles.detailsItemList} draggable-expense`}>
                        <div className={styles.detailsItemLeft}>
                            <p>{exp.selectedCategoryName}&nbsp;</p>
                        </div>
                        <div className={styles.detailsItemRight}>
                            <p>{exp.amount}円&nbsp;</p>
                            <IoCreate
                                className={styles.Button}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEdit(exp)
                                }}
                                title="編集"
                            />
                            <IoTrashBin
                                className={styles.Button}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteExpense(exp.id)
                                }}
                                title="削除"
                            />
                        </div>
                    </div>
                    <div
                        className={styles.dragHandle}
                        draggable={true}
                        onDragStart={(e) => {
                            e.stopPropagation();
                            handleExpenseDragStart(e, index);
                        }}
                        onDragOver={(e) => handleExpenseDragOver(e, index)}
                        onDrop={handleExpenseDrop}
                        onDragEnd={handleExpenseDragEnd}
                        title="並び替え"
                    >
                        <IoMenu />
                    </div>
                </div>

                {hasMemo && (
                    <div className={`${styles.memoSection} ${isExpanded ? styles.memoExpanded : styles.memoCollapsed}`}>
                        <div className={styles.memoContent}>
                            <p>{exp.memo}</p>
                        </div>
                    </div>
                )}
            </li>
        );
    };

    return (
        <div className={styles.mainContainer}>
            <div className={styles.calendarContainer}>
                <FullCalendar 
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale="ja"
                    headerToolbar={{
                        left: 'title',
                        center: '',
                        right: 'today,prev,next',
                    }}
                    buttonText={{
                        today: '今日'
                    }}
                    events={calendarEvents}
                    eventDisplay='block'
                    eventContent={renderEventContent}
                    eventOrder='-eventType' //逆アルファベット順
                    contentHeight='auto'
                    editable={true}
                    eventDrop={handleEventDrop}
                    eventClick={handleEventClick}
                    dateClick={handleDateClick}
                    timeZone='local'
                    droppable={true}
                    drop={handleDrop}
                    dayCellClassNames={applyDateCellClassName}
                    ref={calendarRef}
                    eventDidMount={(info) => {
                        info.el.style.border = 'none';
                    }}
                />
            </div>
            <div className={styles.detailsContainer} ref={externalEventRef}>
                {selectedDateExpenses.length > 0 && (
                    <h3 className={styles.detailsTitle}>
                        {new Date(selectedDateExpenses[0].date).toLocaleDateString()}の支出
                    </h3>
                )}
                <ul className={styles.detailsList}>
                    {reorderedExpenses.map((exp, index) => renderExpenseItem(exp, index))}
                </ul>
            </div>
        </div>
    );
}
