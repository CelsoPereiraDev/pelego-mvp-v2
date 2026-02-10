// import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";



// export async function updateMonthPrizesHandler(app: FastifyInstance) {
//   app.patch('/update_month_prizes', async (request: FastifyRequest, reply: FastifyReply) => {
//     const { players } = request.body;

//     try {
//       const result = await updateAllMonthPrizes(players);

//       reply.status(200).send({
//         message: 'Prêmios mensais atualizados com sucesso',
//         result,
//       });
//     } catch (error) {
//       console.error('Erro ao atualizar prêmios mensais:', error);
//       reply.status(500).send({
//         error: 'Erro ao atualizar prêmios mensais',
//         details: error,
//       });
//     }
//   });
// }
