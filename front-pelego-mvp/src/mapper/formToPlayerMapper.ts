import { Player, PlayerGetOverallFormData } from "@/types/player";

export const formToPlayerMapper = (formData: PlayerGetOverallFormData, overallValue:number): Player => {
    const { name, overall, position,country } = formData;

    const player: Player = {
        name,
        overall: {
            pace: Number(overall.pace),
            shooting: Number(overall.shooting),
            passing: Number(overall.passing),
            dribble: Number(overall.dribble),
            defense: Number(overall.defense),
            physics: Number(overall.physics),
            overall: overallValue,
        },
        position,
        country
    };

    return player;
};