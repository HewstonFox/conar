import type { AiSqlChatModel } from '@conar/shared/enums/ai-chat-model'
import { title } from '@conar/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { Store } from '@tanstack/react-store'
import { createHooks } from 'hookable'
import { Chat } from './-components/chat'
import { Runner } from './-components/runnner'
import { chatMessages, chatQuery } from './-lib'

export const pageStore = new Store({
  query: '',
  files: [] as File[],
  model: 'auto' as AiSqlChatModel | 'auto',
})

export const pageHooks = createHooks<{
  fix: (error: string) => Promise<void>
  focusRunner: () => void
}>()

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/sql/',
)({
  component: DatabaseSqlPage,
  beforeLoad: ({ params }) => {
    pageStore.setState(state => ({
      ...state,
      query: chatQuery.get(params.id),
    }))
  },
  loader: async ({ params, context }) => ({
    database: context.database,
    initialMessages: await chatMessages.get(params.id),
  }),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: title('SQL Runner', loaderData.database.name),
          },
        ]
      : [],
  }),
})

function DatabaseSqlPage() {
  return (
    <ResizablePanelGroup autoSaveId="sql-layout-x" direction="horizontal" className="flex">
      <ResizablePanel
        defaultSize={30}
        minSize={20}
        maxSize={50}
        className="border bg-background rounded-lg"
      >
        <Chat className="h-full" />
      </ResizablePanel>
      <ResizableHandle className="w-1 bg-transparent" />
      <ResizablePanel
        minSize={30}
        maxSize={80}
        className="flex flex-col gap-4 border bg-background rounded-lg"
      >
        <Runner />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
