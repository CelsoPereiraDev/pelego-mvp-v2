interface CalculateOverallProps {
    position: string;
    overall: {
      pace: number;
      shooting: number;
      passing: number;
      dribble: number;
      defense: number;
      physics: number;
    };
  }

export function calculateOverall({ position, overall }: CalculateOverallProps): number {
    let pace = overall.pace;
    let shooting = overall.shooting;
    let passing = overall.passing;
    let dribble = overall.dribble;
    let defense = overall.defense;
    let physics = overall.physics;
  
    if (position === 'DEF') {
      pace *= 2;
      shooting *= 2;
      passing *= 3;
      dribble *= 1;
      defense *= 6;
      physics *= 3;
    } else if (position === 'MEI') {
      pace *= 3;
      shooting *= 3;
      passing *= 3;
      dribble *= 3;
      defense *= 3;
      physics *= 3;
    } else if (position === 'ATK') {
      pace *= 3;
      shooting *= 5;
      passing *= 2;
      dribble *= 4;
      defense *= 1;
      physics *= 3;
    }
  
    const total = (pace + shooting + passing + dribble + defense + physics) / 18;
  
    return Math.round(total);
  }