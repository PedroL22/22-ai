import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '~/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size='icon' aria-label='Change theme' className='dark:text-accent-foreground'>
          <Sun className='dark:-rotate-90 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0' />
          <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>Change theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          data-selected={theme === 'system'}
          className='transition-all ease-in hover:bg-accent/10 data-[selected=true]:bg-accent'
          onClick={() => setTheme('system')}
        >
          System
        </DropdownMenuItem>

        <DropdownMenuItem
          data-selected={theme === 'dark'}
          className='transition-all ease-in hover:bg-accent/10 data-[selected=true]:bg-accent'
          onClick={() => setTheme('dark')}
        >
          Dark
        </DropdownMenuItem>

        <DropdownMenuItem
          data-selected={theme === 'light'}
          className='transition-all ease-in hover:bg-accent/10 data-[selected=true]:bg-accent'
          onClick={() => setTheme('light')}
        >
          Light
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
