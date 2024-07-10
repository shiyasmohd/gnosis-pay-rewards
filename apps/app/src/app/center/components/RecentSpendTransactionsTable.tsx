import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  SpendTransactionFieldsTypePopulated,
  getExplorerLink,
  shortenAddress,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import { ViewAddressOnExplorerLinkButton } from 'components/ViewAddressOnExplorerLinkButton';
import dayjs from 'dayjs';
import dayjsUtcPlugin from 'dayjs/plugin/utc';
import numeral from 'numeral';
import { gnosis } from 'viem/chains';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

dayjs.extend(dayjsUtcPlugin);

const tableColumns: ColumnDef<SpendTransactionFieldsTypePopulated>[] = [
  {
    accessorKey: 'blockTimestamp',
    header: 'Date',
    cell({ row }) {
      return dayjs.unix(row.original.blockTimestamp).format('MM/DD/YYYY HH:mm');
    },
  },
  {
    accessorKey: 'blockNumber',
    header: 'Block',
  },
  {
    accessorKey: 'transactionHash',
    header: 'Hash',
    cell({ row }) {
      return (
        <ViewAddressOnExplorerLinkButton
          href={getExplorerLink(gnosis.id, row.original.transactionHash, 'transaction')}
          label={`${row.original.transactionHash.slice(0, 6)}...${row.original.transactionHash.slice(-4)}`}
        />
      );
    },
  },
  {
    accessorKey: 'safeAddress',
    header: 'GP Safe',
    enableHiding: true,
    cell({ row }) {
      return (
        <ViewAddressOnExplorerLinkButton
          href={getExplorerLink(gnosis.id, row.original.safeAddress, 'address')}
          label={shortenAddress(row.original.safeAddress)}
        />
      );
    },
  },
  {
    accessorKey: 'spentAmount',
    header: 'Value',
    cell({ row }) {
      const formattedTransactionValue = `${row.original?.spentToken?.symbol} ${row.original?.spentAmount?.toString()}`;
      const formattedTransactionValueUsd = `$${numeral(row.original?.spentAmountUsd).format('0,0.00')}`;

      return `${formattedTransactionValue} (${formattedTransactionValueUsd})`;
    },
  },
  {
    accessorKey: 'gnoBalance',
    header: 'GNO Balance',
  },
];

interface RecentSpendTransactionsTableProps {
  data: SpendTransactionFieldsTypePopulated[];
  hideSafeAddressColumn?: boolean;
  showFilterInput?: boolean;
}

export function RecentSpendTransactionsTable({
  data,
  hideSafeAddressColumn = false,
  showFilterInput = true,
}: RecentSpendTransactionsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility: {
        safeAddress: !hideSafeAddressColumn,
      },
    },
  });

  return (
    <div>
      {showFilterInput === true ? (
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter ..."
            value={(table.getColumn('transactionHash')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('transactionHash')?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
        </div>
      ) : null}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows !== undefined && table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>
  );
}
