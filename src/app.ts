import express, { Application } from 'express';
import bodyParser from 'body-parser';
import healthRoutes from './routes/health.routes';
import globalPriceRoutes from './routes/globalprice.routes';

const app: Application = express();

app.use(bodyParser.json());

app.use(healthRoutes);
app.use(globalPriceRoutes);


export default app;