import { prisma } from '../lib/prisma';
import { calculateMonthResume } from '../utils/stats/calculateMonthResume';
import { MonthResumeProps } from '../utils/stats/types';

export class MonthResumeService {
  async calculateMonthResume(
    year: string,
    month?: string,
    excludePlayerIds: string[] = []
  ): Promise<MonthResumeProps> {
    // Get weeks in the specified date range (same logic as get_weeks_by_date)
    const startDate = new Date(`${year}-${month || '01'}-01`);
    const endDate = month ? new Date(`${year}-${month}-31`) : new Date(`${year}-12-31`);

    const weeks = await prisma.week.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        teams: {
          include: {
            players: {
              include: {
                player: true
              }
            },
            matchesHome: {
              include: {
                result: true,
                goals: {
                  include: {
                    player: true,
                    ownGoalPlayer: true
                  }
                },
                assists: {
                  include: {
                    player: true
                  }
                }
              }
            },
            matchesAway: {
              include: {
                result: true,
                goals: {
                  include: {
                    player: true,
                    ownGoalPlayer: true
                  }
                },
                assists: {
                  include: {
                    player: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Calculate all stats
    return calculateMonthResume(weeks, excludePlayerIds);
  }
}
