import React, { useState, useEffect } from "react";
import { useTable, useFilters, useSortBy } from 'react-table'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const useSortableTable = () => {

    function Table({ columns, data, filter, sort }) {

        const filterTypes = React.useMemo(
            () => ({
                // Text filter that sorts using "startsWith"
                textStart: (rows, id, filterValue) => {
                    return rows.filter(row => {
                        const rowValue = row.values[id]
                        return rowValue !== undefined
                            ? String(rowValue)
                                .toLowerCase()
                                .startsWith(String(filterValue).toLowerCase())
                            : true
                    })
                },
                // Filter cells that have a "data-filter" attribute on the top element containing the text "[{filterValue}]" (brackets included), e.g. <span data-filter="[active][new]">...</span> will match filters "active" and "new" but not others
                dataFilter: (rows, id, filterValue) => {
                    return rows.filter(row => {
                        const rowValue = row.values[id]

                        if (rowValue && rowValue.props && rowValue.props['data-filter']) {
                            console.log(rowValue.props['data-filter'])
                            var dataFilter = rowValue.props['data-filter'];

                            return dataFilter.indexOf('[' + filterValue + ']') >= 0;
                        }
                        else {
                            return false;
                        }
                    })
                },
                // Filter cells of array data type, where the filter value must be an item in the array
                arrayContainsFilter: (rows, id, filterValue) => {
                    return rows.filter(row => {
                        const rowValue = row.values[id]

                        if (rowValue && rowValue.length) {
                            return rowValue.includes(filterValue);
                        }
                        else {
                            return false;
                        }
                    })
                },
                // Filter cells that have the filter value as an item in a comma-separated list, e.g. 'one,three' will match filter values "one" and "three", but not "ne" or any other value
                listContainsFilter: (rows, id, filterValue) => {
                    return rows.filter(row => {
                        const rowValue = row.values[id]

                        if (rowValue) {
                            const allValues = rowValue.split(",");
                            return allValues.includes(filterValue);
                        }
                        else {
                            return false;
                        }
                    })
                },

            }),
            []
        )

        const sortTypes = React.useMemo(
            () => ({
                // Text sort with ignore case
                textIgnoreCase: (rowA, rowB, columnId) => {

                    const a = rowA.original[columnId].toLowerCase()

                    const b = rowB.original[columnId].toLowerCase()

                    if (a > b)
                        return 1

                    if (b > a)
                        return -1

                    return 0
                },
                // Text sort for array elements
                array: (rowA, rowB, columnId) => {

                    const aArray = rowA.original[columnId];

                    const bArray = rowB.original[columnId];

                    let a, b;

                    if (aArray && aArray.length) {
                        a = aArray.join('');
                    }
                    else {
                        a = '';
                    }

                    if (bArray && bArray.length) {
                        b = bArray.join('');
                    }
                    else {
                        b = '';
                    }

                    if (a > b)
                        return 1

                    if (b > a)
                        return -1

                    return 0
                }
            }),
            []
        )

        // Define a default UI for filtering
        function DefaultColumnFilter({
            column: { filterValue, preFilteredRows, setFilter },
        }) {
            const count = preFilteredRows.length

            return (
                <input
                    className="border"
                    value={filterValue || ''}
                    onChange={e => {
                        setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
                    }}
                    placeholder={`Search ${count} records...`}
                />
            )
        }

        const defaultColumn = React.useMemo(
            () => ({
                // Let's set up our default Filter UI
                Filter: DefaultColumnFilter,
            }),
            []
        )
        var plugins = [];
        if (filter) {
            plugins.push(useFilters);
        }
        if (sort) {
            plugins.push(useSortBy);
        }

        // Use the state and functions returned from useTable to build your UI
        const {
            getTableProps,
            getTableBodyProps,
            headerGroups,
            rows,
            prepareRow,
        } = useTable({
            columns,
            data,
            defaultColumn,
            filterTypes,
            sortTypes
        }, ...plugins);

        // Render the UI for your table
        return (
            <table className="table" {...getTableProps()}>
                <thead>
                    {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => (
                                <th {...column.getHeaderProps({
                                    className: column.className
                                })} style={{ verticalAlign: 'top' }}>
                                    {sort ?
                                        <div {...column.getSortByToggleProps()} style={{ cursor: 'pointer' }}>
                                            <span className="float-right">
                                                {column.isSorted
                                                    ? column.isSortedDesc
                                                        ? <FontAwesomeIcon icon="caret-down" />
                                                        : <FontAwesomeIcon icon="caret-up" />
                                                    : ''}
                                            </span>
                                            {column.render('Header', column.getSortByToggleProps())}
                                        </div>
                                        : column.render('Header')
                                    }
                                    {filter &&
                                        <div>{column.canFilter ? column.render('Filter') : null}</div>
                                    }
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {rows.map((row, i) => {
                        prepareRow(row)
                        return (
                            <tr {...row.getRowProps()}>
                                {row.cells.map(cell => {
                                    return <td {...cell.getCellProps({
                                        className: cell.column.className
                                    })}>{cell.render('Cell')}</td>
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        )
    }

    // This is a custom filter UI for selecting
    // a unique option from a list
    function SelectColumnFilter({
        column: { filterValue, setFilter, preFilteredRows, id },
    }) {
        // Calculate the options for filtering
        // using the preFilteredRows
        const options = React.useMemo(() => {
            const options = new Set()
            preFilteredRows.forEach(row => {
                options.add(row.values[id])
            })
            return [...options.values()]
        }, [id, preFilteredRows])

        // Render a multi-select box
        return (
            <select className="border"
                value={filterValue}
                onChange={e => {
                    setFilter(e.target.value || undefined)
                }}
            >
                <option value="">All</option>
                {options.map((option, i) => (
                    <option key={i} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        )
    }

    // Create a select filter with pre-defined options (array of Option objects)
    function makeSelectColumnFilter(options) {
        return ({
            column: { filterValue, setFilter, preFilteredRows, id },
        }) => {
            // Render a multi-select box
            return (
                <select className="border"
                    value={filterValue}
                    onChange={e => {
                        setFilter(e.target.value || undefined)
                    }}
                >
                    <option value="">All</option>
                    {options.map((option, i) => (
                        <option key={i} value={option.value}>
                            {option.text}
                        </option>
                    ))}
                </select>
            )
        }
    }

    return { Table, SelectColumnFilter, makeSelectColumnFilter };
};

export default useSortableTable;
