'use client';

import { Player } from '@/types/player';
import AnchorIcon from '@mui/icons-material/Anchor';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import StarIcon from '@mui/icons-material/Star';
import Image from 'next/image';

import Flag from 'react-world-flags';
import {
  BrazilFlagImage,
  IndianFlagImage,
  monthWinner,
  NH,
  StrikerMonth,
  StrikerMPP,
  StrikerMVP,
  StrikerNormal,
  VanuatuFlagImage,
} from '../../utils/images';

interface PlayerCardSmallProps {
  playerData: Player;
  showOverall: boolean;
}

export interface BadgeProps {
  playerData: Player;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ playerData, children }) => {
  const getBackgroundImage = () => {
    if (playerData.monthLVP) {
      return "bg-[url('../../public/lvp_mini.png')] text-[#fdebd1]";
    } else if (playerData.overall.overall < 65) {
      return "bg-[url('../../public/bronze_mini.png')] text-[#3A2717]";
    } else if (playerData.overall.overall < 74) {
      return "bg-[url('../../public/silver_mini.png')] text-[#26292A]";
    } else {
      return "bg-[url('../../public/gold_mini.png')] text-[#46390d]";
    }
  };

  const getShadow = () => {
    if (playerData.overall.overall >= 74) {
      return 'shadow-tier-gold';
    } else if (playerData.overall.overall >= 65) {
      return 'shadow-tier-silver';
    } else {
      return 'shadow-tier-bronze';
    }
  };

  return (
    <div
      className={`${getBackgroundImage()} ${getShadow()} h-[200px] w-[200px] bg-contain bg-center bg-no-repeat transition-base hover:scale-105`}>
      {children}
    </div>
  );
};

export const BestOfMonthBadge: React.FC<BadgeProps> = ({ playerData, children }) => {
  const getBackgroundImage = () => {
    if (playerData.overall.overall < 65) {
      return "bg-[url('../../public/BoP_bronze_mini.png')] text-[#ecba8f]";
    } else if (playerData.overall.overall < 74) {
      return "bg-[url('../../public/BoP_silver_mini.png')] text-[#F2F2F3]";
    } else {
      return "bg-[url('../../public/BoP_gold_mini.png')] text-[#ffe28d]";
    }
  };

  const getShadow = () => {
    if (playerData.overall.overall >= 74) {
      return 'shadow-tier-gold animate-trophy';
    } else if (playerData.overall.overall >= 65) {
      return 'shadow-tier-silver';
    } else {
      return 'shadow-tier-bronze';
    }
  };

  return (
    <div
      className={`${getBackgroundImage()} ${getShadow()} h-[200px] w-[200px] bg-contain bg-center bg-no-repeat transition-base hover:scale-105`}>
      {children}
    </div>
  );
};

