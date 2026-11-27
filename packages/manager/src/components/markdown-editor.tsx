import '@mdxeditor/editor/style.css'
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  Separator,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from '@mdxeditor/editor'
import type { MDXEditorMethods } from '@mdxeditor/editor'
import { cn } from 'cn'
import { removeMarkdownEscapes } from '@/lib/markdown'
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

const DARK_COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)'
const DARK_THEME_CLASS_NAME = 'dark-theme'
const POPOVER_ANCHOR_CONTAINER_CLASS_NAME = '[contain:layout]'
const PLAIN_LINE_BREAK = '\n'

const BASE_CONTENT_CLASS_NAME = 'px-2.5 py-2 text-base md:text-sm [&_a]:text-primary [&_a]:underline'

const VARIANT_MAP = {
  events: {
    contentClassName: cn(
      BASE_CONTENT_CLASS_NAME,
      'min-h-40',
      '[&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold',
      '[&_h4]:font-semibold [&_h5]:font-semibold [&_h6]:font-semibold',
      '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6',
      '[&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
    ),
    plugins: [
      headingsPlugin({
        allowedHeadingLevels: [2, 3, 4, 5, 6],
      }),
      listsPlugin(),
      quotePlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      thematicBreakPlugin(),
      markdownShortcutPlugin(),
      toolbarPlugin({
        toolbarContents: () => (
          <>
            <UndoRedo />
            <Separator />
            <BoldItalicUnderlineToggles />
            <Separator />
            <BlockTypeSelect />
            <Separator />
            <ListsToggle />
            <CreateLink />
          </>
        ),
      }),
    ],
    toMarkdownOptions: undefined,
  },
  'form-paragraphs': {
    contentClassName: cn(BASE_CONTENT_CLASS_NAME, 'min-h-24'),
    plugins: [
      linkPlugin(),
      linkDialogPlugin({ showLinkTitleField: false }),
      toolbarPlugin({
        toolbarContents: () => (
          <>
            <UndoRedo />
            <Separator />
            <CreateLink />
          </>
        ),
      }),
    ],
    toMarkdownOptions: {
      handlers: { break: () => PLAIN_LINE_BREAK },
    },
  },
}

function subscribeToColorScheme(onChange: () => void) {
  const mediaQuery = window.matchMedia(DARK_COLOR_SCHEME_QUERY)
  mediaQuery.addEventListener('change', onChange)
  return () => mediaQuery.removeEventListener('change', onChange)
}

function isDarkColorScheme() {
  return window.matchMedia(DARK_COLOR_SCHEME_QUERY).matches
}

interface MarkdownEditorProps {
  markdown: string
  onChange: (markdown: string) => void
  variant: 'events' | 'form-paragraphs'
  overlayContainer?: HTMLElement | null
  disabled?: boolean
  invalid?: boolean
}

export function MarkdownEditor({
  markdown,
  onChange,
  variant,
  overlayContainer,
  disabled,
  invalid,
}: MarkdownEditorProps) {
  const isDark = useSyncExternalStore(subscribeToColorScheme, isDarkColorScheme)
  const editorRef = useRef<MDXEditorMethods>(null)
  const lastEmittedMarkdownRef = useRef(markdown)

  useEffect(() => {
    if (markdown !== lastEmittedMarkdownRef.current) {
      lastEmittedMarkdownRef.current = markdown
      editorRef.current?.setMarkdown(markdown)
    }
  }, [markdown])

  const handleChange = useCallback(
    (changedMarkdown: string) => {
      const emittedMarkdown = variant === 'form-paragraphs' ? removeMarkdownEscapes(changedMarkdown) : changedMarkdown
      lastEmittedMarkdownRef.current = emittedMarkdown
      onChange(emittedMarkdown)
    },
    [variant, onChange],
  )

  return (
    <div
      className={cn(
        'w-full rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        invalid && 'border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40',
        disabled && 'cursor-not-allowed opacity-50',
      )}>
      <div className={POPOVER_ANCHOR_CONTAINER_CLASS_NAME}>
        <MDXEditor
          ref={editorRef}
          className={isDark ? DARK_THEME_CLASS_NAME : undefined}
          contentEditableClassName={VARIANT_MAP[variant].contentClassName}
          markdown={markdown}
          onChange={handleChange}
          readOnly={disabled}
          plugins={VARIANT_MAP[variant].plugins}
          toMarkdownOptions={VARIANT_MAP[variant].toMarkdownOptions}
          overlayContainer={overlayContainer}
        />
      </div>
    </div>
  )
}
