interface CalculateOverallProps {
    position: 'DEF' | 'MEI' | 'ATK' | 'GOL';
    overall: {
        pace: string;
        shooting: string;
        passing: string;
        dribble: string;
        defense: string;
        physics: string;
    };
}

export function calculateOverall({ position, overall }: CalculateOverallProps): number {
    if (!overall) {
        return 0;
    }

    const {
        pace = '0',
        shooting = '0',
        passing = '0',
        dribble = '0',
        defense = '0',
        physics = '0'
    } = overall;
    
    let paceNum = Number(pace);
    let shootingNum = Number(shooting);
    let passingNum = Number(passing);
    let dribbleNum = Number(dribble);
    let defenseNum = Number(defense);
    let physicsNum = Number(physics);

    if (position === 'DEF') {
        paceNum *= 2;
        shootingNum *= 2;
        passingNum *= 3;
        dribbleNum *= 1;
        defenseNum *= 6;
        physicsNum *= 4;
    } else if (position === 'MEI' || position === 'GOL') {
        paceNum *= 3;
        shootingNum *= 3;
        passingNum *= 3;
        dribbleNum *= 3;
        defenseNum *= 3;
        physicsNum *= 3;
    } else if (position === 'ATK') {
        paceNum *= 3;
        shootingNum *= 5;
        passingNum *= 2;
        dribbleNum *= 4;
        defenseNum *= 1;
        physicsNum *= 3;
    }

    const total = (paceNum + shootingNum + passingNum + dribbleNum + defenseNum + physicsNum) / 18;

    return Math.round(total);
}
