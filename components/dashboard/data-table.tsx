"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

export interface DataTableColumn<TData> {
  id: string
  header: string
  cell: (row: TData) => ReactNode
  className?: string
}

interface DataTableProps<TData> {
  data: TData[]
  columns: DataTableColumn<TData>[]
  pageSize?: number
  emptyTitle: string
  emptyDescription: string
  getRowKey: (row: TData) => string
}

export function DataTable<TData>({
  data,
  columns,
  pageSize = 6,
  emptyTitle,
  emptyDescription,
  getRowKey,
}: DataTableProps<TData>) {
  const [page, setPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil(data.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [currentPage, data, pageSize])

  if (data.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((row) => (
              <TableRow key={getRowKey(row)}>
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  setPage((previous) => Math.max(1, previous - 1))
                }}
              />
            </PaginationItem>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={pageNumber === currentPage}
                  onClick={(event) => {
                    event.preventDefault()
                    setPage(pageNumber)
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  setPage((previous) => Math.min(pageCount, previous + 1))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}
