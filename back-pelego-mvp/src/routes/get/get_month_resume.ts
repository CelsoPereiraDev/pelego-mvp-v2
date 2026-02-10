import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { MonthResumeService } from "../../services/monthResumeService";

interface GetMonthResumeParams {
  year: string;
  month?: string;
}

interface GetMonthResumeQuerystring {
  excludePlayerIds?: string;
}

export async function getMonthResumeHandler(app: FastifyInstance) {
  app.get(
    '/stats/month-resume/:year/:month?',
    async (
      request: FastifyRequest<{
        Params: GetMonthResumeParams;
        Querystring: GetMonthResumeQuerystring;
      }>,
      reply: FastifyReply
    ) => {
      const { year, month } = request.params;
      const { excludePlayerIds } = request.query;

      try {
        // Parse excluded player IDs from comma-separated string
        const excludedIds = excludePlayerIds
          ? excludePlayerIds.split(',').map(id => id.trim()).filter(id => id.length > 0)
          : [];

        const service = new MonthResumeService();
        const resume = await service.calculateMonthResume(year, month, excludedIds);

        reply.status(200).send(resume);
      } catch (error) {
        console.error("Erro ao calcular resumo do mês:", error);
        reply.status(500).send({
          error: 'Erro ao calcular resumo do mês',
          details: error instanceof Error ? error.message : error
        });
      }
    }
  );
}
