'use client';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import styles from './CustomCalendar.module.css';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import { IoTrashBin, IoCreate, } from 'react-icons/io5';

/**
 * カスタムカレンダーコンポーネント
 * @param {object} props コンポーネントプロパティ
 * @param {Array<object>} props.expenses - 支出リスト
 * @param {Array<object>} props.categories - カテゴリリスト
 * @returns {JSX.Element} カレンダーコンポーネントのJSXエレメント
 */
export default function CustomCalendar({ expenses, categories, selectedDate, setSelectedDate, setEditingExpense, setIsEditMode }) {

    const queryClient = useQueryClient();

    // ================================
    // ユーティリティ関数
    // ================================

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

    // ================================
    // State管理
    // ================================
    
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
     * ドラッグオーバー中の一時的な並べ替えリスト管理state
     */
    const [reorderedExpenses, setReorderedExpenses] = useState(selectedDateExpenses);

    /**
     * ドラッグ中の支出インデックス管理state
     * @type {[number|null, React.Dispatch<React.SetStateAction<number|null>>]}
     */
    const [draggingItemIndex, setDraggingItemIndex] = useState(null);

    /**
     * ドラッグオーバー中のインデックス管理state
     * @type {[number|null, React.Dispatch<React.SetStateAction<number|null>>]}
     */
    const [dragOverItemIndex, setDragOverItemIndex] = useState(null);

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

    // ================================
    // Ref管理
    // ================================
    
    const calendarRef = useRef(null);
    const externalEventRef = useRef(null);

    // ================================
    // Memo計算
    // ================================

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
            name: cat.name,
            backgroundColor: cat.color,
            textColor: 'black',
            eventType: 'category',
            editable: false,
        }));

        const allEvents = [...dailyTotalEvents, ...categoryTotalEvents];

        allEvents.sort((a, b) => {
            const isATotal = a.eventType === 'total';
            const isBTotal = b.eventType === 'total';

            if (isATotal && isBTotal) return 0;
            if (isATotal) return -1;
            if (isBTotal) return 1;

            const indexA = categories.findIndex(cat => cat.name === a.name);
            const indexB = categories.findIndex(cat => cat.name === b.name);
            return (indexA !== -1 ? indexA : Number.MAX_SAFE_INTEGER) -
                    (indexB !== -1 ? indexB : Number.MAX_SAFE_INTEGER);
        });

        return allEvents;
    }, [expenses, categoryColors, categories]);

    // ================================
    // useMutationでデータ更新を定義
    // ================================

    /**
     * 支出削除用ミューテーション
     */
    const deleteMutation = useMutation({
        mutationFn: async (expenseId) => {
            const response = await fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '支出の削除に失敗しました');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['expenses']); // 支出データキャッシュを無効化
            setExpandedExpenseId(null);
        },
        onError: (error) => {
            alert(`${error.message}`);
            info.revert();
        }
    });

    /**
     * 支出更新用ミューテーション（日付移動/並び順）
     */
    const updateMutation = useMutation({
        mutationFn: async (updatedExpense) => {
            const response = await fetch(`/api/expenses/${updatedExpense.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedExpense),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '支出の更新に失敗しました');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['expenses']);
        },
        onError: (error) => {
            alert(`${error.message}`);
        }
    });

    /**
     * 新規支出作成用ミューテーション（ドロップ時）
     */
    const createMutation = useMutation({
        mutationFn: async (newExpenseData) => {
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Contant-Type': 'application/json' },
                body: JSON.stringify(newExpenseData),
            });
            if (!response.ok) {
                throw new Error('新規支出の作成に失敗しました');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['expenses']);
        },
        onError: (error) => {
            alert(`${error.message}`);
        }
    });

    // ================================
    // イベントハンドラ（編集・削除系）
    // ================================

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
     * 支出削除ハンドラ
     * @param {string} expenseId - 支出ID
     */
    const handleDeleteExpense = async (expenseId) => {
        if (confirm('この支出を削除しますか？')) {
            await deleteMutation.mutateAsync(expenseId);
        }
    };

    /**
     * アコーディオンの開閉制御
     * @param {string} expenseId - 支出Id
     */
    const handleToggleExpanded = (expenseId) => {
        setExpandedExpenseId(expandedExpenseId === expenseId ? null : expenseId);
    };

    // ================================
    // ドラッグ&ドロップハンドラ（マウスイベント系）
    // ================================

    /**
     * ドラッグ開始ハンドラ（マウスイベント）
     */
    const handleMounseDown = (e, index) => {
        setDraggingItemIndex(index);
        e.preventDefault();
    };

    /**
     * ドラッグ中のアイテム移動を処理するハンドラ（マウスイベント）
     */
    const handleMouseMove = useCallback((e) => {
        if (draggingItemIndex === null) return;
        
        const container = externalEventRef.current;
        if (!container) return;

        const items = Array.from(container.querySelectorAll(`li.${styles.detailsItem}`));
        let newIndex = items.findIndex(item => {
            const rect = item.getBoundingClientRect();
            return e.clientY >= rect.top && e.clientY <= rect.bottom &&
                    e.clientX >= rect.left && e.clientX <= rect.right;
        });

        if (newIndex !== -1 && newIndex !== dragOverItemIndex) {
            setDragOverItemIndex(newIndex);

            const newExpenses = [...reorderedExpenses];
            const [draggedItem] = newExpenses.splice(draggingItemIndex, 1);
            newExpenses.splice(newIndex, 0, draggedItem);

            setReorderedExpenses(newExpenses);
            setDraggingItemIndex(newIndex);
        }
 
    }, [draggingItemIndex, externalEventRef, dragOverItemIndex, reorderedExpenses]);

    /**
     * ドラッグ終了ハンドラ（マウスイベント）
     */
    const handleMouseUp = useCallback(async () => {
        if (draggingItemIndex === null) return;

        await Promise.all(
            reorderedExpenses.map(async (expense, index) => {
                if (expense.sortOrder !== index) {
                    const updatedExpense = {
                        ...expense,
                        sortOrder: index,
                    };
                    return updateMutation.mutateAsync(updatedExpense);
                }
            }).filter(p => p !== undefined)
        );
        setDraggingItemIndex(null);
        setDragOverItemIndex(null);
    }, [draggingItemIndex, reorderedExpenses, updateMutation]);

    // ================================
    // カレンダーイベントハンドラ
    // ================================

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
     * イベントのドラッグ&ドロップハンドラ
     * @param {object} info - ドラッグ&ドロップイベント情報
     */
    const handleEventDrop = async (info) => {
        if (info.event.extendedProps.eventType === 'total') {
            const newDate = info.event.startStr;
            const eventExpenseIds = info.event.extendedProps.ids;

            await Promise.all(
                expenses
                    .filter(exp => eventExpenseIds.includes(exp.id))
                    .map(expense => {
                        const updatedExpense = {
                            ...expense,
                            date: newDate,
                        };
                        return updateMutation.mutateAsync(updatedExpense);
                    })
            );
         } else {
            info.revert();
            return;
        }
    };

    /**
     * ドロップイベントハンドラ
     * FullCalendarへのドロップ時、
     * ドロップされた要素から支出データを取得し、新支出としてstateへ追加
     */
    const handleDrop = async (dropInfo) => {
        const droppedElement = dropInfo.draggedEl;
        const expenseData = JSON.parse(droppedElement.getAttribute('data-expense'));

        await deleteMutation.mutateAsync(expenseData.id);
        await createMutation.mutateAsync({
            date: dropInfo.dateStr,
            amount: expenseData.amount,
            memo: expenseData.memo,
            selectedCategoryName: expenseData.selectedCategoryName,
            sortOrder: expenses.length,
        });
    }

    // ================================
    // レンダリング関数
    // ================================

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
     * 支出一覧項目の描画関数
     * @param {object} exp - 支出データ
     * @returns {JSX.Element} 支出項目のJSX
     */
    const renderExpenseItem = (exp, index) => {
        const isExpanded = expandedExpenseId === exp.id;
        const hasMemo = exp.memo && exp.memo.trim() !== '';

        const isDragging = draggingItemIndex !== null && reorderedExpenses[draggingItemIndex]?.id === exp.id;
        const isDragOver = dragOverItemIndex === index;

        return (
            <li
                key={exp.id}
                className={`${styles.detailsItem} ${isExpanded ? styles.Expanded : ''} ${isDragging ? styles.isDragging : ''} ${isDragOver ? styles.isDragOver : ''}`}
                onClick={() => hasMemo && handleToggleExpanded(exp.id)}
                onMouseDown={(e) => handleMounseDown(e, index)}
                style={{
                    backgroundColor: categoryColors[exp.selectedCategoryName] || '#555',
                    cursor: hasMemo ? 'pointer' : 'default'
                }}
                data-expense={JSON.stringify(exp)}
                title={!isExpanded && hasMemo ? 'メモ確認' : ''}
            >
                <div className={styles.detailsExpense}>
                    <div className={styles.detailsItemList}>
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

    // ================================
    // useEffect（副作用処理）
    // ================================

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
    }, [expenses, selectedDate, displayFilter]);

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
     * マウスイベントリスナーをdocumentに登録/解除
     */
    useEffect(() => {
        if (draggingItemIndex !== null) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingItemIndex, handleMouseMove, handleMouseUp]);

    /**
     * 外部イベントをドラッグ可能にする(コンストラクタ)
     */
    useEffect(() => {
        if (externalEventRef.current) {
            const draggable = new Draggable(externalEventRef.current, {
                itemSelector: `.${styles.detailsItem}`,
                eventData: function(eventEl) {
                    try {
                        const data = JSON.parse(eventEl.getAttribute('data-expense'));
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

    // ================================
    // メインレンダー
    // ================================

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
                    eventOrder={false}
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