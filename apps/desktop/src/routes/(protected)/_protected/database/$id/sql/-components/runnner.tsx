import type { editor } from 'monaco-editor'
import type { ColumnRenderer } from '~/components/table'
import type { Column } from '~/entities/database/table'
import { getOS } from '@conar/shared/utils/os'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { Button } from '@conar/ui/components/button'
import { CardHeader, CardTitle } from '@conar/ui/components/card'
import { Input } from '@conar/ui/components/input'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useDebouncedMemo } from '@conar/ui/hookas/use-debounced-memo'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow from '@number-flow/react'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiAlertLine, RiArrowUpLine, RiBrush2Line, RiCloseLine, RiCommandLine, RiCornerDownLeftLine, RiDeleteBin5Line, RiFileCopyLine, RiLoader4Line, RiSearchLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Monaco } from '~/components/monaco'
import { Table, TableBody, TableHeader, TableProvider } from '~/components/table'
import { DANGEROUS_SQL_KEYWORDS, DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT, hasDangerousSqlKeywords, useDatabase } from '~/entities/database'
import { TableCell } from '~/entities/database/components/table-cell'
import { formatSql } from '~/lib/formatter'
import { dbQuery } from '~/lib/query'
import { pageHooks, pageStore, Route } from '..'
import { chatQuery } from '../-lib'

const os = getOS()

