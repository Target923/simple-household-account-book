'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';

import styles from './CustomCalendar.module.css';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import { IoTrashBin, IoCreate } from 'react-icons/io5';

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
     * 選択日付の支出リスト管理state
     * @type {[Array<object>, React.Dispatch<React.SetStateAction<Array>>]}
     */
    const [selectedDateExpenses, setSelectedDateExpenses] = useState([]);

    /**
     * 展開中の支出ID管理state
     * @type {[string|null, React.Dispatch<React.SetStateAction<string|null>>]}
     */
    const [expandedExpenseId, setExpandedExpenseId] = useState(null);

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
            title: `合計: ${dailyTotals[date]}円`,
            date: date,
            backgroundColor: 'azure',
            borderColor: 'gold',
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
            title: `${cat.name}: ${cat.amount}円`,
            date: getISODateString(cat.date),
            backgroundColor: cat.color,
            borderColor: 'silver',
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
        if (eventDropInfo.event.extendedProps.eventType === 'expense') {
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
                        const data = JSON.parse(eventEl.getAttribute('data-expense'));
                        return {
                            ...data,
                            id: crypto.randomUUID(),
                            title: `${data.selectedCategoryName}: ${data.amount}円`,
                            editable: true,
                            eventType: 'expense',
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
        const expenseData = JSON.parse(droppedElement.getAttribute('data-expense'));

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

        setSelectedDateExpenses(prev => prev.filter(exp => exp.id !== originalId));
    }

    /**
     * 日付クリックハンドラ
     * グラフ表示用
     * @param {object} dateClickInfo - 日付クリック情報
     */
    const handleDateClick = (dateClickInfo) => {
        const clickedDate = dateClickInfo.date;
        setSelectedDate(clickedDate);
    }

    /**
     * イベントクリックハンドラ
     * @param {object} eventClickInfo - イベントクリック情報
     */
    const handleEventClick = (eventClickInfo) => {
        const clickedEvent = eventClickInfo.event;
        const clickedDate = clickedEvent.startStr;
        const eventType = clickedEvent.extendedProps.eventType;
        const eventId = clickedEvent.id;

        let expensesToDisplay = [];

        if (eventType === 'total') {
            expensesToDisplay = expenses.filter(
                exp => getISODateString(exp.date) === clickedDate
            );
        } else if (eventType === 'category') {
            expensesToDisplay = expenses.filter(
                exp => getISODateString(exp.date) === clickedDate &&
                    `${getISODateString(exp.date)}-${exp.selectedCategoryName}` === eventId
            );
        }

        setSelectedDateExpenses(expensesToDisplay);
        setSelectedDate(clickedEvent.start);
    };

    /**
     * 支出削除ハンドラ
     * @param {string} expenseId - 支出ID
     */
    const handleDeleteExpense = (expenseId) => {
        const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
        setExpenses(updatedExpenses);
        localStorage.setItem('expenses', JSON.stringify(updatedExpenses));

        const newSelectedExpenses = updatedExpenses.filter(
            exp => getISODateString(exp.date) ===
                getISODateString(selectedDateExpenses[0]?.date)
        );
        setSelectedDateExpenses(newSelectedExpenses);
    };

    /**
     * 合計と支出を一つのコンポーネントにまとめて描画
     * @param {object} eventInfo - イベント情報
     */
    const renderEventContent = (eventInfo) => {
        const { event } = eventInfo;
        const isTotal = event.extendedProps.eventType === 'total';
        const eventClass = isTotal ? 'event-total' : 'event-category';

        return (
            <div className={`${styles[eventClass]}`} style={{
                backgroundColor: isTotal ? 'azure' : event.backgroundColor,
                color: 'black',
                border: '1px solid',
                borderColor: isTotal ? 'gold' : 'silver',
                padding: '2px 4px',
                marginBottom: '1px',
                borderRadius: '4px',
                display: 'block',
                fontWeight: isTotal ? 'bold' : 'normal',
                fontSize: isTotal ? '1.25em' : '1.1em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
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
    const renderExpenseItem = (exp) => {
        const isExpanded = expandedExpenseId === exp.id;
        const hasMemo = exp.memo && exp.memo.trim() !== '';

        return (
            <li
                key={exp.id}
                className={`${styles.detailsItem} draggable-expense ${isExpanded ? styles.Expanded : ''}`}
                onClick={() => hasMemo && handleToggleExpanded(exp.id)}
                style={{
                    backgroundColor: categoryColors[exp.selectedCategoryName] || '#555',
                    cursor: hasMemo ? 'pointer' : 'default'
                }}
                data-expense={JSON.stringify(exp)}
                title={!isExpanded && hasMemo ? 'メモを見る' : ''}
            >
                <div className={styles.detailsExpense}>
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
                />
            </div>
            <div className={styles.detailsContainer} ref={externalEventRef}>
                {selectedDateExpenses.length > 0 && (
                    <h3 className={styles.detailsTitle}>
                        {new Date(selectedDateExpenses[0].date).toLocaleDateString()}の支出
                    </h3>
                )}
                <ul className={styles.detailsList}>
                    {selectedDateExpenses.map(exp => renderExpenseItem(exp))}
                </ul>
            </div>
        </div>
    );
}
