import type { AnchorHTMLAttributes, ReactNode } from 'react'

import { ExternalLink } from 'lucide-react'

type MarkdownLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href?: string
  children?: ReactNode
}

export const MarkdownLink = ({ href, children, ...props }: MarkdownLinkProps) => {
  const isExternal = href?.startsWith('http')

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className='inline-flex items-center gap-1 text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary/60'
      {...props}
    >
      {children}
      {isExternal && <ExternalLink className='size-3 opacity-70' />}
    </a>
  )
}
