import { createApp } from './infrastructure/server';
import { config } from './infrastructure/config';

const app = createApp();

app.listen(config.PORT, () => {
  console.log(`🚀 Roamie API running on http://localhost:${config.PORT}`);
  console.log(`📡 Ollama endpoint: ${config.OLLAMA_BASE_URL}`);
  console.log(`🌐 Frontend URL: ${config.FRONTEND_URL}`);
});
