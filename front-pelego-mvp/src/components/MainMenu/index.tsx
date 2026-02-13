'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useFut } from '@/contexts/FutContext';
import { useWeeks } from '@/services/weeks/useWeeks';
import FutSelector from '@/components/FutSelector';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LogoutIcon from '@mui/icons-material/Logout';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import HomeIcon from '@mui/icons-material/Home';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import TodayIcon from '@mui/icons-material/Today';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MenuExpansible, MenuExpansibleContent, MenuExpansibleItem } from '../MenuExpansible';

export default function MainMenu() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { userRole } = useFut();
  const { weeks } = useWeeks();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentYear = new Date().getFullYear();
  const years = Array.from(new Set(weeks?.map((week) => new Date(week.date).getFullYear())));

  const isMonthlyActive = (basePath: string) => {
    const regex = new RegExp(`${basePath}/${currentYear}/\\d{2}$`);
    return regex.test(pathname);
  };

  return (
    <MenuExpansible
      open={open}
      onClick={() => setOpen(!open)}
      footer={
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-8 h-8 rounded-full flex-shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary-foreground">
                {user?.displayName?.[0] || '?'}
              </span>
            </div>
          )}
          {open && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="p-1.5 rounded-md hover:bg-accent transition-colors"
                title="Sair">
                <LogoutIcon className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          )}
        </div>
      }
      logo={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-pitch flex items-center justify-center shadow-pitch">
            <SportsSoccerIcon className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold leading-none text-gradient-pitch tracking-tight">
            PELEGO
          </span>
        </div>
      }>
      <FutSelector collapsed={!open} />
      <MenuExpansibleContent>
        <MenuExpansibleItem href="/" label="Home" icon={<HomeIcon />} active={pathname === '/'} />
        <MenuExpansibleItem
          href="/players"
          label="Jogadores"
          icon={<PeopleAltIcon />}
          active={pathname.includes('players')}
        />
        <MenuExpansibleItem label="Status" icon={<EmojiEventsIcon />} withSubItems>
          <MenuExpansibleItem
            label="Resumo"
            icon={<BarChartIcon />}
            withSubItems
            active={pathname.includes('stat-resume')}>
            {years.map((year) => (
              <MenuExpansibleItem
                key={year}
                href={`/stat-resume/${year}`}
                label={`${year}`}
                icon={<TodayIcon />}
                active={pathname === `/stat-resume/${year}`}
              />
            ))}
            <MenuExpansibleItem
              href={`/stat-resume/${currentYear}/${currentMonth}`}
              label="Mensais"
              icon={<CalendarMonthIcon />}
              active={isMonthlyActive('/stat-resume')}
            />
          </MenuExpansibleItem>
          <MenuExpansibleItem
            label="Defensores"
            icon={<LocalPoliceIcon />}
            withSubItems
            active={pathname.includes('best-defender')}>
            {years.map((year) => (
              <MenuExpansibleItem
                key={year}
                href={`/best-defender/${year}`}
                label={`${year}`}
                icon={<TodayIcon />}
                active={pathname === `/best-defender/${year}`}
              />
            ))}
            <MenuExpansibleItem
              href={`/best-defender/${currentYear}/${currentMonth}`}
              label="Mensais"
              icon={<CalendarMonthIcon />}
              active={isMonthlyActive('/best-defender')}
            />
          </MenuExpansibleItem>
          <MenuExpansibleItem
            label="Artilheiros"
            icon={<SportsSoccerIcon />}
            withSubItems
            active={pathname.includes('top-scorer')}>
            {years.map((year) => (
              <MenuExpansibleItem
                key={year}
                href={`/top-scorer/${year}`}
                label={`${year}`}
                icon={<TodayIcon />}
                active={pathname === `/top-scorer/${year}`}
              />
            ))}
            <MenuExpansibleItem
              href={`/top-scorer/${currentYear}/${currentMonth}`}
              label="Mensais"
              icon={<CalendarMonthIcon />}
              active={isMonthlyActive('/top-scorer')}
            />
          </MenuExpansibleItem>
          <MenuExpansibleItem
            label="Assistentes"
            icon={<AutoAwesomeIcon />}
            withSubItems
            active={pathname.includes('top-assists')}>
            {years.map((year) => (
              <MenuExpansibleItem
                key={year}
                href={`/top-assists/${year}`}
                label={`${year}`}
                icon={<TodayIcon />}
                active={pathname === `/top-assists/${year}`}
              />
            ))}
            <MenuExpansibleItem
              href={`/top-assists/${currentYear}/${currentMonth}`}
              label="Mensais"
              icon={<CalendarMonthIcon />}
              active={isMonthlyActive('/top-assists')}
            />
          </MenuExpansibleItem>
        </MenuExpansibleItem>
        <MenuExpansibleItem
          label="Pontuação"
          icon={<TableChartOutlinedIcon />}
          withSubItems
          active={pathname.includes('points')}>
          {years.map((year) => (
            <MenuExpansibleItem
              key={year}
              href={`/points/${year}`}
              label={`${year}`}
              icon={<TodayIcon />}
              active={pathname === `/points/${year}`}
            />
          ))}
          <MenuExpansibleItem
            href={`/points/${currentYear}/${currentMonth}`}
            label="Mensais"
            icon={<CalendarMonthIcon />}
            active={isMonthlyActive('/points')}
          />
        </MenuExpansibleItem>
        <MenuExpansibleItem
          label="Presença"
          icon={<CheckCircleOutlineIcon />}
          withSubItems
          active={pathname.includes('appear')}>
          {years.map((year) => (
            <MenuExpansibleItem
              key={year}
              href={`/appear/${year}`}
              label={`${year}`}
              icon={<TodayIcon />}
              active={pathname === `/appear/${year}`}
            />
          ))}
          <MenuExpansibleItem
            href={`/appear/${currentYear}/${currentMonth}`}
            label="Mensais"
            icon={<CalendarMonthIcon />}
            active={isMonthlyActive('/appear')}
          />
        </MenuExpansibleItem>
        <MenuExpansibleItem
          href="/weeks"
          label="Semanas"
          icon={<EventAvailableIcon />}
          active={pathname === '/weeks'}
        />
        {userRole === 'admin' && (
          <MenuExpansibleItem
            href="/fut-settings"
            label="Configurações"
            icon={<SettingsIcon />}
            active={pathname === '/fut-settings'}
          />
        )}
      </MenuExpansibleContent>
    </MenuExpansible>
  );
}
