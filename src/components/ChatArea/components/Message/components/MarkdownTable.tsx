import type { ReactNode, TableHTMLAttributes } from 'react'

type MarkdownTableProps = TableHTMLAttributes<HTMLTableElement> & {
  children?: ReactNode
}

export const MarkdownTable = ({ children, ...props }: MarkdownTableProps) => (
  <div className='my-4 overflow-x-auto rounded-md border'>
    <table className='w-full text-sm' {...props}>
      {children}
    </table>
  </div>
)
