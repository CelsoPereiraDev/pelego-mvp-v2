import cors from '@fastify/cors';
import fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { createGoalsHandler } from './routes/create/create_goals';
import { createMatchHandler } from './routes/create/create_match';
import { createPlayer } from "./routes/create/create_player";
import { deletePlayer } from './routes/delete/delete_player';
import { updatePlayerHandler } from './routes/edit/edit_player';
import { getMatchesHandler } from './routes/get/get_matches';
import { getPlayer } from './routes/get/get_player';
import { getPlayers } from './routes/get/get_players';

import { createWeekHandler } from './routes/create/create_week';
import { createWeekAndMatchesHandler } from './routes/create/create_week_and_matches';
import { deleteWeekHandler } from './routes/delete/delete_week';
import { updatePlayerScoresHandler } from './routes/edit/edit_player_scores';
import { updateTeamsHandler } from './routes/edit/edit_teams';
import { updateWeekAndMatchesHandler } from './routes/update/update_week_and_matches';
import { getTeamsHandler } from './routes/get/get_teams';
import { getWeekHandler } from './routes/get/get_week';
import { getWeeksHandler } from './routes/get/get_weeks';
import { getWeeksByDateHandler } from './routes/get/get_weeks_by_date';
import { getMonthResumeHandler } from './routes/get/get_month_resume';


const app = fastify();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Registra o plugin de CORS
app.register(cors, { 
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'], 
});

// Registra de rotas 

// PLAYER
app.register(createPlayer, { prefix: '/api' });
app.register(getPlayers, { prefix: '/api' });
app.register(getPlayer, { prefix: '/api' });
app.register(deletePlayer, { prefix: '/api' });
app.register(updatePlayerHandler, { prefix: '/api' });

// MATCHES
app.register(createMatchHandler, { prefix: '/api' });
app.register(createWeekHandler, { prefix: '/api' });
app.register(createWeekAndMatchesHandler, { prefix: '/api' });
app.register(getMatchesHandler, { prefix: '/api' });

// GOALS
app.register(createGoalsHandler, { prefix: '/api' });

// WEEKS
app.register(getWeeksHandler, { prefix: '/api' });
app.register(getWeekHandler, { prefix: '/api' });
app.register(getWeeksByDateHandler, {prefix: '/api'});
app.register(updateWeekAndMatchesHandler, { prefix: '/api' });

// STATS
app.register(getMonthResumeHandler, { prefix: '/api' });

// TEAMS
app.register(getTeamsHandler, { prefix: '/api' });
app.register(updateTeamsHandler, { prefix: '/api' });
app.register(deleteWeekHandler, { prefix: '/api' });

// SCORES
app.register(updatePlayerScoresHandler, { prefix: '/api' });

app.listen({ port: 3334 }).then(() => {
    console.log('Server running on port 3333!');
});
