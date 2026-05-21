'use client'

import AIPet from './AIPet'

interface ClientLayoutProps {
  greeting: string
  placeholder: string
}

export default function ClientLayout({ greeting, placeholder }: ClientLayoutProps) {
  return <AIPet greeting={greeting} placeholder={placeholder} />
}