function DangerousSqlAlert({ open, setOpen, confirm, query }: { open: boolean, setOpen: (open: boolean) => void, confirm: () => void, query: string }) {
  const os = getOS()
  const uncommentedLines = query.split('\n').filter(line => !line.trim().startsWith('--')).join('\n')
  const dangerousKeywordsPattern = DANGEROUS_SQL_KEYWORDS.map(keyword => `\\b${keyword}\\b`).join('|')
  const dangerousKeywords = uncommentedLines.match(new RegExp(dangerousKeywordsPattern, 'gi')) || []
  const uniqueDangerousKeywords = [...new Set(dangerousKeywords.map(k => k.toUpperCase()))]

  useKeyboardEvent(e => (os === 'macos' ? e.metaKey : e.ctrlKey) && e.key === 'Enter' && e.shiftKey, () => {
    confirm()
    setOpen(false)
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RiAlertLine className="size-5 text-warning" />
            Potentially Dangerous SQL Query
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block rounded-md bg-warning/10 p-3 mb-3 border border-warning/20">
              Your query contains potentially dangerous SQL keywords:
              <span className="font-semibold text-warning">
                {' '}
                {uniqueDangerousKeywords.join(', ')}
              </span>
            </span>
            <span className="mt-2">
              These operations could modify or delete data in your database. Proceed if you understand the impact of these changes.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="border-muted-foreground/20">Cancel</AlertDialogCancel>
          <AlertDialogAction variant="warning" onClick={confirm}>
            <span className="flex items-center gap-2">
              Run Anyway
              <kbd className="flex items-center">
                {os === 'macos' ? <RiCommandLine className="size-3" /> : 'Ctrl'}
                <RiArrowUpLine className="size-3" />
                <RiCornerDownLeftLine className="size-3" />
              </kbd>
            </span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ResultTable({
  result,
  columns,
}: {
  result: Record<string, unknown>[]
  columns: Column[]
}) {
  const [search, setSearch] = useState('')

  const filteredData = useDebouncedMemo(() => {
    if (!search.trim())
      return result

    return result.filter(row =>
      JSON.stringify(Object.values(row)).toLowerCase().includes(search.toLowerCase()),
    )
  }, [result, search], 100)

  const tableColumns = useMemo(() => {
    return columns.map(column => ({
      id: column.name,
      header: ({ columnIndex, style }) => (
        <div
          className={cn(
            'flex w-full items-center justify-between shrink-0 p-2',
            columnIndex === 0 && 'pl-4',
          )}
          style={style}
        >
          <div className="text-xs">
            <div
              data-mask
              className="truncate font-medium flex items-center gap-1"
              title={column.name}
            >
              {column.name}
            </div>
          </div>
        </div>
      ),
      cell: props => <TableCell column={column} {...props} />,
      size: DEFAULT_COLUMN_WIDTH,
    } satisfies ColumnRenderer))
  }, [columns, filteredData])

  return (
    <div className="h-full">
      <div className="px-4 h-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Results</span>
          <span className="text-xs text-muted-foreground">
            <NumberFlow value={filteredData.length} className="tabular-nums" />
            {' '}
            {filteredData.length === 1 ? 'row' : 'rows'}
            {search && filteredData.length !== result.length && ` (filtered from ${result.length})`}
          </span>
        </div>
        <div className="relative flex-1 max-w-60">
          <Input
            placeholder="Search results..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-7 pr-8 h-8 text-sm"
          />
          <RiSearchLine className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
          {search && (
            <Button variant="ghost" size="iconXs" className="absolute right-1.5 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
              <RiCloseLine className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <TableProvider
        rows={filteredData}
        columns={tableColumns}
        estimatedRowSize={DEFAULT_ROW_HEIGHT}
        estimatedColumnSize={DEFAULT_COLUMN_WIDTH}
      >
        <Table className="h-[calc(100%-theme(spacing.10))]">
          <TableHeader />
          <TableBody data-mask />
        </Table>
      </TableProvider>
    </div>
  )
}

export function Runner() {
  const { id } = Route.useParams()
  const { data: database } = useDatabase(id)
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)
  const query = useStore(pageStore, state => state.query)

  useEffect(() => {
    return pageHooks.hook('focusRunner', () => {
      monacoRef.current?.focus()
    })
  }, [])

  useMountedEffect(() => {
    chatQuery.set(id, query)
  }, [id, query])

  const { refetch: runQuery, data: results, status, fetchStatus: queryStatus, error } = useQuery({
    queryKey: ['sql', id],
    queryFn: async () => {
      const result = await dbQuery({
        type: database.type,
        connectionString: database.connectionString,
        query,
      })

      toast.success('SQL executed successfully')

      return result
    },
    throwOnError: false,
    enabled: false,
  })

  useEffect(() => {
    if (status === 'error') {
      toast.error(error.message, {
        action: {
          label: 'Fix with AI',
          onClick: () => {
            pageHooks.callHook('fix', error.message)
          },
        },
        duration: 5000,
      })
    }
  }, [error, status])

  const [isAlertVisible, setIsAlertVisible] = useState(false)

  function sendQuery(query: string) {
    if (hasDangerousSqlKeywords(query)) {
      setIsAlertVisible(true)
      return
    }

    runQuery()
  }

  function format() {
    const formatted = formatSql(query, database.type)

    pageStore.setState(state => ({
      ...state,
      query: formatted,
    }))
    toast.success('SQL formatted successfully')
  }

  return (
    <ResizablePanelGroup autoSaveId="sql-layout-y" direction="vertical">
      <ResizablePanel minSize={20} className="relative">
        <DangerousSqlAlert
          query={query}
          open={isAlertVisible}
          setOpen={setIsAlertVisible}
          confirm={() => runQuery()}
        />
        <CardHeader className="dark:bg-input/30 py-3">
          <CardTitle className="flex items-center gap-2">
            SQL Runner
          </CardTitle>
        </CardHeader>
        <Monaco
          data-mask
          ref={monacoRef}
          language="sql"
          value={query}
          onChange={q => pageStore.setState(state => ({
            ...state,
            query: q,
          }))}
          className="size-full"
          onEnter={query => sendQuery(query)}
        />
        <div className="absolute right-6 bottom-2 z-10 flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="iconSm"
                  onClick={() => pageStore.setState(state => ({
                    ...state,
                    query: '',
                  }))}
                >
                  <RiDeleteBin5Line />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Clear
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="iconSm"
                  onClick={() => copy(query)}
                >
                  <RiFileCopyLine />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Copy
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => format()}
                >
                  <RiBrush2Line />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Format SQL
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            disabled={queryStatus === 'fetching'}
            size="sm"
            onClick={() => sendQuery(query)}
          >
            <div className="flex items-center gap-1">
              Run
              {' '}
              <kbd className="flex items-center text-xs">
                {os === 'macos' ? <RiCommandLine className="size-3" /> : 'Ctrl'}
                <RiCornerDownLeftLine className="size-3" />
              </kbd>
            </div>
          </Button>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel minSize={20}>
        {Array.isArray(results) && results.length > 0 && (
          <Tabs
            defaultValue="table-0"
            className="size-full gap-0"
          >
            {results.length > 1 && (
              <TabsList className="rounded-none w-full bg-muted/20">
                {results.map((_, i) => (
                  <TabsTrigger key={i} value={`table-${i}`}>
                    Result
                    {' '}
                    {i + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}
            {results.map((r, i) => (
              <TabsContent className="h-full" key={i} value={`table-${i}`}>
                <ResultTable
                  result={r.rows}
                  columns={r.columns}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
        {queryStatus === 'fetching'
          ? (
              <div className="h-full flex flex-col items-center justify-center">
                <RiLoader4Line className="size-6 text-muted-foreground mb-2 animate-spin" />
                <p className="text-sm text-center">
                  Running query...
                </p>
              </div>
            )
          : (!results || (Array.isArray(results) && results.length === 0)) && (
              <div className="h-full flex flex-col items-center justify-center">
                <p className="text-center">
                  No results to display
                </p>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Write and run a
                  {' '}
                  <span className="font-mono">SELECT</span>
                  {' '}
                  query above to see results here
                </p>
              </div>
            )}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
