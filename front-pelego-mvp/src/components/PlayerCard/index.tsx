'use client'
import { Player } from "@/types/player";
import { NH } from "@/utils/images";
import Image from "next/image";
import React from "react";
import Flag from "react-world-flags";

export interface StatsProps {
    stat: string;
    value: number;
}

export interface BadgeProps {
    playerData: Player;
    children: React.ReactNode;
}

export function Stats({ stat, value }: StatsProps) {
    return (
        <div className="flex flex-row gap-2 text-2xl">
            <span>{String(value)}</span>
            <span>{stat}</span>
        </div>
    );
}

const Badge: React.FC<BadgeProps> = ({ playerData, children }) => {
    const getBackgroundImage = () => {
        if (playerData.monthLVP) {
            return "bg-[url('../../public/lvp_large.png')] text-[#fdebd1]";
        }
        else if (playerData.overall.overall < 65) {
            return "bg-[url('../../public/bronze_large.png')] text-[#3A2717]";
        } else if (playerData.overall.overall < 74) {
            return "bg-[url('../../public/silver_large.png')] text-[#26292A]";
        } else {
            return "bg-[url('../../public/gold_large.png')] text-[#46390d]";
        }
    };

    const getShadow = () => {
        if (playerData.overall.overall >= 74) {
            return "shadow-tier-gold";
        } else if (playerData.overall.overall >= 65) {
            return "shadow-tier-silver";
        } else {
            return "shadow-tier-bronze";
        }
    };

    return (
        <div className={`${getBackgroundImage()} ${getShadow()} h-[500px] w-[450px] bg-contain bg-center bg-no-repeat transition-smooth hover:scale-105`}>
            {children}
        </div>
    );
}

const BestOfMonthBadge: React.FC<BadgeProps> = ({ playerData, children }) => {
    const getBackgroundImage = () => {
        if (playerData.overall.overall < 65) {
            return "bg-[url('../../public/BoP_bronze_large.png')] text-[#ecba8f]";
        } else if (playerData.overall.overall < 74) {
            return "bg-[url('../../public/BoP_silver_large.png')] text-[#F2F2F3]";
        } else {
            return "bg-[url('../../public/BoP_gold_large.png')] text-[#ffe28d]";
        }
    };

    const getShadow = () => {
        if (playerData.overall.overall >= 74) {
            return "shadow-tier-gold animate-trophy";
        } else if (playerData.overall.overall >= 65) {
            return "shadow-tier-silver";
        } else {
            return "shadow-tier-bronze";
        }
    };

    return (
        <div className={`${getBackgroundImage()} ${getShadow()} h-[500px] w-[450px] bg-contain bg-center bg-no-repeat transition-smooth hover:scale-105`}>
            {children}
        </div>
    );
};

