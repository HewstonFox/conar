import { getOS } from '@connnect/shared/utils/os'
import { AppLogo } from '@connnect/ui/components/brand/app-logo'
import { Button } from '@connnect/ui/components/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { RiCommandLine, RiListUnordered, RiMoonLine, RiPlayLargeLine, RiSunLine, RiTableLine } from '@remixicon/react'
import { Link, useMatches, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { ThemeToggle } from '~/components/theme-toggle'
import { UserButton } from '~/entities/user'
import { actionsCenterStore } from '~/routes/(protected)/-components/actions-center'
import { Route } from '../$id'

const os = getOS()

export function DatabaseSidebar() {
  const { id } = Route.useParams()
  const { table: tableParam, schema: schemaParam } = useParams({ strict: false })
  const lastOpenedTableRef = useRef<{ schema: string, table: string } | null>(null)
  const navigate = useNavigate()
  const matches = useMatches({
    select: matches => matches.map(match => match.routeId),
  })

  useEffect(() => {
    if (tableParam && schemaParam) {
      lastOpenedTableRef.current = { schema: schemaParam, table: tableParam }
    }
  }, [tableParam, schemaParam])

  const isActiveSql = matches.includes('/(protected)/_protected/database/$id/sql/')
  const isActiveTables = matches.includes('/(protected)/_protected/database/$id/tables')
  const isActiveEnums = matches.includes('/(protected)/_protected/database/$id/enums/')

  function onTablesClick() {
    if (lastOpenedTableRef.current?.schema === schemaParam && lastOpenedTableRef.current?.table === tableParam) {
      lastOpenedTableRef.current = null
    }

    if (lastOpenedTableRef.current) {
      navigate({
        to: '/database/$id/tables/$schema/$table',
        params: {
          id,
          schema: lastOpenedTableRef.current.schema,
          table: lastOpenedTableRef.current.table,
        },
      })
    }
    else {
      navigate({
        to: '/database/$id/tables',
        params: { id },
      })
    }
  }
  return (
    <>
      <div className="w-[calc(theme(spacing.16)+2px)]" />
      <div
        className="bg-input/30 flex flex-col border-r gap-6 items-center py-4 px-4 w-16 h-screen fixed left-0 inset-y-0"
      >
        <div className="flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  className="text-primary!"
                >
                  <Link to="/" className="text-foreground">
                    <AppLogo className="size-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Dashboard</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="relative flex flex-col items-center flex-1 gap-2 overflow-auto">
          <div className="w-full">
            <div className="flex w-full flex-col gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      size="icon"
                      variant={isActiveSql ? 'secondary' : 'ghost'}
                    >
                      <Link
                        to="/database/$id/sql"
                        params={{ id }}
                        className="text-foreground"
                        onMouseDown={() => navigate({
                          to: '/database/$id/sql',
                          params: { id },
                        })}
                      >
                        <RiPlayLargeLine className="size-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">SQL Runner</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      size="icon"
                      variant={isActiveTables ? 'secondary' : 'ghost'}
                    >
                      <Link
                        to="/database/$id/tables"
                        params={{ id }}
                        className="text-foreground"
                        onMouseDown={onTablesClick}
                      >
                        <RiTableLine className="size-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Tables</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      size="icon"
                      variant={isActiveEnums ? 'secondary' : 'ghost'}
                    >
                      <Link
                        to="/database/$id/enums"
                        params={{ id }}
                        className="text-foreground"
                        onMouseDown={() => navigate({
                          to: '/database/$id/enums',
                          params: { id },
                        })}
                      >
                        <RiListUnordered className="size-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Enums</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => actionsCenterStore.setState(state => ({ ...state, isOpen: true }))}
                >
                  <RiCommandLine className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {os === 'macos' ? '⌘' : 'Ctrl'}
                P
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="relative">
            <ThemeToggle>
              <Button size="icon" variant="ghost">
                <RiSunLine className="size-4 dark:hidden" />
                <RiMoonLine className="size-4 hidden dark:block" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </ThemeToggle>
          </div>
          <UserButton />
        </div>
      </div>
    </>
  )
}
