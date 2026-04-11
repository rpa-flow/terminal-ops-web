import { app } from "./app";
import { env } from "./config";

app.listen(env.PORT, () => {
  // Intentionally minimal startup log without secrets.
  console.log(`API listening on port ${env.PORT}`);
});