export const TeamOfTheMonthCardLarge: React.FC<{ playerData: Player, showOverall: boolean }> = ({ playerData, showOverall }) => {
    const borderColor = 
         playerData.overall.overall > 73
        ? 'border-[#66572d]'
        : playerData.overall.overall > 64
        ? 'border-[#6f6f6f]'
        : 'border-[#6d4833]';

    return (
        <BestOfMonthBadge playerData={playerData}>
            <div className="px-[3.5rem] py-[60px]">
                <div className="flex flex-row h-[201px]">
                    <div className="flex flex-col items-center mt-[21px] pt-[13px] ml-[18px] pl-[6px] pr-[6px] bg-gradient-to-t from-[#000000ca] to-[#00000025]">
                        <div className="flex flex-col justify-center w-min items-center">
                            <div className="text-[2.8rem] leading-[1] h-[36px]">
                                {playerData?.overall?.overall}
                            </div>
                            <span className="text-xl text-center w-min leading-6 pt-1 min-h-7">
                                {playerData.position}
                            </span>
                        </div>
                        <div className="flex justify-center flex-col gap-1">
                            <span className={`border-b ${borderColor} w-[40px] m-auto`} />
                            <div className="flex justify-center">
                                <Flag code={playerData.country} alt="flag" width={46} height={22} />
                            </div>
                            <span className={`border-b ${borderColor} w-[40px] m-auto`} />
                            {playerData.team === 'NH' && (
                                <div className="flex justify-center">
                                    <Image src={NH} alt="team" width={46} height={46} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="h-full">
                        {playerData.image && (
                            <Image className="h-full w-full" src={playerData.image} alt="player image" width={250} height={250} />
                        )}
                    </div>
                </div>
                <div className="text-center py-[10px] text-4xl leading-none flex flex-col justify-center">
                    <span>{playerData.name.toUpperCase()}</span>
                    <span className={`border-b ${borderColor} w-[230px] m-auto`} />
                </div>
                <div className="w-full flex justify-center">
                    <div className="flex flex-row justify-between gap-6">
                        <div>
                            <Stats stat="PAC" value={playerData.overall?.pace} />
                            <Stats stat="SHO" value={playerData.overall?.shooting} />
                            <Stats stat="PAS" value={playerData.overall?.passing} />
                        </div>
                        <span className={`border-l ${borderColor} m-auto h-full`} />
                        <div>
                            <Stats stat="DRI" value={playerData.overall?.dribble} />
                            <Stats stat="DEF" value={playerData.overall?.defense} />
                            <Stats stat="PHY" value={playerData.overall?.physics} />
                        </div>
                    </div>
                </div>
            </div>
        </BestOfMonthBadge>
    );
};



const NormalPlayerCardLarge: React.FC<{ playerData: Player }> = ({ playerData }) => {
    const borderColor = playerData.monthLVP
        ? 'border-[#dcc5a6]'
        : playerData.overall.overall > 73
        ? 'border-[#bfa660]'
        : playerData.overall.overall > 64
        ? 'border-[#BFCACE]'
        : 'border-[#e8bc9d]';

    return (
        <Badge playerData={playerData}>
            <div className="px-[3.3rem] py-[84px]">
                <div className="flex flex-row h-[176px] px-7">
                    <div>
                        <div className="flex flex-col justify-center w-min items-center">
                            <div className="text-[2.8rem] leading-[1] h-[36px]">
                                {playerData?.overall?.overall}
                            </div>
                            <span className="text-xl text-center w-min leading-6 pt-1 min-h-7">
                                {playerData.position}
                            </span>
                        </div>

                        <div className="flex justify-center flex-col gap-1">
                            <span className={`border-b ${borderColor} w-[40px] m-auto`} />
                            <div className="flex justify-center">
                                <Flag code={playerData.country} alt="flag" width={46} height={22} />
                            </div>
                            <span className={`border-b ${borderColor} w-[40px] m-auto`} />
                            {playerData.team === 'NH' && (
                                <div className="flex justify-center">
                                    <Image src={NH} alt="team" width={46} height={46} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        {playerData.image && (
                            <Image
                                src={typeof playerData.image === 'string' ? playerData.image : playerData.image.src}
                                alt="player"
                                width={26}
                                height={26}
                            />
                        )}
                    </div>
                </div>
                <div className="text-center py-[10px] text-4xl leading-none flex flex-col justify-center">
                    <span>{playerData.name.toUpperCase()}</span>
                    <span className={`border-b ${borderColor} w-[230px] m-auto`} />
                </div>
                <div className="w-full flex justify-center">
                    <div className="flex flex-row justify-between gap-6">
                        <div>
                            <Stats stat="PAC" value={playerData.overall?.pace} />
                            <Stats stat="SHO" value={playerData.overall?.shooting} />
                            <Stats stat="PAS" value={playerData.overall?.passing} />
                        </div>
                        <span className={`border-l ${borderColor} m-auto h-full`} />
                        <div>
                            <Stats stat="DRI" value={playerData.overall?.dribble} />
                            <Stats stat="DEF" value={playerData.overall?.defense} />
                            <Stats stat="PHY" value={playerData.overall?.physics} />
                        </div>
                    </div>
                </div>
            </div>
        </Badge>
    );
};




export const PlayerCard: React.FC<{ playerData: Player }> = ({ playerData }) => {
    const renderPlayerCard = () => {
        // if (playerData.monthChampion && playerData.monthTopPointer) {
        //     return <MostMVPCardLarge playerData={playerData} />;
        // } else if (playerData.monthChampion) {
        //     return <MonthChampionCardLarge playerData={playerData} />;
        // } else if (playerData.monthTopPointer) {
        //     return <MostPointerCardLarge playerData={playerData} />;
        // } else if (playerData.monthTopAssist && playerData.monthStriker) { 
        //     return <PPGCardLarge playerData={playerData} />;
        // } else if (playerData.monthTopAssist) { 
        //     return <AssistCardLarge playerData={playerData} />;
        // } else if (playerData.monthStriker) {
        //     return <StrikerCardLarge playerData={playerData} />;
        // } else if (playerData.monthBestDefender) { 
        //     return <DefenderCardLarge playerData={playerData} />;
         if (playerData.monthBestOfPosition) {
            return <TeamOfTheMonthCardLarge playerData={playerData} showOverall/>;
         } else {
            return <NormalPlayerCardLarge playerData={playerData} />;
        }
    };

    return <>{renderPlayerCard()}</>;
};