export const MonthChampionCard: React.FC<{ playerData: Player; showOverall: boolean }> = ({
  playerData,
  showOverall,
}) => (
  <>
    <div
      className={
        "bg-[url('../../public/mvp_mini.png')] h-[200px] w-[200px] bg-contain bg-center bg-no-repeat text-[#b2f41d]"
      }>
      <div className="px-[18px] py-[4px]">
        <div className="flex flex-row min-h-[140px]">
          <div className="flex flex-col items-center mt-[31px] pt-5 ml-5 pl-[5px] pr-[5px] bg-gradient-to-t from-custom-gradient-mvp-start to-custom-gradient-mvp-end">
            <div className="flex flex-col justify-center w-min items-center">
              <div className="text-2xl leading-[15px]">
                {showOverall ? playerData.overall.overall : ''}
              </div>
              <span className="text-sm text-center w-min leading-2 pt-1">
                {playerData.position.toUpperCase()}
              </span>
            </div>
            <div>
              <div className="w-7 min-h-[9px] pl-[2px]">
                {playerData.country === 'IN' ? (
                  <Image src={IndianFlagImage} alt="India Flag" width={25} height={7} />
                ) : playerData.country === 'VT' ? (
                  <Image src={VanuatuFlagImage} alt="Vanuatu Flag" width={25} height={7} />
                ) : playerData.country === 'BR' ? (
                  <Image src={BrazilFlagImage} alt="Brazil Flag" width={25} height={7} />
                ) : (
                  <Flag code={playerData.country} alt="flag" width={25} height={7} />
                )}
              </div>
              {playerData.team === 'NH' && (
                <div className="pt-[3px] pl-[2px]">
                  <Image src={NH} alt="team logo" width={24} height={24} />
                </div>
              )}
            </div>
          </div>
          <div className="h-full pb-[1px]">
            {playerData.image && (
              <Image
                className="h-full w-full"
                src={playerData.image}
                alt="player image"
                width={160}
                height={160}
              />
            )}
          </div>
        </div>
        <div className="text-center pt-[3px] text-sm">{playerData.name.toUpperCase()}</div>
        <div className="flex flex-row justify-center gap-1">
          <div className="flex flex-row justify-center gap-[2px]">
            {playerData.monthStriker && (
              <Image
                src={StrikerMVP}
                alt="team logo"
                width={18}
                height={18}
                className="relative bottom-[9px] pt-[2px]"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);

export const MostMVPCard: React.FC<{ playerData: Player; showOverall: boolean }> = ({
  playerData,
  showOverall,
}) => (
  <>
    <div
      className={
        "bg-[url('../../public/MMVP_mini.png')] h-[200px] w-[200px] bg-contain bg-center bg-no-repeat text-[#fcff00]"
      }>
      <div className="px-[18px] py-[4px]">
        <div className="flex flex-row min-h-[140px]">
          <div className="flex flex-col items-center mt-[31px] pt-5 ml-5 pl-[5px] pr-[5px] bg-gradient-to-t from-[#52187981] to-[#52187923]">
            <div className="flex flex-col justify-center w-min items-center">
              <div className="text-2xl leading-[15px]">
                {showOverall ? playerData.overall.overall : ''}
              </div>
              <span className="text-sm text-center w-min leading-2 pt-1">
                {playerData.position.toUpperCase()}
              </span>
            </div>
            <div>
              <div className="w-7 min-h-[9px] pl-[2px]">
                {playerData.country === 'IN' ? (
                  <Image src={IndianFlagImage} alt="India Flag" width={25} height={7} />
                ) : playerData.country === 'VT' ? (
                  <Image src={VanuatuFlagImage} alt="Vanuatu Flag" width={25} height={7} />
                ) : playerData.country === 'BR' ? (
                  <Image src={BrazilFlagImage} alt="Brazil Flag" width={25} height={7} />
                ) : (
                  <Flag code={playerData.country} alt="flag" width={25} height={7} />
                )}
              </div>
              {playerData.team === 'NH' && (
                <div className="pt-[3px] pl-[2px]">
                  <Image src={NH} alt="team logo" width={24} height={24} />
                </div>
              )}
            </div>
          </div>
          <div className="h-full pb-[1px]">
            {playerData.image && (
              <Image
                className="h-full w-full"
                src={playerData.image}
                alt="player image"
                width={160}
                height={160}
              />
            )}
          </div>
        </div>
        <div className="text-center pt-[3px] text-sm">{playerData.name.toUpperCase()}</div>
        <div className="flex flex-row justify-center gap-1">
          <div className="flex flex-row justify-center gap-[2px]">
            {playerData.monthStriker && (
              <Image
                src={StrikerMVP}
                alt="team logo"
                width={18}
                height={18}
                className="relative bottom-[9px] pt-[2px]"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);

export const MostPointerCard: React.FC<{ playerData: Player; showOverall: boolean }> = ({
  playerData,
  showOverall,
}) => (
  <div
    className={
      "bg-[url('../../public/MPIM1_mini.png')] h-[200px] w-[200px] bg-contain bg-center bg-no-repeat text-[#ffdb95]"
    }>
    <div className="px-8 py-[18px]">
      <div className="flex flex-row min-h-[123px]">
        <div className="flex flex-col items-center mt-[31px] pt-1 ml-[7px] pl-[5px] pr-[5px] bg-gradient-to-t from-custom-gradient-mvp-start to-custom-gradient-mvp-end">
          <div className="flex flex-col justify-center w-min items-center">
            <div className="text-2xl leading-[15px]">
              {showOverall ? playerData.overall.overall : ''}
            </div>
            <span className="text-sm text-center w-min leading-2 pt-1">
              {playerData.position.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="w-7 min-h-[9px] pl-[2px]">
              {playerData.country === 'IN' ? (
                <Image src={IndianFlagImage} alt="India Flag" width={25} height={7} />
              ) : playerData.country === 'VT' ? (
                <Image src={VanuatuFlagImage} alt="Vanuatu Flag" width={25} height={7} />
              ) : playerData.country === 'BR' ? (
                <Image src={BrazilFlagImage} alt="Brazil Flag" width={25} height={7} />
              ) : (
                <Flag code={playerData.country} alt="flag" width={25} height={7} />
              )}
            </div>
            {playerData.team === 'NH' && (
              <div className="pt-[3px] pl-[2px]">
                <Image src={NH} alt="team logo" width={24} height={24} />
              </div>
            )}
          </div>
        </div>
        <div className="h-full pb-[1px]">
          {playerData.image && (
            <Image
              className="h-full w-full"
              src={playerData.image}
              alt="player image"
              width={160}
              height={160}
            />
          )}
        </div>
      </div>
      <div className="text-center pt-[5px] text-sm">{playerData.name.toUpperCase()}</div>
      <div className="flex flex-row justify-center gap-1 pr-[1px]">
        <div className="flex flex-row justify-center gap-[2px]">
          {playerData.monthStriker && (
            <Image
              src={StrikerMPP}
              alt="team logo"
              width={18}
              height={18}
              className="relative bottom-[9px] pt-[3px]"
            />
          )}
          <StarIcon className="max-h-[15px] max-w-[15px] relative bottom-[4px]" />
        </div>
      </div>
    </div>
  </div>
);

export const StrikerCard: React.FC<{ playerData: Player; showOverall: boolean }> = ({
  playerData,
  showOverall,
}) => (
  <div
    className={
      "bg-[url('../../public/striker_mini.png')] h-[200px] w-[200px] bg-contain bg-center bg-no-repeat text-[#f1e8f2]"
    }>
    <div className="px-8 py-[18px]">
      <div className="flex flex-row min-h-[123px]">
        <div className="flex flex-col items-center mt-[31px] pt-1 ml-[7px] pl-[5px] pr-[5px]">
          <div className="flex flex-col justify-center w-min items-center">
            <div className="text-2xl leading-[15px]">
              {showOverall ? playerData.overall.overall : ''}
            </div>
            <span className="text-sm text-center w-min leading-2 pt-1">
              {playerData.position.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="w-7 min-h-[9px] pl-[2px]">
              {playerData.country === 'IN' ? (
                <Image src={IndianFlagImage} alt="India Flag" width={25} height={7} />
              ) : playerData.country === 'VT' ? (
                <Image src={VanuatuFlagImage} alt="Vanuatu Flag" width={25} height={7} />
              ) : playerData.country === 'BR' ? (
                <Image src={BrazilFlagImage} alt="Brazil Flag" width={25} height={7} />
              ) : (
                <Flag code={playerData.country} alt="flag" width={25} height={7} />
              )}
            </div>
            {playerData.team === 'NH' && (
              <div className="pt-[3px] pl-[2px]">
                <Image src={NH} alt="team logo" width={24} height={24} />
              </div>
            )}
          </div>
        </div>
        <div className="h-full pb-[1px]">
          {playerData.image && (
            <Image
              className="h-full w-full"
              src={playerData.image}
              alt="player image"
              width={160}
              height={160}
            />
          )}
        </div>
      </div>
      <div className="text-center pt-[5px] text-sm">{playerData.name.toUpperCase()}</div>
      <div className="flex flex-row justify-center gap-1 pr-[1px]">
        <div className="flex flex-row justify-center">
          <Image
            src={StrikerMonth}
            alt="team logo"
            width={16}
            height={16}
            className="relative bottom-[9px] pt-[2px]"
          />
        </div>
      </div>
    </div>
  </div>
);

export const DefenderCard: React.FC<{ playerData: Player; showOverall: boolean }> = ({
  playerData,
  showOverall,
}) => (
  <div
    className={
      "bg-[url('../../public/defender_mini.png')] h-[200px] w-[200px] bg-contain bg-center bg-no-repeat text-[#adbeb7]"
    }>
    <div className="px-8 py-[18px]">
      <div className="flex flex-row min-h-[123px]">
        <div className="flex flex-col items-center mt-[31px] pt-1 ml-[7px] pl-[5px] pr-[5px]">
          <div className="flex flex-col justify-center w-min items-center">
            <div className="text-2xl leading-[15px]">
              {showOverall ? playerData.overall.overall : ''}
            </div>
            <span className="text-sm text-center w-min leading-2 pt-1">
              {playerData.position.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="w-7 min-h-[9px] pl-[2px]">
              {playerData.country === 'IN' ? (
                <Image src={IndianFlagImage} alt="India Flag" width={25} height={7} />
              ) : playerData.country === 'VT' ? (
                <Image src={VanuatuFlagImage} alt="Vanuatu Flag" width={25} height={7} />
              ) : playerData.country === 'BR' ? (
                <Image src={BrazilFlagImage} alt="Brazil Flag" width={25} height={7} />
              ) : (
                <Flag code={playerData.country} alt="flag" width={25} height={7} />
              )}
            </div>
            {playerData.team === 'NH' && (
              <div className="pt-[3px] pl-[2px]">
                <Image src={NH} alt="team logo" width={24} height={24} />
              </div>
            )}
          </div>
        </div>
        <div className="h-full pb-[1px]">
          {playerData.image && (
            <Image
              className="h-full w-full"
              src={playerData.image}
              alt="player image"
              width={160}
              height={160}
            />
          )}
        </div>
      </div>
      <div className="text-center pt-[5px] text-sm">{playerData.name.toUpperCase()}</div>
      <div className="flex flex-row justify-center gap-1 pr-[1px]">
        <div className="flex flex-row justify-center">
          <LocalPoliceIcon className="max-h-[15px] max-w-[15px] relative bottom-[4px] text-[#adbeb7]" />
        </div>
      </div>
    </div>
  </div>
);

export const AssistCard: React.FC<{ playerData: Player; showOverall: boolean }> = ({
  playerData,
  showOverall,
}) => (
  <div
    className={
      "bg-[url('../../public/top_assist_mini.png')] h-[200px] w-[200px] bg-contain bg-center bg-no-repeat text-[#ffdc26]"
    }>
    <div className="px-8 py-[18px]">
      <div className="flex flex-row min-h-[123px]">
        <div className="flex flex-col items-center mt-[31px] pt-1 ml-[7px] pl-[5px] pr-[5px]">
          <div className="flex flex-col justify-center w-min items-center">
            <div className="text-2xl leading-[15px]">
              {showOverall ? playerData.overall.overall : ''}
            </div>
            <span className="text-sm text-center w-min leading-2 pt-1">
              {playerData.position.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="w-7 min-h-[9px] pl-[2px]">
              {playerData.country === 'IN' ? (
                <Image src={IndianFlagImage} alt="India Flag" width={25} height={7} />
              ) : playerData.country === 'VT' ? (
                <Image src={VanuatuFlagImage} alt="Vanuatu Flag" width={25} height={7} />
              ) : playerData.country === 'BR' ? (
                <Image src={BrazilFlagImage} alt="Brazil Flag" width={25} height={7} />
              ) : (
                <Flag code={playerData.country} alt="flag" width={25} height={7} />
              )}
            </div>
            {playerData.team === 'NH' && (
              <div className="pt-[3px] pl-[2px]">
                <Image src={NH} alt="team logo" width={24} height={24} />
              </div>
            )}
          </div>
        </div>
        <div className="h-full pb-[1px]">
          {playerData.image && (
            <Image
              className="h-full w-full"
              src={playerData.image}
              alt="player image"
              width={160}
              height={160}
            />
          )}
        </div>
      </div>
      <div className="text-center pt-[5px] text-sm">{playerData.name.toUpperCase()}</div>
      <div className="flex flex-row justify-center gap-1 pr-[1px]">
        <div className="flex flex-row justify-center">
          <AutoAwesomeIcon className="max-h-[15px] max-w-[15px] relative bottom-[5px] text-[#ffdc26]" />
        </div>
      </div>
    </div>
  </div>
);

export const PPGCard: React.FC<{ playerData: Player; showOverall: boolean }> = ({
  playerData,
  showOverall,
}) => (
  <div
    className={
      "bg-[url('../../public/best2_mini.png')] h-[200px] w-[200px] bg-contain bg-center bg-no-repeat text-[#fffafb]"
    }>
    <div className="px-8 py-[18px]">
      <div className="flex flex-row min-h-[123px]">
        <div className="flex flex-col items-center mt-[31px] pt-1 ml-[7px] pl-[5px] pr-[5px] bg-gradient-to-t from-[#00000080] to-[#00000025]">
          <div className="flex flex-col justify-center w-min items-center">
            <div className="text-2xl leading-[15px]">
              {showOverall ? playerData.overall.overall : ''}
            </div>
            <span className="text-sm text-center w-min leading-2 pt-1">
              {playerData.position.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="w-7 min-h-[9px] pl-[2px]">
              {playerData.country === 'IN' ? (
                <Image src={IndianFlagImage} alt="India Flag" width={25} height={7} />
              ) : playerData.country === 'VT' ? (
                <Image src={VanuatuFlagImage} alt="Vanuatu Flag" width={25} height={7} />
              ) : playerData.country === 'BR' ? (
                <Image src={BrazilFlagImage} alt="Brazil Flag" width={25} height={7} />
              ) : (
                <Flag code={playerData.country} alt="flag" width={25} height={7} />
              )}
            </div>
            {playerData.team === 'NH' && (
              <div className="pt-[3px] pl-[2px]">
                <Image src={NH} alt="team logo" width={24} height={24} />
              </div>
            )}
          </div>
        </div>
        <div className="h-full pb-[1px]">
          {playerData.image && (
            <Image
              className="h-full w-full"
              src={playerData.image}
              alt="player image"
              width={160}
              height={160}
            />
          )}
        </div>
      </div>
      <div className="text-center pt-[5px] text-sm">{playerData.name.toUpperCase()}</div>
    </div>
  </div>
);

export const WeekChampionCard: React.FC<{ playerData: Player; showOverall: boolean }> = ({
  playerData,
  showOverall,
}) => (
  <div
    className={
      "bg-[url('../../public/BdB_mini.png')] h-[200px] w-[200px] bg-contain bg-center bg-no-repeat"
    }>
    <div className="pr-8 pl-11 py-[40px]">
      <div className="flex flex-row min-h-[104px]">
        <div className="flex flex-col items-center pt-3 pl[2px]">
          <div className="flex flex-col justify-center w-min items-center">
            <div className="text-2xl leading-none text-gradient">
              {showOverall ? playerData.overall.overall : ''}
            </div>
            <span className="text-sm text-center w-min leading-1 text-gradient">
              {playerData.position.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="w-7 min-h-[9px] pl-[2px]">
              {playerData.country === 'IN' ? (
                <Image src={IndianFlagImage} alt="India Flag" width={25} height={7} />
              ) : playerData.country === 'VT' ? (
                <Image src={VanuatuFlagImage} alt="Vanuatu Flag" width={25} height={7} />
              ) : playerData.country === 'BR' ? (
                <Image src={BrazilFlagImage} alt="Brazil Flag" width={25} height={7} />
              ) : (
                <Flag code={playerData.country} alt="flag" width={25} height={7} />
              )}
            </div>
            {playerData.team === 'NH' && (
              <div className="pt-[3px] pl-[2px]">
                <Image src={NH} alt="team logo" width={24} height={24} />
              </div>
            )}
          </div>
        </div>
        <div className="h-full pb-[1px]">
          {playerData.image && (
            <Image
              className="h-full w-full"
              src={playerData.image}
              alt="player image"
              width={160}
              height={160}
            />
          )}
        </div>
      </div>
      <div className="text-center pt-[5px] pr-2 text-sm text-gradient">
        {playerData.name.toUpperCase()}
      </div>
      <div className="flex flex-row justify-center gap-1">
        <div className="flex flex-row justify-center gap-[2px] pr-3">
          {playerData.monthLVP && !playerData.monthStriker && (
            <AnchorIcon className="max-h-[18px] max-w-[18px] relative  bottom-[6px] text-[#c2aa73]" />
          )}
        </div>
      </div>
    </div>
    <style jsx>{`
      .text-gradient {
        background-image: linear-gradient(to bottom right, #9e7e47, #fbdd97);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
    `}</style>
  </div>
);

export const TeamOfTheMonthCard: React.FC<{ playerData: Player; showOverall: boolean }> = ({
  playerData,
  showOverall,
}) => (
  <BestOfMonthBadge playerData={playerData}>
    <div className="px-8 py-[18px]">
      <div className="flex flex-row min-h-[123px]">
        <div className="flex flex-col items-center mt-[31px] pt-1 ml-[7px] pl-[5px] pr-[5px] bg-gradient-to-t from-[#000000ca] to-[#00000025]">
          <div className="flex flex-col justify-center w-min items-center">
            <div className="text-2xl leading-[15px]">
              {showOverall ? playerData.overall.overall : ''}
            </div>
            <span className="text-sm text-center w-min leading-2 pt-1">
              {playerData.position.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="w-7 min-h-[9px] pl-[2px]">
              {playerData.country === 'IN' ? (
                <Image src={IndianFlagImage} alt="India Flag" width={25} height={7} />
              ) : playerData.country === 'VT' ? (
                <Image src={VanuatuFlagImage} alt="Vanuatu Flag" width={25} height={7} />
              ) : playerData.country === 'BR' ? (
                <Image src={BrazilFlagImage} alt="Brazil Flag" width={25} height={7} />
              ) : (
                <Flag code={playerData.country} alt="flag" width={25} height={7} />
              )}
            </div>
            {playerData.team === 'NH' && (
              <div className="pt-[3px] pl-[2px]">
                <Image src={NH} alt="team logo" width={24} height={24} />
              </div>
            )}
          </div>
        </div>
        <div className="h-full pb-[1px]">
          {playerData.image && (
            <Image
              className="h-full w-full"
              src={playerData.image}
              alt="player image"
              width={160}
              height={160}
            />
          )}
        </div>
      </div>
      <div className="text-center pt-[8px] text-sm">{playerData.name.toUpperCase()}</div>
      <div className="flex flex-row justify-center pr-3 gap-1">
        {playerData.monthStriker && playerData.monthTopPointer && (
          <>
            <Image
              src={StrikerNormal}
              alt="team logo"
              width={15}
              height={15}
              className="relative bottom-[7px] pt-[1px]"
            />
            <Image
              src={monthWinner}
              alt="team logo"
              width={15}
              height={15}
              className="relative bottom-[7px] pt-[2px]"
            />
          </>
        )}
        {playerData.monthStriker && playerData.monthLVP && (
          <div className="flex flex-row justify-center pr-3">
            <Image
              src={StrikerNormal}
              alt="team logo"
              width={15}
              height={15}
              className="relative bottom-[7px] pt-[1px]"
            />
            <AnchorIcon className="text-red-700 max-h-[15px] max-w-[15px] relative  bottom-[6px]" />
          </div>
        )}
      </div>
    </div>
  </BestOfMonthBadge>
);

export const NormalPlayerCard: React.FC<{ playerData: Player; showOverall: boolean }> = ({
  playerData,
  showOverall,
}) => (
  <Badge playerData={playerData}>
    <div className="px-8 py-[18px]">
      <div className="flex flex-row min-h-[123px]">
        <div className="flex flex-col items-center pt-[35px] pl-[9px]">
          <div className="flex flex-col justify-center w-min items-center">
            <div className="text-2xl leading-[15px]">
              {showOverall ? playerData.overall.overall : ''}
            </div>
            <span className="text-sm text-center w-min leading-2 pt-1">
              {playerData.position.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="w-7 min-h-[9px] pl-[2px]">
              {playerData.country === 'IN' ? (
                <Image src={IndianFlagImage} alt="India Flag" width={25} height={7} />
              ) : playerData.country === 'VT' ? (
                <Image src={VanuatuFlagImage} alt="Vanuatu Flag" width={25} height={7} />
              ) : playerData.country === 'BR' ? (
                <Image src={BrazilFlagImage} alt="Brazil Flag" width={25} height={7} />
              ) : (
                <Flag code={playerData.country} alt="flag" width={25} height={7} />
              )}
            </div>
            {playerData.team === 'NH' && (
              <div className="pt-[3px] pl-[2px]">
                <Image src={NH} alt="team logo" width={24} height={24} />
              </div>
            )}
          </div>
        </div>
        <div className="h-full pb-[1px]">
          {playerData.image && (
            <Image
              className="h-full w-full"
              src={playerData.image}
              alt="player image"
              width={160}
              height={160}
            />
          )}
        </div>
      </div>
      <div className="text-center pt-[8px] text-sm">{playerData.name.toUpperCase()}</div>
      <div className="flex flex-row justify-center gap-1">
        <div className="flex flex-row justify-center gap-[2px]">
          {playerData.monthLVP && !playerData.monthStriker && (
            <AnchorIcon className="max-h-[18px] max-w-[18px] relative  bottom-[6px]" />
          )}
        </div>
      </div>
    </div>
  </Badge>
);

export const PlayerCardSmall: React.FC<PlayerCardSmallProps> = ({ playerData, showOverall }) => {
  const renderPlayerCard = () => {
    if (playerData.monthChampion && playerData.monthTopPointer) {
      return <MostMVPCard playerData={playerData} showOverall={showOverall} />;
    } else if (playerData.monthChampion) {
      return <MonthChampionCard playerData={playerData} showOverall={showOverall} />;
    } else if (playerData.monthTopPointer) {
      return <MostPointerCard playerData={playerData} showOverall={showOverall} />;
    } else if (playerData.monthBestAssist && playerData.monthStriker) {
      return <PPGCard playerData={playerData} showOverall={showOverall} />;
    } else if (playerData.monthBestAssist) {
      return <AssistCard playerData={playerData} showOverall={showOverall} />;
    } else if (playerData.monthStriker) {
      return <StrikerCard playerData={playerData} showOverall={showOverall} />;
    } else if (playerData.monthBestDefender) {
      return <DefenderCard playerData={playerData} showOverall={showOverall} />;
    } else if (playerData.monthBestOfPosition) {
      return <TeamOfTheMonthCard playerData={playerData} showOverall={showOverall} />;
    } else if (playerData.isChampion) {
      return <WeekChampionCard playerData={playerData} showOverall={showOverall} />;
    } else {
      return <NormalPlayerCard playerData={playerData} showOverall={showOverall} />;
    }
  };

  return <>{renderPlayerCard()}</>;
};

export default PlayerCardSmall;
